import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { tierById } from '@/data/catalog';
import { applyPercent, money, priceIn } from '@/lib/format';
import { promoFor, useApp } from '@/store/app';
import { Base, Fonts } from '@/theme/tokens';

import { TierBadge } from './media';
import { Countdown, Sheet } from './overlays';
import { Button, Row, Txt } from './ui';

export type UpsellReason = 'photos' | 'platinum' | 'likers' | 'geo' | 'voice' | 'likes' | 'rewind' | 'incognito';

const COPY: Record<UpsellReason, { tier: 1 | 2 | 3; icon: string; title: string; text: string }> = {
  photos: { tier: 1, icon: '📸', title: 'Voir toutes les photos', text: 'Avec Plus, tous les carrousels sont ouverts.' },
  likes: { tier: 1, icon: '❤️‍🔥', title: 'Plus de likes pour aujourd’hui', text: 'Passez à Plus pour liker sans limite, ou revenez demain.' },
  rewind: { tier: 1, icon: '↺', title: 'Revenir en arrière', text: 'Vous avez passé trop vite ? Plus vous permet de revenir sur le dernier profil.' },
  platinum: { tier: 2, icon: '◆', title: 'Profils Platinum', text: 'Les membres Platinum sont visibles à partir de Gold.' },
  likers: { tier: 2, icon: '👀', title: 'Qui vous a liké', text: 'Avec Gold, voyez qui vous a liké et matchez tout de suite.' },
  geo: { tier: 2, icon: '📍', title: 'Filtre géographique', text: 'Choisissez la ville, le quartier et la distance avec Gold.' },
  voice: { tier: 2, icon: '🎤', title: 'Notes vocales', text: 'Envoyez des notes vocales dans toutes vos conversations avec Gold.' },
  incognito: { tier: 2, icon: '🕶️', title: 'Mode Incognito', text: 'Seules les personnes que vous likez vous voient.' },
};

export function UpsellSheet({ reason, onClose }: { reason: UpsellReason | null; onClose: () => void }) {
  const { market, promos } = useApp();
  if (!reason) return <Sheet visible={false} onClose={onClose}>{null}</Sheet>;
  const c = COPY[reason];
  const t = tierById(c.tier)!;
  const promo = promoFor(promos, { kind: 'tier', tierId: t.id });
  const base = priceIn(market, t.price);
  return (
    <Sheet visible onClose={onClose}>
      <Text style={{ fontSize: 40 }}>{c.icon}</Text>
      <Txt v="h1">{c.title}</Txt>
      <Txt v="small">{c.text}</Txt>
      <Row style={{ flexWrap: 'wrap' }}>
        <TierBadge tier={t.id} market={market} />
        {promo ? (
          <Row gap={6}>
            <Text style={{ fontFamily: Fonts.body, color: Base.ink3, textDecorationLine: 'line-through' }}>{money(market, base)}</Text>
            <Text style={{ fontFamily: Fonts.bodyBold, color: Base.ink }}>{money(market, applyPercent(base, promo.percentOff))} / mois</Text>
          </Row>
        ) : (
          <Txt v="small">{money(market, base)} / mois</Txt>
        )}
      </Row>
      {promo && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt v="small" color={Base.rose}>-{promo.percentOff}% encore</Txt>
          <Countdown endsAt={promo.endsAt} color={Base.rose} />
        </View>
      )}
      <Button
        title={`Passer à ${t.name}`}
        onPress={() => {
          onClose();
          router.push({ pathname: '/checkout', params: { kind: 'tier', id: String(t.id) } });
        }}
      />
      <Button
        title="Comparer les forfaits"
        variant="ghost"
        onPress={() => {
          onClose();
          router.push('/plans');
        }}
      />
    </Sheet>
  );
}
