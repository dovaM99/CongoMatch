import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { Select } from '@/components/Select';
import { Button, Field, Header, Row, Screen, Txt } from '@/components/ui';
import { COUNTRIES, type CountryCode } from '@/data/catalog';
import { useApp, useServices } from '@/store/app';

const IN: Partial<Record<CountryCode, string>> = { CM: 'au Cameroun', AO: 'en Angola', TD: 'au Tchad', CF: 'en Centrafrique' };

export default function PhoneScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const signup = mode !== 'login';
  const svc = useServices();
  const { showToast } = useApp();
  const [country, setCountry] = useState<CountryCode>('CG');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const c = COUNTRIES.find((x) => x.code === country)!;
  const digits = phone.replace(/\D/g, '');

  async function send() {
    if (digits.length < 8) {
      showToast('Entrez un numéro valide');
      return;
    }
    setBusy(true);
    try {
      const r = await svc.auth.requestOtp(country, digits);
      router.push({ pathname: '/auth/otp', params: { requestId: r.requestId, devCode: r.devCode ?? '', phone: `${c.dial} ${phone}`, country } });
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header />
      <Screen bottomInset={false}>
        <View style={{ gap: 8 }}>
          <Txt v="h1">{signup ? 'Créer un compte' : 'Content de vous revoir'}</Txt>
          <Txt v="small">Votre numéro reste privé. Il sert uniquement à vérifier que vous êtes une vraie personne.</Txt>
        </View>
        <Select
          label="Pays"
          value={country}
          options={COUNTRIES.map((x) => ({
            value: x.code,
            label: x.name,
            left: x.flag,
            right: x.available ? `${x.dial} · ${x.city}` : x.dial,
            badge: x.available ? undefined : 'Bientôt',
            disabled: !x.available,
          }))}
          onChange={setCountry}
          disabledMessage={(o) => `${o.left} CongoMatch arrive bientôt ${IN[o.value] ?? `en ${o.label}`}. Restez connecté !`}
        />
        <Field label="Numéro de téléphone" prefix={c.dial} keyboardType="phone-pad" autoComplete="tel" placeholder={c.placeholder} value={phone} onChangeText={setPhone} maxLength={14} />
        <Button title="Recevoir le code par SMS" icon="chatbubble-ellipses" onPress={send} loading={busy} />
        <Row style={{ alignItems: 'flex-start' }}>
          <Txt v="small" style={{ flex: 1 }}>🔐 Code à 6 chiffres. Votre numéro n'est jamais affiché sur votre profil.</Txt>
        </Row>
      </Screen>
    </KeyboardAvoidingView>
  );
}
