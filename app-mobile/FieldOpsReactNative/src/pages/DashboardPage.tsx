
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
} from 'lucide-react-native';

import { InspectionCard } from '../components/InspectionCard';
import { StatusChart } from '../components/MiniCharts';
import { Inspection, Palette, Status } from '../types';
import { dashboardPageStyles as styles } from './DashboardPage.styles';

type DashboardPageProps = {
  colors: Palette;
  inspections: Inspection[];
  onOpenInspection: (inspection: Inspection) => void;
  onNewInspection: () => void;
};

function isToday(date: string): boolean {
  if (!date) return false;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  const todayISO = `${year}-${month}-${day}`;

  // Data no formato YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
  if (date.startsWith(todayISO)) {
    return true;
  }

  // Data no formato DD/MM/YYYY
  const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

  if (match) {
    return (
      match[1] === day &&
      match[2] === month &&
      match[3] === String(year)
    );
  }

  return false;
}

export function DashboardPage({
  colors,
  inspections,
  onOpenInspection,
}: DashboardPageProps) {
  const countByStatus = (status: Status) =>
    inspections.filter((inspection) => inspection.status === status).length;

  const todayCount = inspections.filter((inspection) =>
    isToday(inspection.date),
  ).length;

  const inProgressCount = countByStatus('Em andamento');
  const reviewCount = countByStatus('Aguardando revisão');
  const approvedCount = countByStatus('Aprovada');

  const cards = [
    {
      label: 'Inspeções hoje',
      value: String(todayCount),
      description: 'Agendadas para hoje',
      icon: ClipboardCheck,
      background: '#dbeafe',
      foreground: '#2563eb',
    },
    {
      label: 'Em andamento',
      value: String(inProgressCount),
      description: 'Inspeções em execução',
      icon: Activity,
      background: '#fef3c7',
      foreground: '#d97706',
    },
    {
      label: 'Aguardando revisão',
      value: String(reviewCount),
      description: 'Aguardando análise',
      icon: Clock3,
      background: '#ede9fe',
      foreground: '#7c3aed',
    },
    {
      label: 'Aprovadas',
      value: String(approvedCount),
      description: 'Inspeções aprovadas',
      icon: CheckCircle2,
      background: '#dcfce7',
      foreground: '#16a34a',
    },
    {
      label: 'Não conformidades',
      value: '—',
      description: 'Dados ainda não integrados',
      icon: AlertTriangle,
      background: '#fee2e2',
      foreground: '#dc2626',
    },
  ];

  const statusData = [
    { name: 'Agendada', value: countByStatus('Agendada') },
    { name: 'Em andamento', value: inProgressCount },
    { name: 'Concluída', value: countByStatus('Concluída') },
    { name: 'Aguardando revisão', value: reviewCount },
    { name: 'Aprovada', value: approvedCount },
    { name: 'Reprovada', value: countByStatus('Reprovada') },
    { name: 'Cancelada', value: countByStatus('Cancelada') },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>VISÃO OPERACIONAL</Text>

          <Text style={[styles.title, { color: colors.text }]}>
            Visão geral das operações
          </Text>

          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Acompanhe a execução das inspeções em campo em tempo real.
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <View
              key={card.label}
              style={[
                styles.stat,
                {
                  backgroundColor: colors.panel,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.statTop}>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  {card.label}
                </Text>

                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: card.background },
                  ]}
                >
                  <Icon size={18} color={card.foreground} />
                </View>
              </View>

              <Text style={[styles.statValue, { color: colors.text }]}>
                {card.value}
              </Text>

              <Text style={[styles.delta, { color: colors.muted }]}>
                {card.description}
              </Text>
            </View>
          );
        })}
      </View>

      <View
        style={[
          styles.panel,
          {
            backgroundColor: colors.panel,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.panelTitle, { color: colors.text }]}>
          Inspeções por período
        </Text>

        <Text style={[styles.panelSubtitle, { color: colors.muted }]}>
          Histórico diário
        </Text>

        <Text style={{ color: colors.muted, marginTop: 16, marginBottom: 8 }}>
          O histórico por período ainda não está disponível na API.
        </Text>
      </View>

      <View
        style={[
          styles.panel,
          {
            backgroundColor: colors.panel,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.panelTitle, { color: colors.text }]}>
          Inspeções por status
        </Text>

        <Text style={[styles.panelSubtitle, { color: colors.muted }]}>
          Distribuição atual
        </Text>

        <StatusChart colors={colors} data={statusData} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Inspeções recentes
      </Text>

      {inspections.length === 0 ? (
        <Text style={{ color: colors.muted, marginTop: 8 }}>
          Nenhuma inspeção encontrada.
        </Text>
      ) : (
        inspections.slice(0, 5).map((inspection) => (
          <InspectionCard
            key={inspection.id}
            item={inspection}
            colors={colors}
            onPress={() => onOpenInspection(inspection)}
          />
        ))
      )}
    </ScrollView>
  );
}
