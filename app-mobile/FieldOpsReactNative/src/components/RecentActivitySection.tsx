import React from 'react';
import { ClipboardCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Inspection, Palette } from '../types';

type RecentActivitySectionProps = {
  colors: Palette;
  inspections: Inspection[];
};

export function RecentActivitySection({
  colors,
  inspections,
}: RecentActivitySectionProps) {
  return (
    <View style={styles.content}>
      <Text style={styles.eyebrow}>OPERAÇÕES</Text>
      <Text style={[styles.title, { color: colors.text }]}>Atividade recente</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>Atualizações das inspeções</Text>

      <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        {inspections.slice(0, 5).map((inspection, index) => (
          <View
            key={inspection.id}
            style={[
              styles.row,
              index < Math.min(inspections.length, 5) - 1 && {
                borderBottomColor: colors.border,
                borderBottomWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <View style={styles.icon}>
              <ClipboardCheck size={17} color="#2563eb" />
            </View>
            <View style={styles.details}>
              <Text style={[styles.record, { color: colors.text }]}>{inspection.id}</Text>
              <Text style={[styles.status, { color: colors.muted }]}>
                {inspection.status} · {inspection.date || 'Data não informada'}
              </Text>
            </View>
          </View>
        ))}
        {inspections.length === 0 && (
          <Text style={[styles.empty, { color: colors.muted }]}>
            Nenhuma atividade recente.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 8 },
  eyebrow: { fontSize: 9, fontWeight: '900', color: '#2563eb', letterSpacing: 1.2 },
  title: { fontSize: 20, fontWeight: '900', marginTop: 5 },
  subtitle: { fontSize: 11, lineHeight: 17, marginTop: 5 },
  panel: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, marginTop: 12 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  icon: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1 },
  record: { fontSize: 11, fontWeight: '800' },
  status: { fontSize: 9, marginTop: 3 },
  empty: { fontSize: 11, paddingVertical: 16 },
});
