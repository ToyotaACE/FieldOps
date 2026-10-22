import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, Gauge, Plus } from 'lucide-react-native';

import { Page, Palette } from '../types';

const descriptions: Partial<Record<Page, string>> = {
  Calendário: 'Planeje a agenda das equipes e visualize inspeções por período.',
  'Modelos de inspeção': 'Crie checklists dinâmicos e gerencie versões publicadas.',
  Locais: 'Unidades, plantas, prédios e áreas de cada cliente.',
  Equipamentos: 'Controle ativos, QR Codes e histórico de inspeções.',
  'Não conformidades': 'Acompanhe ocorrências, severidade, responsáveis e prazos.',
  Relatórios: 'Indicadores operacionais e análises de desempenho.',
  Auditoria: 'Histórico imutável das principais ações realizadas no sistema.',
  Configurações: 'Preferências e configurações do ambiente.',
};

type GenericScreenProps = {
  page: Page;
  colors: Palette;
  onNew: () => void;
  onBack?: () => void;
};

export function GenericScreen({ page, colors, onNew, onBack }: GenericScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {onBack && (
        <TouchableOpacity accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={17} color="#2563eb" />
          <Text style={styles.backText}>Voltar para inspeções</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.eyebrow}>FIELDOPS</Text>
      <Text style={[styles.title, { color: colors.text }]}>{page}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        {descriptions[page] || 'Gerencie as operações do FieldOps.'}
      </Text>
      <TouchableOpacity style={styles.primary} onPress={onNew}>
        <Plus size={17} color="#ffffff" />
        <Text style={styles.primaryText}>Novo registro</Text>
      </TouchableOpacity>
      <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={styles.icon}>
          <Gauge size={30} color="#2563eb" />
        </View>
        <Text style={[styles.panelTitle, { color: colors.text }]}>Módulo demonstrativo</Text>
        <Text style={[styles.body, { color: colors.muted }]}>
          Esta área usa dados locais e está disponível apenas para visualização.
        </Text>
        <TouchableOpacity style={styles.primary} onPress={onNew}>
          <Plus size={17} color="#ffffff" />
          <Text style={styles.primaryText}>Criar primeiro registro</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 40 },
  backButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  backText: { color: '#2563eb', fontSize: 12, fontWeight: '800' },
  eyebrow: { fontSize: 9, fontWeight: '900', color: '#2563eb', letterSpacing: 1.2 },
  title: { fontSize: 25, fontWeight: '900', marginTop: 5 },
  subtitle: { fontSize: 11, lineHeight: 17, marginTop: 5 },
  primary: { alignSelf: 'flex-start', backgroundColor: '#2563eb', height: 42, borderRadius: 9, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  primaryText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  panel: { borderWidth: 1, borderRadius: 13, padding: 24, marginTop: 18, alignItems: 'center' },
  icon: { width: 62, height: 62, borderRadius: 15, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' },
  panelTitle: { fontSize: 18, fontWeight: '900', marginTop: 15 },
  body: { fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 6, maxWidth: 430 },
});
