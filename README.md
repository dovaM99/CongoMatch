# CongoMatch

Application de rencontre pour Brazzaville et Kinshasa. Expo SDK 57, React Native, TypeScript, Expo Router.

## Lancer en mode développeur

```bash
npm install
npx expo start          # puis « w » pour le navigateur, ou scanner le QR code
```

Sur téléphone : le lecteur vidéo, le flou et le sélecteur de photos sont des modules natifs. Si Expo Go refuse un module, faites un build de développement : `npx expo run:ios` ou `npx expo run:android` (ou `npx eas-cli build --profile development`).

Tout fonctionne sans backend : les services simulés (`src/services/mock`) gardent les données sur l'appareil. Le code SMS s'affiche à l'écran en mode développeur. Les paiements Mobile Money sont simulés (aucun débit).

Réinitialiser la démo : Profil → Réglages → Se déconnecter.

## Ce qu'il y a dans l'app

- Landing vidéo (Mpila de nuit, sans son) avec le nouveau logo.
- Inscription : pays en menu déroulant (Congo-Brazzaville, RD Congo ; Cameroun, Angola, Tchad, Centrafrique annoncés « bientôt »), numéro, code SMS.
- Onboarding : identité et date de naissance (18 ans minimum), ce qu'on cherche (sérieux, mariage, flirt, on verra, amitié), filtres de base (âge, taille, niveau d'étude Brazza ↔ Kin, langues), au moins 2 photos dont un portrait, photo privée optionnelle visible des seuls matchs (modérée), bio et passions.
- Découvrir : cartes à swiper, carrousel de photos, filtres (filtre géographique réservé à Gold et plus).
- Messages, chat, cadeaux (dès 100 FCFA), notes vocales ; un membre sans notes vocales peut demander à un membre d'un forfait supérieur de les activer pour leur conversation.
- Forfaits Plus, Gold, Platinum : on ne voit que ceux de sa ville (Widge / Ndelet / Suspendu ou Tokoss / Mopao / Boss). Le thème de toute l'app change avec le forfait.
- Mes Pièces : solde privé, recharges, historique.
- Promos avec compte à rebours réel, créées depuis la console admin (Réglages → Promotions).
- Menu en verre dépoli et reflet lumineux qui parcourt chaque bouton.

## Structure

```
src/app/          écrans (Expo Router)
src/components/   UI (Button, Shine, GlassTabBar, SwipeCard, PhotoGrid…)
src/services/     interfaces backend (types.ts), mocks, client HTTP
src/store/        état global
src/data/         catalogue (forfaits, cadeaux, pays, niveaux d'étude) et profils démo
src/lib/          règles d'accès par forfait, formatage
assets/source/    fichiers d'origine (vidéo, logo)
docs/BACKEND.md   ce qu'il faut préparer pour le backend
```

## Brancher le backend

Voir [docs/BACKEND.md](docs/BACKEND.md). Copier `.env.example` vers `.env.local`. Aucune clé ne doit être commitée.
