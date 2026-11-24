
import React, { useMemo, useState } from 'react';

import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardList,
  FileText,
  ImagePlus,
  MapPin,
  ShieldAlert,
  Trash2,
} from 'lucide-react-native';

import {
  Inspection,
  NonConformitySeverity,
  Palette,
} from '../types';

import type { AuthUser, NonConformitySeverityApi } from '../services/api';
import { formatInspectionCode } from '../services/mappers';
import { persistPhoto } from '../offline/files';
import * as repo from '../offline/repository';

import { PageContent } from '../components/PageContent';
import {
  reportsPageStyles as styles,
} from './ReportsPage.styles';

/*
|--------------------------------------------------------------------------
| REGISTRO DE NÃO CONFORMIDADE
|--------------------------------------------------------------------------
| Toda não conformidade pertence a uma inspeção em andamento (RN-052).
| É salva no aparelho e enviada na sincronização, com as fotos.
| Não conformidade crítica exige descrição e foto (RN-055).
*/

type ReportsPageProps = {
  colors: Palette;
  user: AuthUser;
  inspections: Inspection[];
  initialInspectionId?: number | null;
  onBack: () => void;
  embedded?: boolean;
};

const NON_CONFORMITY_TYPES = [
  'Elétrica',
  'Mecânica',
  'Estrutural',
  'Segurança',
  'Operacional',
  'Desgaste',
  'Vazamento',
  'Temperatura',
  'Ruído / Vibração',
  'Outro',
];

const SEVERITIES: NonConformitySeverity[] = [
  'Baixa',
  'Média',
  'Alta',
  'Crítica',
];

const SEVERITY_TO_API: Record<NonConformitySeverity, NonConformitySeverityApi> = {
  Baixa: 'LOW',
  'Média': 'MEDIUM',
  Alta: 'HIGH',
  'Crítica': 'CRITICAL',
};

type Photo = { uri: string; mimeType: string; fileName: string };

