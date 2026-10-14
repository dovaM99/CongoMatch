import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { Photo, PhotoKind } from '@/services/types';
import { useApp, useServices } from '@/store/app';
import { Base, Fonts, Radius } from '@/theme/tokens';

import { Press, Txt } from './ui';

const MAX_PUBLIC = 6;

/** Exactly one portrait, always the first public photo. */
function normalize(list: Photo[]): Photo[] {
  let first = true;
  return list.map((p) => {
    if (p.kind === 'private') return p;
    const kind: PhotoKind = first ? 'portrait' : 'public';
    first = false;
    return { ...p, kind };
  });
}

const statusLabel: Record<Photo['moderation'], string> = { pending: 'En vérification', approved: 'Validée', rejected: 'Refusée' };

/**
 * Photo editor: slot 1 is the portrait (face visible), then gallery photos,
 * then one optional private photo only shown to matches.
 * Every upload goes through the moderation hook before others can see it.
 */
export function PhotoGrid({ photos, onChange }: { photos: Photo[]; onChange: (p: Photo[]) => void }) {
  const svc = useServices();
  const { showToast, theme } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const publicPhotos = photos.filter((p) => p.kind !== 'private');
  const privatePhoto = photos.find((p) => p.kind === 'private');

  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);

  async function pick(kind: PhotoKind, replaceId?: string) {
    if (busy) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (res.canceled || !res.assets?.[0]) return;
    const key = replaceId ?? kind;
    setBusy(key);
    try {
      const uploaded = await svc.profile.uploadPhoto(res.assets[0].uri, kind);
      const cur = latest.current;
      const next = replaceId ? cur.map((p) => (p.id === replaceId ? uploaded : p)) : [...cur, uploaded];
      onChange(normalize(next));
      showToast(kind === 'private' ? 'Photo privée envoyée en vérification' : 'Photo ajoutée, en vérification');
    } catch (e) {
      showToast((e as Error).message, 'warn');
    } finally {
      setBusy(null);
    }
  }
  function remove(id: string) {
    onChange(normalize(photos.filter((p) => p.id !== id)));
  }

  const slots = Array.from({ length: MAX_PUBLIC }, (_, i) => publicPhotos[i]);

  return (
    <View style={{ gap: 18 }}>
      <View style={s.grid}>
        {slots.map((p, i) => (
          <Slot
            key={p?.id ?? `empty-${i}`}
            photo={p}
            big={i === 0}
            label={i === 0 ? 'Portrait' : i === 1 ? 'Obligatoire' : undefined}
            busy={busy === (p?.id ?? (i === publicPhotos.length ? (i === 0 ? 'portrait' : 'public') : ''))}
            accent={theme.accent}
            onAdd={() => pick(publicPhotos.length === 0 ? 'portrait' : 'public', p?.id)}
            onRemove={p ? () => remove(p.id) : undefined}
            disabled={!p && i > publicPhotos.length}
          />
        ))}
      </View>
      <Txt v="small">La 1re photo est votre portrait : visage bien visible, sans lunettes de soleil. Ajoutez au moins 2 photos.</Txt>

      <View style={s.private}>
        <LinearGradient colors={['rgba(255,61,110,0.18)', 'rgba(255,61,110,0.02)']} style={StyleSheet.absoluteFill} />
        <View style={{ flex: 1, gap: 6 }}>
          <Txt v="h3">🔐 Photo privée (optionnelle)</Txt>
          <Txt v="small">Une photo plus osée, visible uniquement par vos matchs. Réservée aux 18 ans et plus. Pas de nudité : elle est vérifiée par notre modération avant d'être visible.</Txt>
        </View>
        <Slot photo={privatePhoto} small busy={busy === (privatePhoto?.id ?? 'private')} accent={theme.accent} onAdd={() => pick('private', privatePhoto?.id)} onRemove={privatePhoto ? () => remove(privatePhoto.id) : undefined} />
      </View>
    </View>
  );
}

function Slot({ photo, big, small, label, busy, onAdd, onRemove, disabled, accent }: { photo?: Photo; big?: boolean; small?: boolean; label?: string; busy?: boolean; onAdd: () => void; onRemove?: () => void; disabled?: boolean; accent: string }) {
  return (
    <View style={[s.cell, small && s.small]}>
    <Press onPress={onAdd} disabled={disabled} scaleTo={0.95} style={[s.slot, big && s.big, !photo && { borderStyle: 'dashed', borderColor: label ? accent : Base.lineStrong }]} accessibilityLabel={photo ? 'Remplacer la photo' : 'Ajouter une photo'}>
      {photo ? (
        <>
          <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          {photo.moderation !== 'approved' && (
            <View style={[s.status, photo.moderation === 'rejected' && { backgroundColor: Base.danger }]}>
              <Text style={s.statusT}>{statusLabel[photo.moderation]}</Text>
            </View>
          )}
        </>
      ) : (
        <View style={{ alignItems: 'center', gap: 4 }}>
          {busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="add-circle" size={big ? 34 : 26} color={label ? accent : Base.ink2} />}
          {label && <Text style={[s.lbl, { color: accent }]}>{label}</Text>}
        </View>
      )}
    </Press>
    {photo && onRemove && (
      <Press onPress={onRemove} style={s.remove} accessibilityLabel="Supprimer la photo">
        <Ionicons name="close" size={16} color="#fff" />
      </Press>
    )}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '31%' },
  slot: { width: '100%', aspectRatio: 3 / 4, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Base.line, backgroundColor: Base.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  big: { borderWidth: 2 },
  small: { width: 86 },
  lbl: { fontFamily: Fonts.bodyBold, fontSize: 11.5 },
  status: { position: 'absolute', left: 6, bottom: 6, right: 6, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.65)' },
  statusT: { fontFamily: Fonts.bodyBold, fontSize: 10.5, color: '#fff', textAlign: 'center' },
  remove: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  private: { flexDirection: 'row', gap: 14, padding: 14, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(255,61,110,0.35)', overflow: 'hidden', alignItems: 'center' },
});
