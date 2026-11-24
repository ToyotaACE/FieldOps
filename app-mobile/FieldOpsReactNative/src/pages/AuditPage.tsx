import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Activity, FileText, Filter, Search, ShieldCheck, UserRound } from 'lucide-react-native';

import { Palette } from '../types';
import { ApiAuditLog } from '../services/api';
import { formatDateTimeBR } from '../services/mappers';
import { auditPageStyles as styles } from './AuditPage.styles';

type AuditPageProps = {
  colors: Palette;
  logs: ApiAuditLog[];
  totalElements: number;
};

type AuditType = 'Inspeção' | 'Equipamento' | 'Cadastro' | 'Modelo' | 'Outro';

type AuditEvent = {
  id: string;
  action: string;
  description: string;
  actor: string;
  role: string;
  resource: string;
  time: string;
  createdAt: string;
  type: AuditType;
};

const ENTITY_LABELS: Record<string, { label: string; type: AuditType }> = {
  inspection: { label: 'Inspeção', type: 'Inspeção' },
  equipment: { label: 'Equipamento', type: 'Equipamento' },
  client: { label: 'Cliente', type: 'Cadastro' },
  inspectionsite: { label: 'Local', type: 'Cadastro' },
  user: { label: 'Usuário', type: 'Cadastro' },
  inspectiontemplate: { label: 'Modelo', type: 'Modelo' },
  inspectiontemplateversion: { label: 'Versão de modelo', type: 'Modelo' },
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criação',
  UPDATE: 'Atualização',
  DEACTIVATE: 'Desativação',
  ACTIVATE: 'Ativação',
  STATUS_CHANGE: 'Mudança de status',
  DELETE: 'Exclusão',
  LOGIN: 'Acesso',
};

function toAuditEvent(log: ApiAuditLog): AuditEvent {
  const entity = ENTITY_LABELS[(log.entityType || '').toLowerCase()] ?? {
    label: log.entityType || 'Registro',
    type: 'Outro' as AuditType,
  };

  const actionLabel = ACTION_LABELS[(log.action || '').toUpperCase()] ?? log.action;

  return {
    id: `AUD-${log.id}`,
    action: `${actionLabel} · ${entity.label}`,
    description: log.description || 'Sem descrição.',
    actor: log.actorName || 'Sistema',
    role: log.actorEmail || 'automático',
    resource: log.entityId ? `${entity.label} #${log.entityId}` : entity.label,
    time: formatDateTimeBR(log.createdAt),
    createdAt: log.createdAt,
    type: entity.type,
  };
}

function isSameDay(isoDate: string, reference: Date) {
  const date = new Date(isoDate);

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

export function AuditPage({ colors, logs, totalElements }: AuditPageProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Todos' | AuditType>('Todos');

  const auditEvents = useMemo(() => logs.map(toAuditEvent), [logs]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return auditEvents.filter((event) => {
      const matchesType = typeFilter === 'Todos' || event.type === typeFilter;
      const matchesQuery = !normalizedQuery || `${event.action} ${event.actor} ${event.resource} ${event.description}`.toLowerCase().includes(normalizedQuery);
      return matchesType && matchesQuery;
    });
  }, [auditEvents, query, typeFilter]);

  const todayCount = useMemo(() => {
    const today = new Date();
    return auditEvents.filter((event) => isSameDay(event.createdAt, today)).length;
  }, [auditEvents]);

  const actorCount = useMemo(
    () => new Set(auditEvents.map((event) => event.role)).size,
    [auditEvents],
  );

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
        <Text style={styles.eventCount}>{totalElements}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.panel, borderColor: colors.border }]}><Activity size={17} color="#2563eb" /><Text style={[styles.statValue, { color: colors.text }]}>{todayCount}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>eventos hoje</Text></View>
        <View style={[styles.statCard, { backgroundColor: colors.panel, borderColor: colors.border }]}><UserRound size={17} color="#16a34a" /><Text style={[styles.statValue, { color: colors.text }]}>{actorCount}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>usuários com ações</Text></View>
        <View style={[styles.statCard, { backgroundColor: colors.panel, borderColor: colors.border }]}><FileText size={17} color="#d97706" /><Text style={[styles.statValue, { color: colors.text }]}>{auditEvents.length}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>registros carregados</Text></View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.panel, borderColor: colors.border }]}><Search size={18} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Buscar ação, usuário ou recurso" placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.text }]} /></View>

      <View style={styles.filterRow}>
        <Filter size={15} color={colors.muted} />
        {(['Todos', 'Inspeção', 'Equipamento', 'Cadastro', 'Modelo'] as const).map((filter) => (
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
