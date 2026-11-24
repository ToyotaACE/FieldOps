import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, CheckCircle2, CloudOff, RefreshCw, UploadCloud } from 'lucide-react-native';

import { SYNC_STATE_LABELS, type SyncState } from '../offline/syncEngine';

const STYLES: Record<SyncState, { bg: string; fg: string }> = {
  SINCRONIZADO: { bg: '#dcfce7', fg: '#15803d' },
  PENDENTE: { bg: '#fef3c7', fg: '#a16207' },
  SINCRONIZANDO: { bg: '#dbeafe', fg: '#1d4ed8' },
  ERRO: { bg: '#fee2e2', fg: '#b91c1c' },
  AGUARDANDO_CONEXAO: { bg: '#f1f5f9', fg: '#475569' },
};

function Icon({ state, color }: { state: SyncState; color: string }) {
  switch (state) {
    case 'SINCRONIZADO':
      return <CheckCircle2 size={12} color={color} />;
    case 'SINCRONIZANDO':
      return <RefreshCw size={12} color={color} />;
    case 'ERRO':
      return <AlertTriangle size={12} color={color} />;
    case 'AGUARDANDO_CONEXAO':
      return <CloudOff size={12} color={color} />;
    default:
      return <UploadCloud size={12} color={color} />;
  }
}

export function SyncBadge({
  state,
  count,
}: {
  state: SyncState;
  count?: number;
}) {
  const palette = STYLES[state];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Icon state={state} color={palette.fg} />
      <Text style={[styles.text, { color: palette.fg }]}>
        {SYNC_STATE_LABELS[state]}
        {count && state !== 'SINCRONIZADO' ? ` (${count})` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  text: { fontSize: 10, fontWeight: '800' },
});
