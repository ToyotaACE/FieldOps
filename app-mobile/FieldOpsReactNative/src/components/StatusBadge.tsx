
import React from 'react';
import { Text, View } from 'react-native';

import { Status } from '../types';
import { statusBadgeStyles as styles } from './StatusBadge.styles';

type StatusBadgeProps = {
  status: Status;
};

const statusColors: Record<Status, [string, string]> = {
  Agendada: ['#f1f5f9', '#475569'],
  'Em andamento': ['#dbeafe', '#1d4ed8'],
  Concluída: ['#e0f2fe', '#0369a1'],
  'Aguardando revisão': ['#fef3c7', '#a16207'],
  Aprovada: ['#dcfce7', '#15803d'],
  Reprovada: ['#fee2e2', '#b91c1c'],
  Cancelada: ['#f3f4f6', '#6b7280'],
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const [backgroundColor, foregroundColor] = statusColors[status];

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color: foregroundColor }]}>
        {status}
      </Text>
    </View>
  );
}
