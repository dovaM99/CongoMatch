import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Header, Press, Row, Screen, Toggle, Txt } from '@/components/ui';
import { UpsellSheet } from '@/components/Upsell';
import { tierById } from '@/data/catalog';
import { Rules } from '@/lib/rules';
import { API_MODE } from '@/services';
import { useApp } from '@/store/app';
import { Base } from '@/theme/tokens';

export default function Settings() {
  const app = useApp();
  const { tier, market, session, prefs } = app;
  const [incognito, setIncognito] = useState(false);
  const [maskContacts, setMaskContacts] = useState(false);
  const [upsell, setUpsell] = useState(false);
  const t = tierById(tier);

  const Item = ({ icon, title, sub, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; sub?: string; onPress: () => void }) => (
    <Press onPress={onPress} scaleTo={0.98}>
      <Row style={{ paddingVertical: 12 }}>
        <Ionicons name={icon} size={21} color={Base.ink} />
        <View style={{ flex: 1 }}>
          <Txt>{title}</Txt>
          {sub && <Txt v="tiny">{sub}</Txt>}
        </View>
        <Ionicons name="chevron-forward" size={18} color={Base.ink3} />
      </Row>
    </Press>
  );

  return (
    <View style={{ flex: 1 }}>
      <Header title="Réglages" />
      <Screen bottomInset={false}>
        <Card>
          <Item icon="person-outline" title="Modifier le profil" onPress={() => router.push('/onboarding?edit=1')} />
          <Item icon="options-outline" title="Filtres de découverte" sub={`${prefs.ageMin}–${prefs.ageMax} ans`} onPress={() => router.push('/filters')} />
          <Item icon="diamond-outline" title="Mon forfait" sub={t ? `${t.name} · ${t.local[market]}` : 'Gratuit'} onPress={() => router.push('/plans')} />
          <Item icon="wallet-outline" title="Mes Pièces" sub="Recharger, historique" onPress={() => router.push('/wallet')} />
        </Card>

        <Txt v="label">Confidentialité</Txt>
        <Card>
          <Row>
            <View style={{ flex: 1 }}>
              <Txt>Masquer mes contacts</Txt>
              <Txt v="tiny">Vos contacts ne vous voient pas, et vous ne les voyez pas. Seule une empreinte chiffrée des numéros quitte le téléphone.</Txt>
            </View>
            <Toggle value={maskContacts} onChange={(v) => { setMaskContacts(v); app.showToast(v ? 'Contacts masqués (démo)' : 'Contacts visibles'); }} />
          </Row>
          <Row>
            <View style={{ flex: 1 }}>
              <Txt>Mode Incognito</Txt>
              <Txt v="tiny">Seules les personnes que vous likez vous voient.</Txt>
            </View>
            <Toggle value={incognito} locked={!Rules.canUseIncognito(tier)} onChange={(v) => (Rules.canUseIncognito(tier) ? setIncognito(v) : setUpsell(true))} />
          </Row>
        </Card>

        {(session?.isAdmin || __DEV__) && (
          <>
            <Txt v="label">Administration</Txt>
            <Card style={{ borderColor: 'rgba(242,179,61,0.4)' }}>
              <Item icon="pricetags-outline" title="Promotions" sub="Créer une promo avec compte à rebours" onPress={() => router.push('/admin/promos')} />
              {!session?.isAdmin && <Txt v="tiny">Visible ici car l'app tourne en mode développeur.</Txt>}
            </Card>
          </>
        )}

        <Txt v="label">Sécurité</Txt>
        <Card>
          <Txt v="small">Premier rendez-vous dans un lieu public. Ne partagez jamais votre code PIN Mobile Money ni vos codes SMS. Signalez tout profil suspect depuis sa fiche.</Txt>
        </Card>

        <Button title="Se déconnecter" variant="ghost" icon="log-out-outline" shine={false} onPress={async () => { await app.signOut(); router.replace('/'); }} />
        <Txt v="tiny" center>CongoMatch 0.1.0 · services : {API_MODE}</Txt>
      </Screen>
      <UpsellSheet reason={upsell ? 'incognito' : null} onClose={() => setUpsell(false)} />
    </View>
  );
}
