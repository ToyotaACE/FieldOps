
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Inspection, Palette, Priority } from '../types';
import { StatusBadge } from './StatusBadge';
import { inspectionCardStyles as styles } from './InspectionCard.styles';

type InspectionCardProps = {
  item: Inspection;
  colors: Palette;
  onPress: () => void;
};

const priorityColors: Record<Priority, string> = {
  Baixa: '#94a3b8',
  Normal: '#3b82f6',
  Alta: '#f97316',
  Crítica: '#ef4444',
};

export function InspectionCard({
  item,
  colors,
  onPress,
}: InspectionCardProps) {
  const hasProgress =
    typeof item.progress === 'number' &&
    Number.isFinite(item.progress);

  const progress = hasProgress
    ? Math.min(100, Math.max(0, item.progress!))
    : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.panel,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.top}>
        <Text style={styles.id}>{item.id}</Text>
        <StatusBadge status={item.status} />
      </View>

      <Text style={[styles.client, { color: colors.text }]}>
        {item.client}
      </Text>

      <Text style={[styles.equipment, { color: colors.muted }]}>
        {item.equipment}
      </Text>

      <View style={styles.row}>
        <Text style={[styles.meta, { color: colors.muted }]}>
          {item.technician} · {item.date}
        </Text>

        <View style={styles.priority}>
          <View
            style={[
              styles.dot,
              { backgroundColor: priorityColors[item.priority] },
            ]}
          />

          <Text style={[styles.meta, { color: colors.muted }]}>
            {item.priority}
          </Text>
        </View>
      </View>

      {hasProgress && (
        <>
          <View style={styles.progressLine}>
            <View
              style={[
                styles.progress,
                { width: `${progress}%` },
              ]}
            />
          </View>

          <Text style={[styles.progressText, { color: colors.muted }]}>
            {progress}% concluído
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
