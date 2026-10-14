import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Countdown } from '@/components/overlays';
import { Select } from '@/components/Select';
import { Button, Card, Chip, Chips, Field, Header, Row, Screen, Txt } from '@/components/ui';
import { PACKS, TIERS, type MarketId } from '@/data/catalog';
import type { Promo, PromoTarget } from '@/services/types';
import { useApp, useServices } from '@/store/app';
import { Base } from '@/theme/tokens';

const DURATIONS = [
  { h: 1, label: '1 h' },
  { h: 6, label: '6 h' },
  { h: 24, label: '24 h' },
  { h: 48, label: '48 h' },
  { h: 168, label: '7 jours' },
];

const targetLabel = (t: PromoTarget) =>
  t.kind === 'tier' ? `Forfait ${TIERS.find((x) => x.id === t.tierId)?.name}` : t.kind === 'all-coins' ? 'Toutes les recharges de pièces' : `Pack ${PACKS.find((p) => p.id === t.packId)?.coins} pièces`;

/**
 * Admin console for promotions. The end time is stored once on the server,
 * so every member sees the same countdown and it never restarts.
 */
export default function AdminPromos() {
  const svc = useServices();
  const app = useApp();
  const [list, setList] = useState<Promo[]>([]);
  const [title, setTitle] = useState('');
  const [percent, setPercent] = useState(50);
  const [target, setTarget] = useState('tier:2');
  const [markets, setMarkets] = useState<MarketId[]>(['CG', 'CD']);
  const [hours, setHours] = useState(24);

  const load = useCallback(async () => setList(await svc.promos.listAll()), [svc]);
  useEffect(() => void load(), [load]);

  const parseTarget = (v: string): PromoTarget => {
    const [k, x] = v.split(':');
    if (k === 'tier') return { kind: 'tier', tierId: Number(x) as 1 | 2 | 3 };
    if (k === 'pack') return { kind: 'coins', packId: x };
    return { kind: 'all-coins' };
  };

  async function create() {
    try {
      const start = new Date();
      const tg = parseTarget(target);
      await svc.promos.create({
        title: title.trim() || `-${percent}% sur ${targetLabel(tg).toLowerCase()}`,
        percentOff: percent,
        target: tg,
        markets,
        startsAt: start.toISOString(),
        endsAt: new Date(start.getTime() + hours * 3600_000).toISOString(),
      });
      setTitle('');
      await Promise.all([load(), app.refreshPromos()]);
      app.showToast('Promo lancée', 'ok');
    } catch (e) {
      app.showToast((e as Error).message, 'warn');
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Header title="Promotions" sub="Console administrateur" />
      <Screen bottomInset={false}>
        <Card>
          <Txt v="h3">Nouvelle promo</Txt>
          <Field label="Titre affiché" placeholder="Ex. Gold à moitié prix ce week-end" value={title} onChangeText={setTitle} maxLength={40} />
          <View style={{ gap: 8 }}>
            <Txt v="label">Réduction</Txt>
            <Chips>
              {[20, 30, 40, 50, 70].map((p) => (
                <Chip key={p} label={`-${p}%`} selected={percent === p} onPress={() => setPercent(p)} />
              ))}
            </Chips>
          </View>
          <Select
            label="Sur"
            value={target}
            onChange={setTarget}
            options={[
              ...TIERS.map((t) => ({ value: `tier:${t.id}`, label: `Forfait ${t.name}`, right: `${t.local.CG} / ${t.local.CD}` })),
              { value: 'coins:all', label: 'Toutes les recharges de pièces' },
              ...PACKS.map((p) => ({ value: `pack:${p.id}`, label: `Pack ${p.coins} pièces` })),
            ]}
          />
          <View style={{ gap: 8 }}>
            <Txt v="label">Pays</Txt>
            <Chips>
              <Chip label="🇨🇬 Brazzaville" selected={markets.includes('CG')} onPress={() => setMarkets((m) => (m.includes('CG') ? m.filter((x) => x !== 'CG') : [...m, 'CG']))} />
              <Chip label="🇨🇩 Kinshasa" selected={markets.includes('CD')} onPress={() => setMarkets((m) => (m.includes('CD') ? m.filter((x) => x !== 'CD') : [...m, 'CD']))} />
            </Chips>
          </View>
          <View style={{ gap: 8 }}>
            <Txt v="label">Durée (à partir de maintenant)</Txt>
            <Chips>
              {DURATIONS.map((d) => (
                <Chip key={d.h} label={d.label} selected={hours === d.h} onPress={() => setHours(d.h)} />
              ))}
            </Chips>
            <Txt v="tiny">Fin : {new Date(Date.now() + hours * 3600_000).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</Txt>
          </View>
          <Button title="Lancer la promo" icon="rocket" onPress={create} disabled={!markets.length} />
        </Card>

        <Txt v="label">Toutes les promos</Txt>
        {list.map((p) => {
          const live = p.active && new Date(p.endsAt) > new Date();
          return (
            <Card key={p.id} style={{ borderColor: live ? 'rgba(255,61,110,0.45)' : Base.line }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt v="h3" style={{ flex: 1 }}>-{p.percentOff}% · {p.title}</Txt>
                {live ? <Countdown endsAt={p.endsAt} color={Base.rose} /> : <Txt v="tiny">Terminée</Txt>}
              </Row>
              <Txt v="small">{targetLabel(p.target)} · {p.markets.join(', ')}</Txt>
              {live && <Button size="sm" title="Arrêter maintenant" variant="ghost" shine={false} onPress={async () => { await svc.promos.end(p.id); await Promise.all([load(), app.refreshPromos()]); }} />}
            </Card>
          );
        })}
      </Screen>
    </View>
  );
}
