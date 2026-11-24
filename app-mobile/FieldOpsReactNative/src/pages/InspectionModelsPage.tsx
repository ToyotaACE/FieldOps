import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
} from 'lucide-react-native';

import { Palette } from '../types';
import { ApiTemplate, ApiTemplateVersion } from '../services/api';
import { formatDateTimeBR } from '../services/mappers';
import { inspectionModelsPageStyles as styles } from './InspectionModelsPage.styles';

type InspectionModelsPageProps = {
  colors: Palette;
  templates: ApiTemplate[];
  versionsByTemplate: Record<number, ApiTemplateVersion[]>;
};

type ModelStatus = 'Publicado' | 'Rascunho' | 'Inativo';

type InspectionModel = {
  id: string;
  name: string;
  description: string;
  status: ModelStatus;
  version: string;
  versionCount: number;
  category: string;
  updatedAt: string;
};

function buildModels(
  templates: ApiTemplate[],
  versionsByTemplate: Record<number, ApiTemplateVersion[]>,
): InspectionModel[] {
  return templates.map((template) => {
    const versions = versionsByTemplate[template.id] ?? [];

    const published = versions
      .filter((version) => version.published)
      .sort((a, b) => b.versionNumber - a.versionNumber);

    const latest = [...versions].sort((a, b) => b.versionNumber - a.versionNumber)[0];
    const current = published[0] ?? latest;

    let status: ModelStatus = 'Rascunho';

    if (!template.active) {
      status = 'Inativo';
    } else if (published.length > 0) {
      status = 'Publicado';
    }

    return {
      id: String(template.id),
      name: template.title,
      description: template.description || 'Sem descrição.',
      status,
      version: current ? `v${current.versionNumber}` : '—',
      versionCount: versions.length,
      category: template.category || 'Sem categoria',
      updatedAt: formatDateTimeBR(template.updatedAt || template.createdAt) || '—',
    };
  });
}

function statusColors(status: ModelStatus) {
  switch (status) {
    case 'Publicado':
      return { dot: '#16a34a', text: '#15803d' };

    case 'Inativo':
      return { dot: '#dc2626', text: '#b91c1c' };

    default:
      return { dot: '#d97706', text: '#a16207' };
  }
}

export function InspectionModelsPage({ colors, templates, versionsByTemplate }: InspectionModelsPageProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | ModelStatus>('Todos');

  const models = useMemo(() => buildModels(templates, versionsByTemplate), [templates, versionsByTemplate]);

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return models.filter((model) => {
      const matchesStatus = statusFilter === 'Todos' || model.status === statusFilter;
      const matchesQuery = !normalizedQuery
        || `${model.name} ${model.description} ${model.category}`.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [models, query, statusFilter]);

  const publishedCount = models.filter((model) => model.status === 'Publicado').length;

  function showModelDetails(model: InspectionModel) {
    Alert.alert(
      model.name,
      [
        `Categoria: ${model.category}`,
        `Versão atual: ${model.version} (${model.versionCount} no total)`,
        `Situação: ${model.status}`,
        `Atualizado em: ${model.updatedAt}`,
      ].join('\n'),
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>modelos cadastrados</Text>
          </View>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#dcfce7' }]}>
            <CheckCircle2 size={18} color="#16a34a" />
          </View>
          <View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{publishedCount}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>publicados</Text>
          </View>
        </View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <Search size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar modelo ou categoria"
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <View style={styles.filterRow}>
        <SlidersHorizontal size={15} color={colors.muted} />
        {(['Todos', 'Publicado', 'Rascunho', 'Inativo'] as const).map((filter) => (
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

      {filteredModels.map((model) => {
        const palette = statusColors(model.status);

        return (
          <View key={model.id} style={[styles.modelCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <View style={styles.cardTopRow}>
              <View style={styles.modelIdentity}>
                <View style={styles.modelIcon}>
                  <FileText size={20} color="#2563eb" />
                </View>
                <View style={styles.modelTitleBlock}>
                  <Text style={[styles.modelTitle, { color: colors.text }]}>{model.name}</Text>
                  <Text style={[styles.modelId, { color: colors.muted }]}>MOD-{model.id.padStart(3, '0')} · {model.version}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.moreButton} onPress={() => showModelDetails(model)} accessibilityLabel={`Detalhes de ${model.name}`}>
                <MoreHorizontal size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modelDescription, { color: colors.muted }]}>{model.description}</Text>

            <View style={styles.badgeRow}>
              <View style={[styles.statusBadge, model.status === 'Publicado' ? styles.publishedBadge : styles.draftBadge]}>
                <View style={[styles.statusDot, { backgroundColor: palette.dot }]} />
                <Text style={[styles.statusText, { color: palette.text }]}>{model.status}</Text>
              </View>
              <Text style={[styles.equipmentText, { color: colors.muted }]}>{model.category}</Text>
            </View>

            <View style={[styles.metadataRow, { borderTopColor: colors.border }]}>
              <View style={styles.metadataItem}>
                <ClipboardList size={14} color={colors.muted} />
                <Text style={[styles.metadataText, { color: colors.muted }]}>
                  {model.versionCount} {model.versionCount === 1 ? 'versão' : 'versões'}
                </Text>
              </View>
              <View style={styles.metadataItem}>
                <Clock3 size={14} color={colors.muted} />
                <Text style={[styles.metadataText, { color: colors.muted }]}>{model.updatedAt}</Text>
              </View>
            </View>
          </View>
        );
      })}

      {filteredModels.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <Search size={24} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum modelo encontrado</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Ajuste a busca ou o filtro de situação.</Text>
        </View>
      )}
    </ScrollView>
  );
}
