# CongoMatch : préparer le backend

Le front est prêt et tourne entièrement sur des services simulés (`src/services/mock`). Chaque appel passe par une interface TypeScript dans `src/services/types.ts`. Pour brancher le vrai backend, on écrit une implémentation HTTP de chaque interface (`src/services/http/`) et on passe `EXPO_PUBLIC_API_MODE=http`. Aucun écran n'est à modifier.

## 1. Ce qu'il faut ouvrir ou acheter

| Quoi | Pour quoi faire | Délai typique | Qui fournit les clés |
|---|---|---|---|
| Hébergement API + base de données | Serveur Node (NestJS ou Fastify) + PostgreSQL + Redis | 1 jour | Supabase, Railway, Render ou AWS |
| Stockage des photos et notes vocales | Fichiers privés, liens signés | 1 jour | Cloudflare R2 (le moins cher), AWS S3 |
| SMS OTP | Code à 6 chiffres à l'inscription | 1 à 2 semaines (validation de l'expéditeur « CongoMatch » par pays) | Africa's Talking, Infobip ou Twilio |
| MTN MoMo Congo-Brazzaville | Paiement des forfaits et des pièces | 2 à 6 semaines (contrat marchand + KYC société) | Portail développeur MTN MoMo (momodeveloper.mtn.com), puis MTN Congo pour la production |
| Airtel Money Congo-Brazzaville | Idem | 2 à 6 semaines | Airtel Africa Developers (developers.airtel.africa) |
| M-Pesa RDC (Vodacom) | Idem côté Kinshasa | 4 à 8 semaines | Vodacom M-Pesa Open API |
| Orange Money RDC | Idem | 4 à 8 semaines | Orange Developer, contrat Orange RDC |
| Airtel Money RDC | Idem | 2 à 6 semaines | Airtel Africa Developers |
| Alternative : agrégateur | Un seul contrat pour plusieurs opérateurs | 1 à 3 semaines | CinetPay, PawaPay ou Flutterwave |
| Modération des photos | Détection de nudité et de mineurs, file humaine | 1 jour | AWS Rekognition, Sightengine ou Hive |
| Notifications push | Nouveaux matchs, messages, cadeaux | 1 jour | Expo Push (compte Expo) |
| Comptes stores | Publication | 1 à 2 semaines | Apple Developer (99 $/an), Google Play (25 $) |

Conseil : commencer avec un agrégateur (PawaPay couvre MTN, Airtel, M-Pesa et Orange dans les deux Congo) permet de lancer plus vite, puis de passer en direct opérateur quand le volume justifie la commission.

Toutes les clés vont dans les variables d'environnement du serveur (voir `.env.example`). Aucune clé ne doit être dans le dépôt ni dans l'application mobile.

## 2. Base de données (PostgreSQL)

```
users            id, phone_e164 (unique, chiffré), country, created_at, is_admin, status (active|banned|deleted)
profiles         user_id, first_name, birth_date, gender, market (CG|CD), city, district, bio, intention,
                 height_cm, education_rank, languages[], passions[], prompt_q, prompt_a, verified, location (PostGIS point)
photos           id, user_id, kind (portrait|public|private), storage_key, position, moderation (pending|approved|rejected), reviewed_by, created_at
preferences      user_id, seek, age_min, age_max, intentions[], height_min, height_max, education_min_rank,
                 languages[], verified_only, cities[], max_distance_km
likes            from_user, to_user, created_at          (unique from/to)
passes           from_user, to_user, created_at
matches          id, user_a, user_b, created_at, unmatched_at
conversations    id, match_id, voice_unlocked, voice_unlocked_by
messages         id, conversation_id, from_user, type (text|voice|gift|voice_request|system), body, gift_id,
                 media_key, duration_sec, request_state, status, created_at
blocks           user_id, blocked_user_id
reports          id, reporter_id, target_id, reason, note, status, created_at
subscriptions    id, user_id, tier (1|2|3), started_at, ends_at, payment_id
wallets          user_id, balance            (jamais exposé à un autre utilisateur)
wallet_ledger    id, user_id, delta, reason (purchase|gift_sent|monthly_bonus|welcome|refund), ref_id, created_at
gifts            id, category, name, cost_coins, active
payments         id, user_id, item_kind, item_id, operator, msisdn, amount, currency, promo_id,
                 status (pending|awaiting_pin|succeeded|failed|cancelled), provider_ref, raw_callback, created_at
promos           id, title, percent_off, target_kind, target_id, markets[], starts_at, ends_at, created_by, active
otp_requests     id, phone_hash, code_hash, attempts, expires_at
team_accounts    user_id, role (ambassador|support), display_label
```

