import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, Header, Screen, Txt } from '@/components/ui';
import { API_MODE } from '@/services';
import { isProfileComplete, useApp, useServices } from '@/store/app';
import { Base, Fonts, Radius } from '@/theme/tokens';

export default function OtpScreen() {
  const params = useLocalSearchParams<{ requestId: string; devCode?: string; phone: string; country: string }>();
  const svc = useServices();
  const { setSession, showToast, theme } = useApp();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState(params.requestId);
  const [devCode, setDevCode] = useState(params.devCode);
  const input = useRef<TextInput>(null);

  async function verify(value = code) {
    if (value.length !== 6) return;
    setBusy(true);
    try {
      const session = await svc.auth.verifyOtp(requestId, value);
      await setSession(session);
      const me = await svc.profile.getMe();
      if (isProfileComplete(me)) router.replace('/discover');
      else router.replace({ pathname: '/onboarding', params: { country: params.country } });
    } catch (e) {
      showToast((e as Error).message, 'warn');
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    const r = await svc.auth.requestOtp(params.country as 'CG', params.phone);
    setRequestId(r.requestId);
    setDevCode(r.devCode);
    showToast('Nouveau code envoyé');
  }

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <Screen bottomInset={false}>
        <View style={{ gap: 8 }}>
          <Txt v="h1">Code de vérification</Txt>
          <Txt v="small">Envoyé par SMS au {params.phone}</Txt>
        </View>
        {API_MODE === 'mock' && !!devCode && (
          <Card style={{ borderStyle: 'dashed' }}>
            <Txt v="label">Mode développeur</Txt>
            <Txt v="small">Aucun SMS n'est envoyé en mode démo. Votre code est <Text style={{ color: Base.ink, fontFamily: Fonts.bodyBold }}>{devCode}</Text>.</Txt>
          </Card>
        )}
        <Pressable onPress={() => input.current?.focus()} style={s.cells} accessibilityLabel="Code à 6 chiffres">
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={[s.cell, i === Math.min(code.length, 5) && { borderColor: theme.accent }]}>
              <Text style={s.digit}>{code[i] ?? ''}</Text>
            </View>
          ))}
          <TextInput
            ref={input}
            value={code}
            onChangeText={(t) => {
              const v = t.replace(/\D/g, '').slice(0, 6);
              setCode(v);
              if (v.length === 6) verify(v);
            }}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            autoFocus
            maxLength={6}
            style={s.hidden}
          />
        </Pressable>
        <Button title="Vérifier" onPress={() => verify()} loading={busy} disabled={code.length !== 6} />
        <Pressable onPress={resend} style={{ alignSelf: 'center', padding: 8 }}>
          <Txt v="small">Pas reçu ? <Text style={{ color: theme.accent, fontFamily: Fonts.bodyBold }}>Renvoyer le code</Text></Txt>
        </Pressable>
      </Screen>
    </View>
  );
}

const s = StyleSheet.create({
  cells: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  cell: { flex: 1, aspectRatio: 0.82, maxWidth: 58, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Base.lineStrong, backgroundColor: Base.surface, alignItems: 'center', justifyContent: 'center' },
  digit: { fontFamily: Fonts.display, fontSize: 24, color: Base.ink },
  hidden: { position: 'absolute', opacity: 0, width: '100%', height: '100%' },
});
