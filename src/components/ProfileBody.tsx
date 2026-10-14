import { StyleSheet, Text, View } from 'react-native';

import { INTENTIONS, PASSION_EMOJI, educationLabel } from '@/data/catalog';
import { ageFrom } from '@/lib/rules';
import type { Profile } from '@/services/types';
import { Base, Fonts, Radius } from '@/theme/tokens';

import { TeamBadge, TierBadge, Verified } from './media';
import { Chips, Kente, Row, Txt } from './ui';

/** Profile details under the photos, shared by "my profile" and someone else's. */
export function ProfileBody({ p }: { p: Profile }) {
  const intention = INTENTIONS.find((i) => i.id === p.intention);
  const facts = [
    intention && { k: '🎯 Je cherche', v: intention.label },
    p.heightCm && { k: '📏 Taille', v: `${p.heightCm} cm` },
    p.educationRank && { k: '🎓 Études', v: educationLabel(p.market, p.educationRank) },
    p.languages.length > 0 && { k: '🗣️ Langues', v: p.languages.join(', ') },
    { k: '📍 Ville', v: `${p.district ? `${p.district}, ` : ''}${p.city}` },
  ].filter(Boolean) as { k: string; v: string }[];
  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 8 }}>
        <Row gap={8}>
          <Text style={s.name}>
            {p.firstName}
            {!p.isTeam && <Text style={{ fontFamily: Fonts.displayMedium }}>, {ageFrom(p.birthDate)}</Text>}
          </Text>
          {p.verified && <Verified size={22} />}
        </Row>
        {p.isTeam ? <TeamBadge /> : p.tier > 0 ? <TierBadge tier={p.tier} market={p.market} /> : null}
      </View>
      {!!p.bio && (
        <View style={{ gap: 6 }}>
          <Txt v="label">À propos</Txt>
          <Txt style={{ fontSize: 17, lineHeight: 25 }}>{p.bio}</Txt>
        </View>
      )}
      <Kente />
      <View style={s.grid}>
        {facts.map((f) => (
          <View key={f.k} style={s.fact}>
            <Txt v="tiny">{f.k}</Txt>
            <Text style={s.factV}>{f.v}</Text>
          </View>
        ))}
      </View>
      {p.prompt && (
        <View style={s.prompt}>
          <Txt v="label">{p.prompt.q}</Txt>
          <Text style={s.promptA}>{p.prompt.a}</Text>
        </View>
      )}
      {p.passions.length > 0 && (
        <View style={{ gap: 8 }}>
          <Txt v="label">Passions</Txt>
          <Chips>
            {p.passions.map((x) => (
              <View key={x} style={s.tag}>
                <Text style={s.tagT}>{PASSION_EMOJI[x] ?? '✨'} {x}</Text>
              </View>
            ))}
          </Chips>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  name: { fontFamily: Fonts.display, fontSize: 28, color: Base.ink, letterSpacing: -0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fact: { width: '48%', flexGrow: 1, padding: 12, borderRadius: Radius.md, backgroundColor: Base.surface, borderWidth: 1, borderColor: Base.line, gap: 4 },
  factV: { fontFamily: Fonts.bodySemi, fontSize: 15, color: Base.ink },
  prompt: { padding: 18, borderRadius: Radius.lg, backgroundColor: Base.surface2, gap: 8 },
  promptA: { fontFamily: Fonts.display, fontSize: 18, lineHeight: 25, color: Base.ink },
  tag: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: Base.surface, borderWidth: 1, borderColor: Base.line },
  tagT: { fontFamily: Fonts.bodySemi, fontSize: 14, color: Base.ink },
});
