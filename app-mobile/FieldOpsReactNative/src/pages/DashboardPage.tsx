import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Plus,
} from 'lucide-react-native';

import { InspectionCard } from '../components/InspectionCard';
import { StatusChart, TrendChart } from '../components/MiniCharts';
import { statuses, trend } from '../data/mockData';
import { Inspection, Palette } from '../types';
import { dashboardPageStyles as styles } from './DashboardPage.styles';

type DashboardPageProps = {
  colors: Palette;
  inspections: Inspection[];
  onOpenInspection: (inspection: Inspection) => void;
  onNewInspection: () => void;
};

export function DashboardPage({
  colors,
  inspections,
  onOpenInspection,
  onNewInspection,
}: DashboardPageProps) {
  const cards = [
    { label: 'Inspeções hoje', value: '18', delta: '+12,5%', icon: ClipboardCheck, background: '#dbeafe', foreground: '#2563eb' },
    { label: 'Em andamento', value: '11', delta: '+8,2%', icon: Activity, background: '#fef3c7', foreground: '#d97706' },
    { label: 'Aguardando revisão', value: '7', delta: '-3,1%', icon: Clock3, background: '#ede9fe', foreground: '#7c3aed' },
    { label: 'Aprovadas', value: '42', delta: '+16,8%', icon: CheckCircle2, background: '#dcfce7', foreground: '#16a34a' },
    { label: 'Não conformidades', value: '13', delta: '+4,3%', icon: AlertTriangle, background: '#fee2e2', foreground: '#dc2626' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>VISÃO OPERACIONAL</Text>
          <Text style={[styles.title, { color: colors.text }]}>Visão geral das operações</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Acompanhe a execução das inspeções em campo em tempo real.
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={onNewInspection}>
          <Plus size={17} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Nova</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <View
              key={card.label}
              style={[styles.stat, { backgroundColor: colors.panel, borderColor: colors.border }]}
            >
              <View style={styles.statTop}>
                <Text style={[styles.statLabel, { color: colors.muted }]}>{card.label}</Text>
                <View style={[styles.statIcon, { backgroundColor: card.background }]}>
                  <Icon size={18} color={card.foreground} />
                </View>
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{card.value}</Text>
              <Text style={styles.delta}>{card.delta}</Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <Text style={[styles.panelTitle, { color: colors.text }]}>Inspeções por período</Text>
        <Text style={[styles.panelSubtitle, { color: colors.muted }]}>Últimos 7 dias</Text>
        <TrendChart colors={colors} data={trend} />
      </View>

      <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <Text style={[styles.panelTitle, { color: colors.text }]}>Inspeções por status</Text>
        <Text style={[styles.panelSubtitle, { color: colors.muted }]}>Distribuição atual</Text>
        <StatusChart colors={colors} data={statuses} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Inspeções recentes</Text>
      {inspections.slice(0, 5).map((inspection) => (
        <InspectionCard
          key={inspection.id}
          item={inspection}
          colors={colors}
          onPress={() => onOpenInspection(inspection)}
        />
      ))}
    </ScrollView>
  );
}
