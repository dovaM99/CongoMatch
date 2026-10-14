import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { PhotoGrid } from '@/components/PhotoGrid';
import { RangeSlider } from '@/components/RangeSlider';
import { Select } from '@/components/Select';
import { Button, Chip, Chips, Field, Header, Row, Screen, Steps, Txt } from '@/components/ui';
import { EDUCATION, HEIGHT_MAX, HEIGHT_MIN, INTENTIONS, LANGUAGES, MARKET, PASSIONS, type MarketId } from '@/data/catalog';
import { ageFrom, MIN_AGE, parseFrDate } from '@/lib/rules';
import type { Gender, Photo, Preferences, Profile } from '@/services/types';
import { defaultPrefs, useApp } from '@/store/app';

const STEPS = ['Vous', 'Ce que vous cherchez', 'Vos critères', 'Vos photos', 'Votre bio'];

const isoToFr = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '');

/**
 * Sign-up flow after the phone check, also used to edit the profile (?edit=1).
 * Collects identity (18+), intention and base filters, photos, then bio.
 */
export default function Onboarding() {
  const params = useLocalSearchParams<{ country?: string; edit?: string; step?: string }>();
  const editing = params.edit === '1';
  const { me, prefs: savedPrefs, saveProfile, setPrefs, showToast } = useApp();
  const market: MarketId = (me?.market ?? (params.country === 'CD' ? 'CD' : 'CG')) as MarketId;

  const [step, setStep] = useState(Number(params.step ?? 0));
  const [busy, setBusy] = useState(false);
  const [p, setP] = useState<Partial<Profile>>({
    firstName: '',
    gender: 'h',
    market,
    city: MARKET[market].city,
    intention: 'serieux',
    languages: ['Français', 'Lingala'],
    passions: [],
    photos: [],
    bio: '',
    heightCm: 172,
    ...me,
  });
  const [birth, setBirth] = useState(isoToFr(me?.birthDate));
  const [prefs, setLocalPrefs] = useState<Preferences>(me ? savedPrefs : defaultPrefs('h'));
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));
  const setPf = (patch: Partial<Preferences>) => setLocalPrefs((x) => ({ ...x, ...patch }));
  const toggle = (list: string[] = [], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function validate(): string | null {
    if (step === 0) {
      if (!p.firstName?.trim()) return 'Entrez votre prénom';
      const iso = parseFrDate(birth);
      if (!iso) return 'Date de naissance au format JJ/MM/AAAA';
      if (ageFrom(iso) < MIN_AGE) return 'CongoMatch est réservé aux personnes de 18 ans et plus.';
    }
    if (step === 1 && !p.intention) return 'Choisissez ce que vous cherchez';
    if (step === 3) {
      const pub = (p.photos ?? []).filter((x) => x.kind !== 'private');
      if (pub.length < 2) return 'Ajoutez au moins 2 photos, dont un portrait';
    }
    if (step === 4 && (p.bio ?? '').trim().length < 10) return 'Écrivez quelques mots sur vous (10 caractères minimum)';
    return null;
  }

  async function next() {
    const err = validate();
    if (err) {
      showToast(err, 'warn');
      return;
    }
    if (step === 0 && !editing) setPf({ seek: p.gender === 'f' ? 'h' : 'f' });
    const last = step === STEPS.length - 1;
    if (!last && !editing) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      await saveProfile({ ...p, birthDate: parseFrDate(birth) ?? p.birthDate });
      setPrefs(prefs);
      if (editing) {
        showToast('Profil enregistré', 'ok');
        router.back();
      } else router.replace('/discover');
    } catch (e) {
      showToast((e as Error).message, 'warn');
    } finally {
      setBusy(false);
    }
  }

  const edu = EDUCATION[market];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header
        title={editing ? 'Modifier mon profil' : undefined}
        back={editing || step > 0}
        onBack={() => (editing ? router.back() : setStep(step - 1))}
        right={!editing ? <Txt v="tiny">{step + 1} / {STEPS.length}</Txt> : undefined}
      />
      <Screen bottomInset={false}>
        {!editing && <Steps total={STEPS.length} at={step} />}
        {editing && (
          <Chips>
            {STEPS.map((t, i) => (
              <Chip key={t} label={t} selected={i === step} onPress={() => setStep(i)} />
            ))}
          </Chips>
        )}

        {step === 0 && (
          <>
            <Txt v="h1">Faisons connaissance</Txt>
            <Field label="Prénom" placeholder="Ex. Christ" value={p.firstName} onChangeText={(t) => set({ firstName: t })} maxLength={24} autoCapitalize="words" />
            <Field
              label="Date de naissance"
              placeholder="JJ/MM/AAAA"
              keyboardType="numbers-and-punctuation"
              value={birth}
              onChangeText={setBirth}
              maxLength={10}
              hint="Il faut avoir 18 ans ou plus. Seul votre âge est affiché."
            />
            <View style={{ gap: 8 }}>
              <Txt v="label">Je suis</Txt>
              <Chips>
                {(['h', 'f'] as Gender[]).map((g) => (
                  <Chip key={g} label={g === 'h' ? 'Un homme' : 'Une femme'} selected={p.gender === g} onPress={() => set({ gender: g })} />
                ))}
              </Chips>
            </View>
            <Select label="Ville" value={p.city} options={MARKET[market].cities.map((c) => ({ value: c, label: c }))} onChange={(c) => set({ city: c })} />
            <Field label="Quartier (optionnel)" placeholder={market === 'CG' ? 'Ex. Poto-Poto' : 'Ex. Gombe'} value={p.district} onChangeText={(t) => set({ district: t })} />
          </>
        )}

        {step === 1 && (
          <>
            <Txt v="h1">Vous cherchez quoi ?</Txt>
            <View style={{ gap: 8 }}>
              <Txt v="label">Je veux rencontrer</Txt>
              <Chips>
                <Chip label="Des femmes" selected={prefs.seek === 'f'} onPress={() => setPf({ seek: 'f' })} />
                <Chip label="Des hommes" selected={prefs.seek === 'h'} onPress={() => setPf({ seek: 'h' })} />
                <Chip label="Tout le monde" selected={prefs.seek === 'tous'} onPress={() => setPf({ seek: 'tous' })} />
              </Chips>
            </View>
            <View style={{ gap: 8 }}>
              <Txt v="label">Mon intention</Txt>
              <Chips>
                {INTENTIONS.map((i) => (
                  <Chip key={i.id} icon={i.emoji} label={i.label} selected={p.intention === i.id} onPress={() => set({ intention: i.id })} />
                ))}
              </Chips>
            </View>
            <View style={{ gap: 8 }}>
              <Txt v="label">Montrez-moi les personnes qui veulent</Txt>
              <Chips>
                {INTENTIONS.map((i) => (
                  <Chip key={i.id} label={i.label} selected={prefs.intentions.includes(i.id)} onPress={() => setPf({ intentions: toggle(prefs.intentions, i.id) as Preferences['intentions'] })} />
                ))}
              </Chips>
              <Txt v="tiny">Aucune sélection : toutes les intentions.</Txt>
            </View>
            <RangeSlider label="Âge" min={18} max={65} low={prefs.ageMin} high={prefs.ageMax} format={(v) => `${v} ans`} onChange={(a, b) => setPf({ ageMin: a, ageMax: b! })} />
          </>
        )}

        {step === 2 && (
          <>
            <Txt v="h1">Vos critères</Txt>
            <Txt v="small">Ces filtres de base règlent qui vous voyez. Vous pourrez les changer à tout moment dans Découvrir.</Txt>
            <RangeSlider label="Ma taille" min={HEIGHT_MIN} max={HEIGHT_MAX} low={p.heightCm ?? 172} format={(v) => `${v} cm`} onChange={(a) => set({ heightCm: a })} />
            <RangeSlider
              label="Taille recherchée"
              min={HEIGHT_MIN}
              max={HEIGHT_MAX}
              low={prefs.heightMin ?? HEIGHT_MIN}
              high={prefs.heightMax ?? HEIGHT_MAX}
              format={(v) => `${v} cm`}
              onChange={(a, b) => setPf({ heightMin: a === HEIGHT_MIN ? undefined : a, heightMax: b === HEIGHT_MAX ? undefined : b })}
            />
            <Select label="Mon niveau d'étude" value={edu.find((e) => e.rank === p.educationRank)?.id} placeholder="Choisir" options={edu.map((e) => ({ value: e.id, label: e.label }))} onChange={(id) => set({ educationRank: edu.find((e) => e.id === id)?.rank })} />
            <Select
              label="Niveau d'étude minimum recherché"
              value={edu.find((e) => e.rank === prefs.educationMinRank)?.id ?? 'any'}
              options={[{ value: 'any', label: 'Peu importe' }, ...edu.map((e) => ({ value: e.id, label: `${e.label} et plus` }))]}
              onChange={(id) => setPf({ educationMinRank: edu.find((e) => e.id === id)?.rank })}
            />
            <View style={{ gap: 8 }}>
              <Txt v="label">Langues parlées</Txt>
              <Chips>
                {LANGUAGES.map((l) => (
                  <Chip key={l} label={l} selected={p.languages?.includes(l)} onPress={() => set({ languages: toggle(p.languages, l) })} />
                ))}
              </Chips>
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Txt v="h1">Vos photos</Txt>
            <PhotoGrid photos={(p.photos ?? []) as Photo[]} onChange={(photos) => set({ photos })} />
          </>
        )}

        {step === 4 && (
          <>
            <Txt v="h1">Votre bio</Txt>
            <Field label="À propos de moi" placeholder="Ce que vous aimez, ce qui vous fait rire, votre plat préféré…" value={p.bio} onChangeText={(t) => set({ bio: t })} multiline maxLength={300} inputStyle={{ minHeight: 110, textAlignVertical: 'top' }} hint={`${(p.bio ?? '').length}/300`} />
            <View style={{ gap: 8 }}>
              <Txt v="label">Passions</Txt>
              <Chips>
                {PASSIONS.map((x) => (
                  <Chip key={x} label={x} selected={p.passions?.includes(x)} onPress={() => set({ passions: toggle(p.passions, x).slice(0, 6) })} />
                ))}
              </Chips>
            </View>
            <Field label="Une phrase sur vous (optionnel)" placeholder="Mon dimanche idéal…" value={p.prompt?.a} onChangeText={(t) => set({ prompt: t ? { q: 'Mon dimanche idéal', a: t } : undefined })} maxLength={120} />
          </>
        )}

        <Row style={{ marginTop: 8 }}>
          <Button style={{ flex: 1 }} title={editing ? 'Enregistrer' : step === STEPS.length - 1 ? 'Commencer à découvrir' : 'Continuer'} onPress={next} loading={busy} icon={step === STEPS.length - 1 && !editing ? 'flame' : undefined} />
        </Row>
      </Screen>
    </KeyboardAvoidingView>
  );
}
