import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart3, CheckCircle2, Download, Plus, QrCode, X } from 'lucide-react-native';

import { Inspection, Palette } from '../types';
import { InspectionCard } from '../components/InspectionCard';
import { StatusBadge } from '../components/StatusBadge';

type InspectionsScreenProps = {
  colors: Palette;
  inspections: Inspection[];
  selected: Inspection | null;
  onOpenInspection: (inspection: Inspection) => void;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
  onNewInspection: () => void;
  onOpenReports: () => void;
};

const checklistItems = [
  'Identificação do equipamento',
  'Condições de segurança',
  'Componentes e conexões',
  'Evidências fotográficas',
];

export function InspectionsScreen({
  colors,
  inspections,
  selected,
  onOpenInspection,
  onBack,
  onApprove,
  onReject,
  onNewInspection,
  onOpenReports,
}: InspectionsScreenProps) {
  if (selected) {
    const information = [
      ['Técnico', selected.technician],
      ['Data', selected.date],
      ['Prioridade', selected.priority],
      ['Equipamento', selected.equipment],
      ['Local', selected.location],
    ];

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Voltar para inspeções</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>{selected.id}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{selected.equipment}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {selected.client} · {selected.location}
        </Text>

        <View style={styles.status}>
          <StatusBadge status={selected.status} />
        </View>

        <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <View style={styles.banner}>
            <View style={[styles.qr, { borderColor: colors.border }]}>
              <QrCode size={44} color="#0f172a" />
            </View>
            <View style={styles.bannerText}>
              <Text style={[styles.panelTitle, { color: colors.text }]}>Inspeção técnica</Text>
              <Text style={[styles.small, { color: colors.muted }]}>
                Modelo: Segurança Operacional · v2.1
              </Text>
              <Text style={[styles.progressLabel, { color: colors.muted }]}>
                Progresso: {selected.progress}%
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${selected.progress}%` }]} />
              </View>
            </View>
          </View>

          <Text style={[styles.panelTitle, styles.spacedTitle, { color: colors.text }]}>
            Checklist da inspeção
          </Text>
          {checklistItems.map((item, index) => (
            <View key={item} style={[styles.checklistRow, { borderBottomColor: colors.border }]}>
              <CheckCircle2 size={18} color="#16a34a" />
              <View style={styles.checklistText}>
                <Text style={[styles.checklistTitle, { color: colors.text }]}>
                  {index + 1}. {item}
                </Text>
                <Text style={[styles.small, { color: colors.muted }]}>
                  Verificação realizada conforme procedimento.
                </Text>
              </View>
              <Text style={styles.answer}>Conforme</Text>
            </View>
          ))}

          <Text style={[styles.panelTitle, styles.spacedTitle, { color: colors.text }]}>
            Evidências
          </Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Galeria de evidências', 'Integração com câmera/galeria pode ser conectada aqui.')}
            style={[styles.evidence, { borderColor: colors.muted }]}
          >
            <Download size={26} color={colors.muted} />
            <Text style={[styles.checklistTitle, { color: colors.muted }]}>Galeria de evidências</Text>
            <Text style={[styles.small, { color: colors.muted }]}>
              As fotos enviadas pelo técnico aparecerão aqui.
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Dados da inspeção</Text>
          {information.map(([label, value]) => (
            <View key={label} style={[styles.info, { borderBottomColor: colors.border }]}>
              <Text style={[styles.small, { color: colors.muted }]}>{label}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Revisão</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Revise as respostas e evidências antes de tomar uma decisão.
          </Text>
          <TouchableOpacity style={styles.approve} onPress={onApprove}>
            <CheckCircle2 size={17} color="#ffffff" />
            <Text style={styles.buttonText}>Aprovar inspeção</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reject} onPress={onReject}>
            <X size={17} color="#dc2626" />
            <Text style={styles.rejectText}>Reprovar inspeção</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>OPERAÇÕES</Text>
          <Text style={[styles.title, { color: colors.text }]}>Inspeções</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Planeje, acompanhe e revise inspeções técnicas.
          </Text>
        </View>
        <View style={styles.headingActions}>
          <TouchableOpacity style={styles.reportButton} onPress={onOpenReports}>
            <BarChart3 size={16} color="#ffffff" />
            <Text style={styles.buttonText}>Relatório</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newButton} onPress={onNewInspection}>
            <Plus size={17} color="#ffffff" />
            <Text style={styles.buttonText}>Nova</Text>
          </TouchableOpacity>
        </View>
      </View>

      {inspections.length ? (
        inspections.map((inspection) => (
          <InspectionCard
            key={inspection.id}
            item={inspection}
            colors={colors}
            onPress={() => onOpenInspection(inspection)}
          />
        ))
      ) : (
        <Text style={[styles.empty, { color: colors.muted }]}>Nenhuma inspeção encontrada.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 40 },
  heading: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  headingText: { flex: 1 },
  headingActions: { alignItems: 'flex-end', gap: 7, marginTop: 4 },
  eyebrow: { fontSize: 9, fontWeight: '900', color: '#2563eb', letterSpacing: 1.2, marginTop: 4 },
  title: { fontSize: 24, fontWeight: '900', marginTop: 4 },
  subtitle: { fontSize: 11, lineHeight: 17, marginTop: 5 },
  newButton: { backgroundColor: '#2563eb', height: 38, borderRadius: 9, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 5 },
  reportButton: { backgroundColor: '#1d4ed8', height: 38, borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  buttonText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  back: { color: '#2563eb', fontSize: 12, fontWeight: '800', marginBottom: 16 },
  status: { marginTop: 10 },
  panel: { borderWidth: 1, borderRadius: 12, padding: 15, marginTop: 14 },
  panelTitle: { fontSize: 14, fontWeight: '900' },
  spacedTitle: { marginTop: 20 },
  banner: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  bannerText: { flex: 1 },
  qr: { width: 62, height: 62, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  small: { fontSize: 9, lineHeight: 14, marginTop: 3 },
  progressLabel: { fontSize: 9, marginTop: 8 },
  progressTrack: { height: 5, backgroundColor: '#e2e8f0', borderRadius: 5, marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 5 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 13, borderBottomWidth: 1 },
  checklistText: { flex: 1 },
  checklistTitle: { fontSize: 11, fontWeight: '800' },
  answer: { fontSize: 8, color: '#15803d', backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 5, fontWeight: '900' },
  evidence: { height: 130, borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 5 },
  info: { paddingVertical: 11, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  infoValue: { fontSize: 10, fontWeight: '800', flex: 1, textAlign: 'right' },
  approve: { height: 44, borderRadius: 9, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, marginTop: 14 },
  reject: { height: 44, borderRadius: 9, borderWidth: 1, borderColor: '#fecaca', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, marginTop: 8 },
  rejectText: { color: '#dc2626', fontSize: 11, fontWeight: '900' },
  empty: { textAlign: 'center', paddingVertical: 50, fontSize: 12 },
});