Règles importantes côté serveur :
- Le solde de pièces (`wallets`) n'est renvoyé qu'à son propriétaire.
- Les photos `private` ne sont servies qu'aux matchs, par lien signé de courte durée, et seulement si `moderation = approved`.
- L'âge est recalculé à chaque inscription : refus en dessous de 18 ans.
- Les règles d'accès par forfait (`src/lib/rules.ts`) sont appliquées par l'API, pas seulement par l'application.
- Un forfait affiche les noms de la ville du membre (Widge, Ndelet, Suspendu à Brazzaville ; Tokoss, Mopao, Boss à Kinshasa).

## 3. Services de l'API

Chaque service correspond à une interface de `src/services/types.ts`.

| Service | Endpoints |
|---|---|
| Auth | `POST /auth/otp`, `POST /auth/otp/verify`, `POST /auth/logout` |
| Profil | `GET /me`, `PATCH /me`, `POST /me/photos` (renvoie une URL d'upload signée), `GET /profiles/:id` |
| Découverte | `POST /discovery/deck` (préférences), `POST /likes/:id`, `POST /passes/:id`, `GET /likes/received` |
| Chat | `GET /conversations`, `GET /conversations/:id/messages`, `POST /conversations/:id/messages`, `POST /conversations/:id/voice-request`, `POST /messages/:id/answer`, WebSocket `/ws` pour le temps réel |
| Portefeuille | `GET /wallet`, `GET /wallet/ledger` |
| Paiements | `POST /payments`, `GET /payments/:id`, webhooks `POST /webhooks/mtn`, `/webhooks/airtel`, `/webhooks/mpesa`, `/webhooks/orange` |
| Abonnement | `GET /subscription` |
| Promos | `GET /promos?market=CG`, admin : `POST /admin/promos`, `POST /admin/promos/:id/end` |
| Modération | `POST /reports`, `POST /blocks`, file interne pour les photos et signalements |

Flux de paiement : l'app appelle `POST /payments`, le serveur envoie la demande à l'opérateur, le membre tape son PIN sur son téléphone, l'opérateur appelle le webhook, le serveur active le forfait ou crédite les pièces, puis prévient l'app par WebSocket. Le serveur vérifie toujours le montant et la promo lui-même.

Promos : l'administrateur fixe une date de fin. Le compte à rebours affiché à tous les membres lit cette date. Il ne se remet jamais à zéro.

## 4. Comptes « bots » : ce qui est préparé à la place

Des faux profils qui matchent puis ignorent les membres pour pousser à payer tromperaient des clients payants : ce n'est pas construit. À la place, l'application prévoit des comptes officiels clairement étiquetés « Équipe CongoMatch » (`team_accounts`) : message de bienvenue, conseils de sécurité, annonces de promos, et des ambassadeurs locaux (une personne réelle par ville) qui animent la communauté sous ce même label. Ils ne participent jamais au matching.

Pour remplir l'application au lancement, les leviers honnêtes sont : une liste d'attente par quartier avant l'ouverture, des invitations parrainées avec pièces offertes, et des soirées partenaires à Brazzaville et Kinshasa.

## 5. Ordre de travail conseillé

1. API Auth + Profil + stockage photos + modération (on peut s'inscrire pour de vrai).
2. Découverte + likes + matchs + chat temps réel.
3. Portefeuille, cadeaux, paiements via un agrégateur en sandbox.
4. Abonnements, promos admin, notifications push.
5. Passage en production opérateurs, puis publication sur les stores.
