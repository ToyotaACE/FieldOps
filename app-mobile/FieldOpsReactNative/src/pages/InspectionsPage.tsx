import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, Download, Plus, QrCode, X } from 'lucide-react-native';

import { InspectionCard } from '../components/InspectionCard';
import { StatusBadge } from '../components/StatusBadge';
import { Inspection, Palette } from '../types';
import { inspectionsPageStyles as styles } from './InspectionsPage.styles';

type InspectionsPageProps = {
  colors: Palette;
  inspections: Inspection[];
  selected: Inspection | null;
  onOpenInspection: (inspection: Inspection) => void;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
  onNewInspection: () => void;
};

const checklistItems = [
  'Identificação do equipamento',
  'Condições de segurança',
  'Componentes e conexões',
  'Evidências fotográficas',
];

export function InspectionsPage({
  colors,
  inspections,
  selected,
  onOpenInspection,
  onBack,
  onApprove,
  onReject,
  onNewInspection,
}: InspectionsPageProps) {
  if (selected) {
    const inspectionInformation = [
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

        <View style={styles.statusWrapper}>
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

          <Text style={[styles.panelTitleSpaced, { color: colors.text }]}>Checklist da inspeção</Text>

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

          <Text style={[styles.panelTitleSpaced, { color: colors.text }]}>Evidências</Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Galeria de evidências',
                'Integração com câmera/galeria pode ser conectada aqui.',
              )
            }
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
          {inspectionInformation.map(([label, value]) => (
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

        <TouchableOpacity style={styles.newButton} onPress={onNewInspection}>
          <Plus size={17} color="#ffffff" />
          <Text style={styles.buttonText}>Nova</Text>
        </TouchableOpacity>
      </View>

      {inspections.length > 0 ? (
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
