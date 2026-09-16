import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Copy,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react-native';

import { Palette } from '../types';
import { inspectionModelsPageStyles as styles } from './InspectionModelsPage.styles';

type InspectionModelsPageProps = {
  colors: Palette;
  onNew: () => void;
};

type InspectionModel = {
  id: string;
  name: string;
  description: string;
  status: 'Publicado' | 'Rascunho';
  version: string;
  items: number;
  equipment: string;
  updatedAt: string;
  updatedBy: string;
};

const models: InspectionModel[] = [
  {
    id: 'MOD-001',
    name: 'Segurança operacional',
    description: 'Rotina para validar riscos, proteções e condições de trabalho.',
    status: 'Publicado',
    version: 'v2.1',
    items: 18,
    equipment: 'Máquinas e painéis',
    updatedAt: 'Hoje, 09:42',
    updatedBy: 'Carla Mendes',
  },
  {
    id: 'MOD-002',
    name: 'Manutenção preventiva',
    description: 'Checklist de componentes, lubrificação e sinais de desgaste.',
    status: 'Publicado',
    version: 'v1.4',
    items: 24,
    equipment: 'Compressores e motores',
    updatedAt: '12 ago 2026',
    updatedBy: 'Rafael Souza',
  },
  {
    id: 'MOD-003',
    name: 'Inspeção de recebimento',
    description: 'Conferência de integridade e identificação antes da entrada em operação.',
    status: 'Rascunho',
    version: 'v0.3',
    items: 11,
    equipment: 'Equipamentos novos',
    updatedAt: '08 ago 2026',
    updatedBy: 'João Silva',
  },
];

export function InspectionModelsPage({ colors, onNew }: InspectionModelsPageProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | InspectionModel['status']>('Todos');

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return models.filter((model) => {
      const matchesStatus = statusFilter === 'Todos' || model.status === statusFilter;
      const matchesQuery = !normalizedQuery
        || `${model.name} ${model.description} ${model.equipment}`.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  function showModelAction(action: string, model: InspectionModel) {
    Alert.alert(action, `${model.name} (${model.version})`);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>CONFIGURAÇÃO OPERACIONAL</Text>
          <Text style={[styles.title, { color: colors.text }]}>Modelos de inspeção</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Checklists padronizados para orientar o inspetor em cada equipamento.</Text>
        </View>

       
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#dbeafe' }]}>
            <ClipboardList size={18} color="#2563eb" />
          </View>
          <View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{models.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>modelos ativos</Text>
          </View>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#dcfce7' }]}>
            <CheckCircle2 size={18} color="#16a34a" />
          </View>
          <View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>2</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>publicados</Text>
          </View>
        </View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <Search size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar modelo ou equipamento"
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <View style={styles.filterRow}>
        <SlidersHorizontal size={15} color={colors.muted} />
        {(['Todos', 'Publicado', 'Rascunho'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setStatusFilter(filter)}
            style={[styles.filterButton, { borderColor: colors.border }, statusFilter === filter && styles.filterButtonActive]}
          >
            <Text style={[styles.filterText, { color: statusFilter === filter ? '#1d4ed8' : colors.muted }]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Modelos cadastrados</Text>
        <Text style={[styles.resultCount, { color: colors.muted }]}>{filteredModels.length} resultados</Text>
      </View>

      {filteredModels.map((model) => (
        <View key={model.id} style={[styles.modelCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <View style={styles.cardTopRow}>
            <View style={styles.modelIdentity}>
              <View style={styles.modelIcon}>
                <FileText size={20} color="#2563eb" />
              </View>
              <View style={styles.modelTitleBlock}>
                <Text style={[styles.modelTitle, { color: colors.text }]}>{model.name}</Text>
                <Text style={[styles.modelId, { color: colors.muted }]}>{model.id} · {model.version}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.moreButton} onPress={() => showModelAction('Ações do modelo', model)} accessibilityLabel={`Ações de ${model.name}`}>
              <MoreHorizontal size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modelDescription, { color: colors.muted }]}>{model.description}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, model.status === 'Publicado' ? styles.publishedBadge : styles.draftBadge]}>
              <View style={[styles.statusDot, { backgroundColor: model.status === 'Publicado' ? '#16a34a' : '#d97706' }]} />
              <Text style={[styles.statusText, { color: model.status === 'Publicado' ? '#15803d' : '#a16207' }]}>{model.status}</Text>
            </View>
            <Text style={[styles.equipmentText, { color: colors.muted }]}>{model.equipment}</Text>
          </View>

          <View style={[styles.metadataRow, { borderTopColor: colors.border }]}>
            <View style={styles.metadataItem}>
              <ClipboardList size={14} color={colors.muted} />
              <Text style={[styles.metadataText, { color: colors.muted }]}>{model.items} itens</Text>
            </View>
            <View style={styles.metadataItem}>
              <Clock3 size={14} color={colors.muted} />
              <Text style={[styles.metadataText, { color: colors.muted }]}>{model.updatedAt}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => showModelAction('Editar modelo', model)}>
              <Pencil size={14} color="#2563eb" />
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => showModelAction('Duplicar modelo', model)}>
              <Copy size={14} color={colors.muted} />
              <Text style={[styles.actionText, { color: colors.muted }]}>Duplicar</Text>
            </TouchableOpacity>
            <Text style={[styles.updatedBy, { color: colors.muted }]}>por {model.updatedBy}</Text>
          </View>
        </View>
      ))}

      {filteredModels.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <Search size={24} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum modelo encontrado</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Ajuste a busca ou o filtro de status.</Text>
        </View>
      )}
    </ScrollView>
  );
}
