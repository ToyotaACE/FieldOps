import React, { ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  MapPin,
  PackageCheck,
} from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Inspection, Palette } from '../types';
import { InspectionCard } from '../components/InspectionCard';
import { StatusChart, TrendChart } from '../components/MiniCharts';
import { statuses, trend } from '../data/mockData';

type DashboardScreenProps = {
  colors: Palette;
  inspections: Inspection[];
  onOpenInspection: (inspection: Inspection) => void;
};

type SectionProps = {
  title: string;
  subtitle: string;
  colors: Palette;
  children: ReactNode;
};

function Section({
  title,
  subtitle,
  colors,
  children,
}: SectionProps) {
  return (
    <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeading}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.panelSub, { color: colors.muted }]}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

export function DashboardScreen({
  colors,
  inspections,
  onOpenInspection,
}: DashboardScreenProps) {
  const cards = [
    { label: 'Inspeções hoje', value: '18', delta: '+12,5%', Icon: ClipboardCheck, iconBg: '#dbeafe', iconColor: '#2563eb' },
    { label: 'Em andamento', value: '11', delta: '+8,2%', Icon: Activity, iconBg: '#fef3c7', iconColor: '#d97706' },
    { label: 'Aguardando revisão', value: '7', delta: '-3,1%', Icon: Clock3, iconBg: '#ede9fe', iconColor: '#7c3aed' },
    { label: 'Aprovadas', value: '42', delta: '+16,8%', Icon: CheckCircle2, iconBg: '#dcfce7', iconColor: '#16a34a' },
    { label: 'Não conformidades', value: '13', delta: '+4,3%', Icon: AlertTriangle, iconBg: '#fee2e2', iconColor: '#dc2626' },
  ];
  const locations = inspections.reduce<Array<{ name: string; client: string; count: number }>>(
    (items, inspection) => {
      const current = items.find((item) => item.name === inspection.location);
      if (current) {
        current.count += 1;
      } else {
        items.push({ name: inspection.location, client: inspection.client, count: 1 });
      }
      return items;
    },
    [],
  );
  const equipment = inspections.reduce<Array<{ name: string; location: string }>>(
    (items, inspection) => {
      if (!items.some((item) => item.name === inspection.equipment)) {
        items.push({ name: inspection.equipment, location: inspection.location });
      }
      return items;
    },
    [],
  );
  const nonconformities = inspections.filter((inspection) => inspection.status === 'Reprovada');

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
      </View>

      <View style={styles.stats}>
        {cards.map(({ label, value, delta, Icon, iconBg, iconColor }) => (
          <View key={label} style={[styles.stat, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <View style={styles.statTop}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
              <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
                <Icon size={18} color={iconColor} />
              </View>
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            <Text style={styles.delta}>{delta}</Text>
          </View>
        ))}
      </View>

      <Section title="Relatórios e indicadores" subtitle="Inspeções por período · últimos 7 dias" colors={colors}>
        <TrendChart colors={colors} data={trend} />
        <View style={styles.chartDivider} />
        <Text style={[styles.panelTitle, { color: colors.text }]}>Inspeções por status</Text>
        <Text style={[styles.panelSub, { color: colors.muted }]}>Distribuição atual</Text>
        <StatusChart colors={colors} data={statuses} />
      </Section>

      <Section
        title="Inspeções"
        subtitle="Acompanhe e revise as inspeções técnicas"
        colors={colors}
      >
        {inspections.length ? inspections.map((inspection) => (
          <InspectionCard
            key={inspection.id}
            item={inspection}
            colors={colors}
            onPress={() => onOpenInspection(inspection)}
          />
        )) : <Text style={[styles.empty, { color: colors.muted }]}>Nenhuma inspeção encontrada.</Text>}
      </Section>

      <Section title="Atividade recente" subtitle="Registros das inspeções" colors={colors}>
        {inspections.slice(0, 4).map((inspection) => (
          <View key={inspection.id} style={[styles.listRow, { borderBottomColor: colors.border }]}>
            <View style={styles.roundIcon}><ClipboardCheck size={17} color="#2563eb" /></View>
            <View style={styles.listBody}>
              <Text style={[styles.listTitle, { color: colors.text }]}>{inspection.id}</Text>
              <Text style={[styles.listSubtitle, { color: colors.muted }]}>
                {inspection.status} · {inspection.date}
              </Text>
            </View>
          </View>
        ))}
      </Section>

      <Section
        title="Calendário"
        subtitle="Agenda de inspeções"
        colors={colors}
      >
        {inspections.length ? inspections.map((inspection) => (
          <View key={inspection.id} style={[styles.listRow, { borderBottomColor: colors.border }]}>
            <View style={styles.dateTile}>
              <CalendarDays size={17} color="#2563eb" />
              <Text style={styles.dateText}>{inspection.date}</Text>
            </View>
            <View style={styles.listBody}>
              <Text style={[styles.listTitle, { color: colors.text }]}>{inspection.id} · {inspection.client}</Text>
              <Text style={[styles.listSubtitle, { color: colors.muted }]}>{inspection.equipment}</Text>
            </View>
          </View>
        )) : <Text style={[styles.empty, { color: colors.muted }]}>Nenhuma inspeção na agenda.</Text>}
      </Section>

      <Section
        title="Locais"
        subtitle="Unidades e áreas relacionadas às inspeções"
        colors={colors}
      >
        {locations.length ? locations.map((location) => (
          <View key={location.name} style={[styles.listRow, { borderBottomColor: colors.border }]}>
            <View style={styles.roundIcon}><MapPin size={17} color="#2563eb" /></View>
            <View style={styles.listBody}>
              <Text style={[styles.listTitle, { color: colors.text }]}>{location.name}</Text>
              <Text style={[styles.listSubtitle, { color: colors.muted }]}>{location.client}</Text>
            </View>
            <Text style={[styles.count, { color: colors.muted }]}>
              {location.count} {location.count === 1 ? 'inspeção' : 'inspeções'}
            </Text>
          </View>
        )) : <Text style={[styles.empty, { color: colors.muted }]}>Nenhum local encontrado.</Text>}
      </Section>

      <Section
        title="Equipamentos"
        subtitle="Ativos vinculados às inspeções"
        colors={colors}
      >
        {equipment.length ? equipment.map((item) => (
          <View key={item.name} style={[styles.listRow, { borderBottomColor: colors.border }]}>
            <View style={styles.roundIcon}><PackageCheck size={17} color="#2563eb" /></View>
            <View style={styles.listBody}>
              <Text style={[styles.listTitle, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.listSubtitle, { color: colors.muted }]}>{item.location}</Text>
            </View>
          </View>
        )) : <Text style={[styles.empty, { color: colors.muted }]}>Nenhum equipamento encontrado.</Text>}
      </Section>

      <Section
        title="Não conformidades"
        subtitle="Ocorrências reprovadas que precisam de acompanhamento"
        colors={colors}
      >
        {nonconformities.length ? nonconformities.map((inspection) => (
          <TouchableOpacity
            key={inspection.id}
            onPress={() => onOpenInspection(inspection)}
            style={[styles.listRow, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.roundIcon, styles.alertIcon]}><AlertTriangle size={17} color="#dc2626" /></View>
            <View style={styles.listBody}>
              <Text style={[styles.listTitle, { color: colors.text }]}>{inspection.equipment}</Text>
              <Text style={[styles.listSubtitle, { color: colors.muted }]}>{inspection.id} · {inspection.location}</Text>
            </View>
            <Text style={styles.openBadge}>Reprovada</Text>
          </TouchableOpacity>
        )) : <Text style={[styles.empty, { color: colors.muted }]}>Nenhuma não conformidade aberta.</Text>}
      </Section>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 36 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 18 },
  headingText: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: '900', color: '#2563eb', letterSpacing: 1.2 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.6, marginTop: 5 },
  subtitle: { fontSize: 11, lineHeight: 17, marginTop: 5 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48.4%', borderWidth: 1, borderRadius: 12, padding: 13 },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statLabel: { fontSize: 10, flex: 1, paddingRight: 5 },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 25, fontWeight: '900', marginTop: 7 },
  delta: { color: '#16a34a', fontSize: 9, marginTop: 2 },
  panel: { borderWidth: 1, borderRadius: 12, padding: 15, marginTop: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sectionHeading: { flex: 1 },
  panelTitle: { fontSize: 14, fontWeight: '900' },
  panelSub: { fontSize: 10, marginTop: 3 },
  chartDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 14 },
  listRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1 },
  listBody: { flex: 1 },
  listTitle: { fontSize: 11, fontWeight: '800' },
  listSubtitle: { fontSize: 9, marginTop: 3 },
  dateTile: { width: 66, alignItems: 'center', gap: 4 },
  dateText: { color: '#2563eb', fontSize: 8, fontWeight: '800' },
  roundIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  alertIcon: { backgroundColor: '#fee2e2' },
  count: { fontSize: 9, textAlign: 'right' },
  openBadge: { color: '#b91c1c', backgroundColor: '#fee2e2', fontSize: 8, fontWeight: '900', paddingHorizontal: 7, paddingVertical: 5, borderRadius: 6 },
  empty: { fontSize: 11, paddingVertical: 16 },
});
