import React, { useMemo, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CalendarDays, CheckCircle2, Ellipsis, MapPin, QrCode, Search, SlidersHorizontal, Wrench } from 'lucide-react-native';

import { Inspection, Palette } from '../types';
import { ApiEquipment } from '../services/api';
import { formatDateBR } from '../services/mappers';
import { PageContent } from '../components/PageContent';
import { equipmentPageStyles as styles } from './EquipmentPage.styles';

type EquipmentPageProps = {
  colors: Palette;
  equipments: ApiEquipment[];
  inspections: Inspection[];
  embedded?: boolean;
};

type EquipmentStatus = 'Ativo' | 'Inativo';

type EquipmentItem = {
  id: string;
  name: string;
  tag: string;
  type: string;
  serialNumber: string;
  client: string;
  location: string;
  status: EquipmentStatus;
  nextInspection: string;
  lastInspection: string;
};

const PERFORMED_STATUSES = ['Concluída', 'Aguardando revisão', 'Aprovada', 'Reprovada'];
const PENDING_STATUSES = ['Agendada', 'Em andamento'];

function todayKey() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
}

function buildEquipmentItems(equipments: ApiEquipment[], inspections: Inspection[]): EquipmentItem[] {
  const today = todayKey();

  return equipments.map((equipment) => {
    const related = inspections.filter((inspection) => inspection.equipmentId === equipment.id);

    const performed = related
      .filter((inspection) => PERFORMED_STATUSES.includes(inspection.status))
      .map((inspection) => inspection.scheduledDate)
      .filter(Boolean)
      .sort();

    const upcoming = related
      .filter((inspection) => PENDING_STATUSES.includes(inspection.status) && inspection.scheduledDate >= today)
      .map((inspection) => inspection.scheduledDate)
      .sort();

    return {
      id: String(equipment.id),
      name: equipment.name,
      tag: equipment.qrCode,
      type: equipment.category || 'Sem categoria',
      serialNumber: equipment.serialNumber || 'Não informado',
      client: equipment.clientName,
      location: `${equipment.clientName} · ${equipment.siteName}`,
      status: equipment.active ? 'Ativo' : 'Inativo',
      nextInspection: upcoming.length ? formatDateBR(upcoming[0]) : '—',
      lastInspection: performed.length ? formatDateBR(performed[performed.length - 1]) : '—',
    };
  });
}

export function EquipmentPage({ colors, equipments, inspections, embedded = false }: EquipmentPageProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | EquipmentStatus>('Todos');

  const items = useMemo(() => buildEquipmentItems(equipments, inspections), [equipments, inspections]);

  const filteredEquipment = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'Todos' || item.status === statusFilter;
      const matchesQuery = !normalizedQuery || `${item.name} ${item.tag} ${item.location} ${item.type} ${item.serialNumber}`.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [items, query, statusFilter]);

  const activeCount = items.filter((item) => item.status === 'Ativo').length;
  const inactiveCount = items.length - activeCount;

  function showEquipmentAction(action: string, item: EquipmentItem) {
    Alert.alert(action, `${item.name} · ${item.tag}`);
  }

  function showDetails(item: EquipmentItem) {
    Alert.alert(
      item.name,
      [
        `QR Code: ${item.tag}`,
        `Categoria: ${item.type}`,
        `Número de série: ${item.serialNumber}`,
        `Cliente: ${item.client}`,
        `Local: ${item.location}`,
        `Situação: ${item.status}`,
      ].join('\n'),
    );
  }

  return (
    <PageContent embedded={embedded} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>ATIVOS OPERACIONAIS</Text>
          <Text style={[styles.title, { color: colors.text }]}>Equipamentos</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Consulte os ativos, identifique-os por QR Code e acompanhe as inspeções.</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{items.length}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>ativos cadastrados</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <Text style={[styles.summaryValue, { color: '#16a34a' }]}>{activeCount}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>ativos</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <Text style={[styles.summaryValue, { color: '#b91c1c' }]}>{inactiveCount}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>inativos</Text>
        </View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <Search size={18} color={colors.muted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Buscar por nome, tag ou local" placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.text }]} />
      </View>

      <View style={styles.filterRow}>
        <SlidersHorizontal size={15} color={colors.muted} />
        {(['Todos', 'Ativo', 'Inativo'] as const).map((filter) => (
          <TouchableOpacity key={filter} onPress={() => setStatusFilter(filter)} style={[styles.filterButton, { borderColor: colors.border }, statusFilter === filter && styles.filterButtonActive]}>
            <Text style={[styles.filterText, { color: statusFilter === filter ? '#1d4ed8' : colors.muted }]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Inventário de equipamentos</Text>
        <Text style={[styles.resultCount, { color: colors.muted }]}>{filteredEquipment.length} resultados</Text>
      </View>

      {filteredEquipment.map((item) => {
        const isActive = item.status === 'Ativo';
        const statusColor = isActive ? '#15803d' : '#b91c1c';
        const statusBackground = isActive ? '#dcfce7' : '#fee2e2';
        return (
          <View key={item.id} style={[styles.equipmentCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <View style={styles.cardTopRow}>
              <View style={styles.equipmentIdentity}>
                <View style={styles.equipmentIcon}><Wrench size={20} color="#2563eb" /></View>
                <View style={styles.equipmentTitleBlock}>
                  <Text style={[styles.equipmentName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.equipmentTag, { color: colors.muted }]}>{item.tag} · {item.type}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => showDetails(item)} style={styles.moreButton} accessibilityLabel={`Ações de ${item.name}`}>
                <Ellipsis size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusBackground }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
            </View>

            <View style={[styles.locationRow, { borderTopColor: colors.border }]}>
              <MapPin size={14} color={colors.muted} />
              <Text style={[styles.locationText, { color: colors.muted }]}>{item.location}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}><CalendarDays size={14} color={colors.muted} /><Text style={[styles.infoText, { color: colors.muted }]}>Próxima: {item.nextInspection}</Text></View>
              <View style={styles.infoItem}><CheckCircle2 size={14} color="#16a34a" /><Text style={[styles.infoText, { color: colors.muted }]}>Última: {item.lastInspection}</Text></View>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.qrButton} onPress={() => showEquipmentAction('QR Code', item)}><QrCode size={14} color="#2563eb" /><Text style={styles.qrText}>Abrir QR Code</Text></TouchableOpacity>
              <TouchableOpacity style={styles.detailsButton} onPress={() => showDetails(item)}><Text style={[styles.detailsText, { color: colors.muted }]}>Ver detalhes</Text></TouchableOpacity>
            </View>
          </View>
        );
      })}

      {filteredEquipment.length === 0 && <View style={[styles.emptyState, { backgroundColor: colors.panel, borderColor: colors.border }]}><Search size={24} color={colors.muted} /><Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum equipamento encontrado</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Ajuste a busca ou o filtro de situação.</Text></View>}
    </PageContent>
  );
}