export function ReportsPage({
  colors,
  user,
  inspections,
  initialInspectionId = null,
  onBack,
  embedded = false,
}: ReportsPageProps) {
  // Somente inspeções do técnico em execução aceitam não conformidades.
  const available = useMemo(
    () => inspections.filter((inspection) => inspection.backendStatus === 'IN_PROGRESS'),
    [inspections],
  );

  const [selectedInspectionId, setSelectedInspectionId] = useState<string>(
    initialInspectionId ? String(initialInspectionId) : '',
  );
  const [nonConformityType, setNonConformityType] = useState('');
  const [severity, setSeverity] = useState<NonConformitySeverity>('Média');
  const [problemDescription, setProblemDescription] = useState('');
  const [probableCause, setProbableCause] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [technicalNotes, setTechnicalNotes] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedInspection = available.find((inspection) => inspection.id === selectedInspectionId);

  async function addAsset(asset: ImagePicker.ImagePickerAsset) {
    const stored = await persistPhoto(asset.uri, asset.mimeType);
    setPhotos((current) => [...current, stored]);
  }

  async function takePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à câmera para registrar fotos, ou escolha uma foto da galeria.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });

      if (!result.canceled && result.assets?.[0]) {
        await addAsset(result.assets[0]);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    }
  }

  async function addPhotoFromGallery() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso à galeria.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) return;

      for (const asset of result.assets) {
        await addAsset(asset);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir a galeria.');
    }
  }

  function removePhoto(indexToRemove: number) {
    setPhotos((current) => current.filter((_, index) => index !== indexToRemove));
  }

  function clearForm() {
    setNonConformityType('');
    setSeverity('Média');
    setProblemDescription('');
    setProbableCause('');
    setRecommendedAction('');
    setTechnicalNotes('');
    setPhotos([]);
  }

  async function handleSave() {
    if (!selectedInspection) {
      Alert.alert('Inspeção obrigatória', 'Selecione a inspeção em andamento.');
      return;
    }

    if (!nonConformityType) {
      Alert.alert('Tipo obrigatório', 'Selecione o tipo de não conformidade.');
      return;
    }

    if (!problemDescription.trim()) {
      Alert.alert('Descrição obrigatória', 'Descreva o problema encontrado.');
      return;
    }

    if (severity === 'Crítica' && photos.length === 0) {
      Alert.alert(
        'Evidência obrigatória',
        'Para uma não conformidade crítica, adicione pelo menos uma foto como evidência.',
      );
      return;
    }

    try {
      setSaving(true);

      await repo.addNonConformity(
        user.id,
        Number(selectedInspection.id),
        {
          templateItemId: null,
          severity: SEVERITY_TO_API[severity],
          type: nonConformityType,
          description: problemDescription.trim(),
          probableCause: probableCause.trim() || null,
          recommendedAction: recommendedAction.trim() || null,
          technicalNotes: technicalNotes.trim() || null,
        },
        photos,
      );

      clearForm();

      Alert.alert(
        'Não conformidade registrada',
        'Salva no aparelho e vinculada à inspeção. Será enviada ao servidor automaticamente.',
        [{ text: 'OK', onPress: onBack }],
      );
    } catch (error) {
      Alert.alert(
        'Erro ao salvar',
        error instanceof Error ? error.message : 'Não foi possível salvar a não conformidade.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContent
      embedded={embedded}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <ArrowLeft size={17} color="#2563eb" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.eyebrow}>FIELDOPS</Text>

      <Text style={[styles.title, { color: colors.text }]}>Registrar não conformidade</Text>

      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Registre o problema encontrado durante a inspeção. Funciona sem internet.
      </Text>

      {/* INSPEÇÃO */}
      <View style={[styles.formCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <ClipboardList size={19} color="#2563eb" />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Inspeção</Text>
        </View>

        <Text style={[styles.fieldLabel, { color: colors.muted }]}>SELECIONE A INSPEÇÃO EM ANDAMENTO</Text>

        <View style={styles.optionsContainer}>
          {available.length === 0 && (
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Nenhuma inspeção em andamento. Inicie uma inspeção para registrar não conformidades.
            </Text>
          )}

          {available.map((inspection) => {
            const selected = inspection.id === selectedInspectionId;

            return (
              <TouchableOpacity
                key={inspection.id}
                style={[
                  styles.equipmentOption,
                  { borderColor: selected ? '#2563eb' : colors.border },
                  selected && styles.selectedEquipmentOption,
                ]}
                onPress={() => setSelectedInspectionId(inspection.id)}
              >
                <View style={styles.equipmentOptionHeader}>
                  <Text style={[styles.equipmentName, { color: colors.text }]}>{inspection.equipment}</Text>

                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{formatInspectionCode(inspection.id)}</Text>
                  </View>
                </View>

                <Text style={[styles.equipmentClient, { color: colors.muted }]}>{inspection.client}</Text>

                <View style={styles.locationRow}>
                  <MapPin size={14} color={colors.muted} />
                  <Text style={[styles.locationText, { color: colors.muted }]}>{inspection.location}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedInspection && (
          <View style={[styles.selectedEquipmentCard, { borderTopColor: colors.border }]}>
            <CheckCircle2 size={18} color="#16a34a" />
            <View style={styles.selectedEquipmentContent}>
              <Text style={[styles.selectedEquipmentLabel, { color: colors.muted }]}>INSPEÇÃO SELECIONADA</Text>
              <Text style={[styles.selectedEquipmentText, { color: colors.text }]}>
                {formatInspectionCode(selectedInspection.id)} · {selectedInspection.title}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* CLASSIFICAÇÃO */}
      <View style={[styles.formCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <ShieldAlert size={19} color="#dc2626" />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Classificação</Text>
        </View>

        <Text style={[styles.fieldLabel, { color: colors.muted }]}>TIPO</Text>

        <View style={styles.chipContainer}>
          {NON_CONFORMITY_TYPES.map((type) => {
            const selected = nonConformityType === type;

            return (
              <TouchableOpacity
                key={type}
                onPress={() => setNonConformityType(type)}
                style={[styles.typeChip, { borderColor: colors.border }, selected && styles.selectedTypeChip]}
              >
                <Text style={[styles.typeChipText, { color: selected ? '#ffffff' : colors.text }]}>{type}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.severityLabel, { color: colors.muted }]}>CRITICIDADE</Text>

        <View style={styles.severityContainer}>
          {SEVERITIES.map((item) => {
            const selected = severity === item;

            return (
              <TouchableOpacity
                key={item}
                onPress={() => setSeverity(item)}
                style={[styles.severityButton, { borderColor: colors.border }, selected && styles.selectedSeverityButton]}
              >
                <Text style={[styles.severityButtonText, { color: selected ? '#ffffff' : colors.text }]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* DESCRIÇÃO */}
      <View style={[styles.formCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <FileText size={19} color="#2563eb" />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Descrição</Text>
        </View>

        <Text style={[styles.fieldLabel, { color: colors.muted }]}>PROBLEMA ENCONTRADO *</Text>
        <TextInput
          value={problemDescription}
          onChangeText={setProblemDescription}
          multiline
          maxLength={4000}
          placeholder="Descreva o problema"
          placeholderTextColor={colors.muted}
          style={[styles.textAreaLarge, { color: colors.text, borderColor: colors.border }]}
        />

        <Text style={[styles.fieldLabel, { color: colors.muted }]}>CAUSA PROVÁVEL</Text>
        <TextInput
          value={probableCause}
          onChangeText={setProbableCause}
          multiline
          maxLength={4000}
          placeholder="Opcional"
          placeholderTextColor={colors.muted}
          style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
        />

        <Text style={[styles.fieldLabel, { color: colors.muted }]}>AÇÃO RECOMENDADA</Text>
        <TextInput
          value={recommendedAction}
          onChangeText={setRecommendedAction}
          multiline
          maxLength={4000}
          placeholder="Opcional"
          placeholderTextColor={colors.muted}
          style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
        />

        <Text style={[styles.fieldLabel, { color: colors.muted }]}>NOTAS TÉCNICAS</Text>
        <TextInput
          value={technicalNotes}
          onChangeText={setTechnicalNotes}
          multiline
          maxLength={4000}
          placeholder="Opcional"
          placeholderTextColor={colors.muted}
          style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
        />
      </View>

      {/* FOTOS */}
      <View style={[styles.formCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={styles.evidenceHeader}>
          <View style={styles.evidenceIcon}>
            <Camera size={19} color="#2563eb" />
          </View>
          <View style={styles.evidenceHeaderContent}>
            <Text style={[styles.evidenceTitle, { color: colors.text }]}>Fotos</Text>
            <Text style={[styles.evidenceDescription, { color: colors.muted }]}>
              {severity === 'Crítica'
                ? 'Obrigatório: ao menos uma foto para não conformidade crítica.'
                : 'Opcional. As fotos ficam salvas no aparelho até serem enviadas.'}
            </Text>
          </View>
        </View>

        <View style={styles.mediaButtons}>
          <TouchableOpacity style={[styles.mediaButton, { borderColor: colors.border }]} onPress={() => void takePhoto()}>
            <Camera size={17} color="#2563eb" />
            <Text style={styles.mediaButtonText}>Câmera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.mediaButton, { borderColor: colors.border }]} onPress={() => void addPhotoFromGallery()}>
            <ImagePlus size={17} color="#2563eb" />
            <Text style={styles.mediaButtonText}>Galeria</Text>
          </TouchableOpacity>
        </View>

        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={photo.uri} style={styles.photoContainer}>
                <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                <TouchableOpacity style={styles.removeMediaButton} onPress={() => removePhoto(index)}>
                  <Trash2 size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { opacity: saving || !selectedInspection ? 0.6 : 1 }]}
        disabled={saving || !selectedInspection}
        onPress={() => void handleSave()}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Registrar não conformidade'}</Text>
      </TouchableOpacity>
    </PageContent>
  );
}
