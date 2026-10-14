import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { RangeSlider } from '@/components/RangeSlider';
import { Select } from '@/components/Select';
import { Button, Card, Chip, Chips, Header, Row, Screen, Toggle, Txt } from '@/components/ui';
import { UpsellSheet } from '@/components/Upsell';
import { EDUCATION, HEIGHT_MAX, HEIGHT_MIN, INTENTIONS, LANGUAGES, MARKET, tierById } from '@/data/catalog';
import { Rules } from '@/lib/rules';
import type { Preferences } from '@/services/types';
import { defaultPrefs, useApp } from '@/store/app';
import { Base } from '@/theme/tokens';

export default function Filters() {
  const { prefs, setPrefs, tier, market, me, showToast } = useApp();
  const [f, setF] = useState<Preferences>(prefs);
  const [upsell, setUpsell] = useState(false);
  const set = (patch: Partial<Preferences>) => setF((x) => ({ ...x, ...patch }));
  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const geo = Rules.canUseGeoFilter(tier);
  const edu = EDUCATION[market];
  const cities = [...MARKET.CG.cities.slice(0, 2), ...MARKET.CD.cities.slice(0, 2), ...MARKET[market].cities.slice(2)];

  return (
    <View style={{ flex: 1 }}>
      <Header title="Filtres" sub="Qui voulez-vous découvrir ?" right={<Button size="sm" title="Réinitialiser" variant="ghost" shine={false} onPress={() => setF(defaultPrefs(me?.gender))} style={{ alignSelf: 'auto' }} />} />
      <Screen bottomInset={false}>
        <View style={{ gap: 8 }}>
          <Txt v="label">Je veux rencontrer</Txt>
          <Chips>
            <Chip label="Des femmes" selected={f.seek === 'f'} onPress={() => set({ seek: 'f' })} />
            <Chip label="Des hommes" selected={f.seek === 'h'} onPress={() => set({ seek: 'h' })} />
            <Chip label="Tout le monde" selected={f.seek === 'tous'} onPress={() => set({ seek: 'tous' })} />
          </Chips>
        </View>
        <RangeSlider label="Âge" min={18} max={65} low={f.ageMin} high={f.ageMax} format={(v) => `${v} ans`} onChange={(a, b) => set({ ageMin: a, ageMax: b! })} />

        <Card style={{ borderColor: geo ? Base.line : 'rgba(232,190,90,0.4)' }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="h3">📍 Filtre géographique</Txt>
            {!geo && <Txt v="tiny" color="#E8BE5A">{tierById(2)!.name} · {tierById(2)!.local[market]} et plus</Txt>}
          </Row>
          {!geo && <Txt v="small">Choisissez les villes et la distance maximale. Disponible à partir de Gold.</Txt>}
          <View style={{ gap: 8, opacity: geo ? 1 : 0.5 }} pointerEvents={geo ? 'auto' : 'none'}>
            <Txt v="label">Villes</Txt>
            <Chips>
              {cities.map((c) => (
                <Chip key={c} label={c} selected={f.cities?.includes(c)} onPress={() => set({ cities: toggle(f.cities ?? [], c) })} />
              ))}
            </Chips>
            <RangeSlider label="Distance maximale" min={1} max={100} low={f.maxDistanceKm ?? 100} format={(v) => (v >= 100 ? 'Peu importe' : `${v} km`)} onChange={(a) => set({ maxDistanceKm: a >= 100 ? undefined : a })} disabled={!geo} />
          </View>
          {!geo && <Button title="Débloquer avec Gold" size="sm" icon="star" onPress={() => setUpsell(true)} />}
        </Card>

        <View style={{ gap: 8 }}>
          <Txt v="label">Intention</Txt>
          <Chips>
            {INTENTIONS.map((i) => (
              <Chip key={i.id} icon={i.emoji} label={i.label} selected={f.intentions.includes(i.id)} onPress={() => set({ intentions: toggle(f.intentions, i.id) })} />
            ))}
          </Chips>
        </View>
        <RangeSlider
          label="Taille"
          min={HEIGHT_MIN}
          max={HEIGHT_MAX}
          low={f.heightMin ?? HEIGHT_MIN}
          high={f.heightMax ?? HEIGHT_MAX}
          format={(v) => `${v} cm`}
          onChange={(a, b) => set({ heightMin: a === HEIGHT_MIN ? undefined : a, heightMax: b === HEIGHT_MAX ? undefined : b })}
        />
        <Select
          label="Niveau d'étude minimum"
          value={edu.find((e) => e.rank === f.educationMinRank)?.id ?? 'any'}
          options={[{ value: 'any', label: 'Peu importe' }, ...edu.map((e) => ({ value: e.id, label: `${e.label} et plus` }))]}
          onChange={(id) => set({ educationMinRank: edu.find((e) => e.id === id)?.rank })}
        />
        <Txt v="tiny">Les niveaux de Brazzaville et de Kinshasa sont mis en correspondance (BAC ≈ Diplôme d'État, Licence ≈ Graduat G3…).</Txt>
        <View style={{ gap: 8 }}>
          <Txt v="label">Langues</Txt>
          <Chips>
            {LANGUAGES.map((l) => (
              <Chip key={l} label={l} selected={f.languages.includes(l)} onPress={() => set({ languages: toggle(f.languages, l) })} />
            ))}
          </Chips>
        </View>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Txt v="h3">Profils vérifiés uniquement</Txt>
            <Txt v="small">Numéro et photo vérifiés</Txt>
          </View>
          <Toggle value={f.verifiedOnly} onChange={(v) => set({ verifiedOnly: v })} />
        </Row>
        <Button
          title="Appliquer"
          icon="checkmark"
          onPress={() => {
            setPrefs(f);
            showToast('Filtres appliqués', 'ok');
            router.back();
          }}
        />
      </Screen>
      <UpsellSheet reason={upsell ? 'geo' : null} onClose={() => setUpsell(false)} />
    </View>
  );
}
