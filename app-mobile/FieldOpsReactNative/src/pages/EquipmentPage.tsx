import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CalendarDays, CheckCircle2, Ellipsis, MapPin, Plus, QrCode, Search, SlidersHorizontal, Wrench } from 'lucide-react-native';

import { Palette } from '../types';
import { equipmentPageStyles as styles } from './EquipmentPage.styles';

type EquipmentPageProps = {
  colors: Palette;
  onNew: () => void;
};

type Equipment = {
  id: string;
  name: string;
  tag: string;
  type: string;
  location: string;
  status: 'Operacional' | 'Em manutenção' | 'Parado';
  nextInspection: string;
  lastInspection: string;
};

const equipment: Equipment[] = [
  { id: 'EQP-021', name: 'Painel Elétrico', tag: 'PE-021', type: 'Painel de comando', location: 'Planta Sorocaba · Linha 02', status: 'Operacional', nextInspection: '18 ago 2026', lastInspection: '11 ago 2026' },
  { id: 'EQP-001', name: 'Compressor de Ar', tag: 'CP-001', type: 'Compressor industrial', location: 'Unidade Industrial 01', status: 'Em manutenção', nextInspection: '20 ago 2026', lastInspection: '09 ago 2026' },
  { id: 'EQP-103', name: 'Motor de Indução', tag: 'MTR-103', type: 'Motor elétrico', location: 'Planta Campinas · Setor B', status: 'Operacional', nextInspection: '22 ago 2026', lastInspection: '10 ago 2026' },
  { id: 'EQP-022', name: 'Bomba Hidráulica', tag: 'BH-022', type: 'Bomba centrífuga', location: 'Planta Sorocaba · Utilidades', status: 'Parado', nextInspection: '25 ago 2026', lastInspection: '10 ago 2026' },
];

export function EquipmentPage({ colors, onNew }: EquipmentPageProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | Equipment['status']>('Todos');

  const filteredEquipment = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return equipment.filter((item) => {
      const matchesStatus = statusFilter === 'Todos' || item.status === statusFilter;
      const matchesQuery = !normalizedQuery || `${item.name} ${item.tag} ${item.location} ${item.type}`.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  function showEquipmentAction(action: string, item: Equipment) {
    Alert.alert(action, `${item.name} · ${item.tag}`);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>ATIVOS OPERACIONAIS</Text>
          <Text style={[styles.title, { color: colors.text }]}>Equipamentos</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Consulte os ativos, identifique-os por QR Code e acompanhe as inspeções.</Text>
        </View>
       
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{equipment.length}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>ativos cadastrados</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <Text style={[styles.summaryValue, { color: '#16a34a' }]}>2</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>operacionais</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <Text style={[styles.summaryValue, { color: '#d97706' }]}>1</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>em manutenção</Text>
        </View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <Search size={18} color={colors.muted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Buscar por nome, tag ou local" placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.text }]} />
      </View>

      <View style={styles.filterRow}>
        <SlidersHorizontal size={15} color={colors.muted} />
        {(['Todos', 'Operacional', 'Em manutenção', 'Parado'] as const).map((filter) => (
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
        const statusColor = item.status === 'Operacional' ? '#15803d' : item.status === 'Parado' ? '#b91c1c' : '#a16207';
        const statusBackground = item.status === 'Operacional' ? '#dcfce7' : item.status === 'Parado' ? '#fee2e2' : '#fef3c7';
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
              <TouchableOpacity onPress={() => showEquipmentAction('Ações do equipamento', item)} style={styles.moreButton} accessibilityLabel={`Ações de ${item.name}`}>
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
              <TouchableOpacity style={styles.detailsButton} onPress={() => showEquipmentAction('Detalhes do equipamento', item)}><Text style={[styles.detailsText, { color: colors.muted }]}>Ver detalhes</Text></TouchableOpacity>
            </View>
          </View>
        );
      })}

      {filteredEquipment.length === 0 && <View style={[styles.emptyState, { backgroundColor: colors.panel, borderColor: colors.border }]}><Search size={24} color={colors.muted} /><Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum equipamento encontrado</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Ajuste a busca ou o filtro de status.</Text></View>}
    </ScrollView>
  );
}
