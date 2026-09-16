import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Activity, FileText, Filter, Plus, Search, ShieldCheck, UserRound } from 'lucide-react-native';

import { Palette } from '../types';
import { auditPageStyles as styles } from './AuditPage.styles';

type AuditPageProps = {
  colors: Palette;
  onNew: () => void;
};

type AuditEvent = {
  id: string;
  action: string;
  description: string;
  actor: string;
  role: string;
  resource: string;
  time: string;
  date: string;
  type: 'Inspeção' | 'Equipamento' | 'Modelo' | 'Acesso';
};

const auditEvents: AuditEvent[] = [
  { id: 'AUD-1008', action: 'Inspeção aprovada', description: 'A inspeção técnica foi aprovada após revisão das evidências.', actor: 'Mariana Costa', role: 'Supervisora', resource: 'INS-000124 · Painel Elétrico PE-021', time: 'Hoje, 10:24', date: '15 ago 2026', type: 'Inspeção' },
  { id: 'AUD-1007', action: 'Modelo publicado', description: 'Uma nova versão do checklist foi disponibilizada para a operação.', actor: 'Carla Mendes', role: 'Administradora', resource: 'Segurança operacional · v2.1', time: 'Hoje, 09:42', date: '15 ago 2026', type: 'Modelo' },
  { id: 'AUD-1006', action: 'Equipamento atualizado', description: 'O status e a próxima data de inspeção foram alterados.', actor: 'Rafael Souza', role: 'Inspetor', resource: 'EQP-001 · Compressor de Ar', time: 'Ontem, 16:18', date: '14 ago 2026', type: 'Equipamento' },
  { id: 'AUD-1005', action: 'Acesso realizado', description: 'Login realizado com autenticação válida.', actor: 'João Silva', role: 'Inspetor', resource: 'Aplicativo FieldOps', time: 'Ontem, 08:03', date: '14 ago 2026', type: 'Acesso' },
  { id: 'AUD-1004', action: 'Inspeção reprovada', description: 'Uma não conformidade crítica foi registrada durante a inspeção.', actor: 'Ana Costa', role: 'Inspetora', resource: 'INS-000121 · Bomba Hidráulica BH-022', time: '13 ago, 15:47', date: '13 ago 2026', type: 'Inspeção' },
];

export function AuditPage({ colors, onNew }: AuditPageProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Todos' | AuditEvent['type']>('Todos');

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return auditEvents.filter((event) => {
      const matchesType = typeFilter === 'Todos' || event.type === typeFilter;
      const matchesQuery = !normalizedQuery || `${event.action} ${event.actor} ${event.resource} ${event.description}`.toLowerCase().includes(normalizedQuery);
      return matchesType && matchesQuery;
    });
  }, [query, typeFilter]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>CONTROLE E RASTREABILIDADE</Text>
          <Text style={[styles.title, { color: colors.text }]}>Auditoria</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Acompanhe as ações realizadas no sistema e mantenha a operação rastreável.</Text>
        </View>
        
      </View>

      <View style={[styles.auditBanner, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={styles.bannerIcon}><ShieldCheck size={21} color="#2563eb" /></View>
        <View style={styles.bannerText}>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>Registro protegido</Text>
          <Text style={[styles.bannerDescription, { color: colors.muted }]}>Eventos registrados não podem ser alterados ou excluídos.</Text>
        </View>
        <Text style={styles.eventCount}>{auditEvents.length}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.panel, borderColor: colors.border }]}><Activity size={17} color="#2563eb" /><Text style={[styles.statValue, { color: colors.text }]}>24</Text><Text style={[styles.statLabel, { color: colors.muted }]}>eventos hoje</Text></View>
        <View style={[styles.statCard, { backgroundColor: colors.panel, borderColor: colors.border }]}><UserRound size={17} color="#16a34a" /><Text style={[styles.statValue, { color: colors.text }]}>8</Text><Text style={[styles.statLabel, { color: colors.muted }]}>usuários ativos</Text></View>
        <View style={[styles.statCard, { backgroundColor: colors.panel, borderColor: colors.border }]}><FileText size={17} color="#d97706" /><Text style={[styles.statValue, { color: colors.text }]}>156</Text><Text style={[styles.statLabel, { color: colors.muted }]}>registros no mês</Text></View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.panel, borderColor: colors.border }]}><Search size={18} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Buscar ação, usuário ou recurso" placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.text }]} /></View>

      <View style={styles.filterRow}>
        <Filter size={15} color={colors.muted} />
        {(['Todos', 'Inspeção', 'Equipamento', 'Modelo', 'Acesso'] as const).map((filter) => (
          <TouchableOpacity key={filter} onPress={() => setTypeFilter(filter)} style={[styles.filterButton, { borderColor: colors.border }, typeFilter === filter && styles.filterButtonActive]}><Text style={[styles.filterText, { color: typeFilter === filter ? '#1d4ed8' : colors.muted }]}>{filter}</Text></TouchableOpacity>
        ))}
      </View>

      <View style={styles.listHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>Atividade recente</Text><Text style={[styles.resultCount, { color: colors.muted }]}>{filteredEvents.length} eventos</Text></View>

      {filteredEvents.map((event, index) => (
        <View key={event.id} style={styles.timelineRow}>
          <View style={styles.timelineRail}><View style={styles.timelineDot} />{index < filteredEvents.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}</View>
          <View style={[styles.eventCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <View style={styles.eventHeader}><View style={styles.eventTitleBlock}><Text style={[styles.eventAction, { color: colors.text }]}>{event.action}</Text><Text style={[styles.eventTime, { color: colors.muted }]}>{event.time}</Text></View><View style={styles.eventType}><Text style={styles.eventTypeText}>{event.type}</Text></View></View>
            <Text style={[styles.eventDescription, { color: colors.muted }]}>{event.description}</Text>
            <View style={[styles.resourceRow, { borderTopColor: colors.border }]}><FileText size={14} color={colors.muted} /><Text style={[styles.resourceText, { color: colors.text }]}>{event.resource}</Text></View>
            <View style={styles.eventFooter}><View style={styles.actor}><UserRound size={13} color={colors.muted} /><Text style={[styles.actorText, { color: colors.muted }]}>{event.actor} · {event.role}</Text></View><Text style={[styles.eventId, { color: colors.muted }]}>{event.id}</Text></View>
          </View>
        </View>
      ))}

      {filteredEvents.length === 0 && <View style={[styles.emptyState, { backgroundColor: colors.panel, borderColor: colors.border }]}><Search size={24} color={colors.muted} /><Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum evento encontrado</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Ajuste a busca ou o tipo de evento.</Text></View>}
    </ScrollView>
  );
}
