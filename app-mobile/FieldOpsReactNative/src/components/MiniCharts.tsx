
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';

import { Palette } from '../types';

type TrendData = {
  day: string;
  total: number;
};

type StatusData = {
  name: string;
  value: number;
};

export function TrendChart({
  colors,
  data,
}: {
  colors: Palette;
  data: TrendData[];
}) {
  const w = 320;
  const h = 150;
  const p = 22;

  if (data.length === 0) {
    return (
      <Text style={{ color: colors.muted, marginTop: 12 }}>
        Não há dados históricos disponíveis.
      </Text>
    );
  }

  const max = Math.max(1, ...data.map((item) => item.total));

  const pts = data
    .map((item, index) => {
      const x =
        data.length === 1
          ? w / 2
          : p + index * ((w - p * 2) / (data.length - 1));

      const y = h - p - (item.total / max) * (h - p * 2);

      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View>
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        <Line
          x1={p}
          y1={h - p}
          x2={w - p}
          y2={h - p}
          stroke={colors.grid}
        />

        <Line
          x1={p}
          y1={p}
          x2={p}
          y2={h - p}
          stroke={colors.grid}
        />

        <Polyline
          points={pts}
          fill="none"
          stroke="#2563eb"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>

      <View style={styles.labels}>
        {data.map((item, index) => (
          <Text
            key={`${item.day}-${index}`}
            style={[styles.label, { color: colors.muted }]}
          >
            {item.day}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function StatusChart({
  colors,
  data,
}: {
  colors: Palette;
  data: StatusData[];
}) {
  const max = Math.max(1, ...data.map((item) => item.value));

  if (data.length === 0) {
    return (
      <Text style={{ color: colors.muted, marginTop: 12 }}>
        Nenhum dado de status disponível.
      </Text>
    );
  }

  return (
    <View style={{ gap: 10, marginTop: 8 }}>
      {data.map((item) => {
        const percentage = (item.value / max) * 100;

        return (
          <View key={item.name} style={styles.barRow}>
            <Text style={[styles.barName, { color: colors.muted }]}>
              {item.name}
            </Text>

            <View
              style={[
                styles.track,
                { backgroundColor: colors.grid },
              ]}
            >
              <View
                style={[
                  styles.fill,
                  {
                    width: `${percentage}%`,
                  },
                ]}
              />
            </View>

            <Text style={[styles.value, { color: colors.text }]}>
              {item.value}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: -7,
  },
  label: {
    fontSize: 9,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  barName: {
    width: 82,
    fontSize: 9,
  },
  track: {
    flex: 1,
    height: 14,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 5,
  },
  value: {
    width: 24,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'right',
  },
});
