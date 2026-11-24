import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AlertTriangle, Camera, CheckCircle2, CloudOff, ImagePlus, Trash2 } from 'lucide-react-native';

import { Palette } from '../types';
import { getEvidenceImageUri, type InspectionEvidence } from '../services/api';
import { persistPhoto } from '../offline/files';
import type { LocalEvidence } from '../offline/repository';

type EvidenceGalleryProps = {
  colors: Palette;
  token: string | null;
  online: boolean;
  localEvidences: LocalEvidence[];
  serverEvidences: InspectionEvidence[];
  canAdd: boolean;
  onAdd: (photo: { uri: string; mimeType: string; fileName: string }) => Promise<void>;
  onDiscard?: (localId: string) => void;
};

/** Foto já gravada no servidor (carregada com autenticação, se online). */
function ServerThumb({
  evidence,
  token,
  online,
  colors,
}: {
  evidence: InspectionEvidence;
  token: string | null;
  online: boolean;
  colors: Palette;
}) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (token && online) {
      getEvidenceImageUri(token, evidence)
        .then((value) => {
          if (active) setUri(value);
        })
        .catch(() => undefined);
    }

    return () => {
      active = false;
    };
  }, [evidence.id, token, online]);

  if (!uri) {
    return (
      <View style={[thumbStyle, { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', padding: 4 }]}>
        <Text style={{ color: colors.muted, fontSize: 9, textAlign: 'center' }} numberOfLines={3}>
          {online ? 'Carregando...' : 'Disponível online'}
        </Text>
      </View>
    );
  }

  return <Image source={{ uri }} style={thumbStyle} />;
}

const thumbStyle = { width: 84, height: 84, borderRadius: 8 } as const;

/**
 * Fotos de um item do checklist ou de uma não conformidade. As novas fotos
 * ficam salvas no aparelho e sobem na sincronização.
 */
export function EvidenceGallery({
  colors,
  token,
  online,
  localEvidences,
  serverEvidences,
  canAdd,
  onAdd,
  onDiscard,
}: EvidenceGalleryProps) {
  const [busy, setBusy] = useState(false);

  async function handleAsset(asset: ImagePicker.ImagePickerAsset) {
    try {
      setBusy(true);
      const stored = await persistPhoto(asset.uri, asset.mimeType);
      await onAdd(stored);
    } catch (error) {
      Alert.alert(
        'Erro ao salvar foto',
        error instanceof Error ? error.message : 'Não foi possível salvar a foto no aparelho.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function takePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à câmera para registrar fotos. Você também pode escolher uma foto da galeria.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });

      if (!result.canceled && result.assets?.[0]) {
        await handleAsset(result.assets[0]);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    }
  }

  async function pickFromGallery() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso à galeria.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });

      if (!result.canceled && result.assets?.[0]) {
        await handleAsset(result.assets[0]);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir a galeria.');
    }
  }

  const total = localEvidences.length + serverEvidences.length;

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700' }}>
        Evidências ({total})
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {serverEvidences.map((evidence) => (
          <ServerThumb key={`s-${evidence.id}`} evidence={evidence} token={token} online={online} colors={colors} />
        ))}

        {localEvidences.map((evidence) => (
          <View key={evidence.localId}>
            <Image source={{ uri: evidence.fileUri }} style={thumbStyle} />

            <View
              style={{
                position: 'absolute',
                left: 4,
                bottom: 4,
                backgroundColor: 'rgba(15,23,42,.75)',
                borderRadius: 6,
                padding: 3,
              }}
            >
              {evidence.state === 'SYNCED' ? (
                <CheckCircle2 size={12} color="#4ade80" />
              ) : evidence.state === 'ERROR' ? (
                <AlertTriangle size={12} color="#f87171" />
              ) : (
                <CloudOff size={12} color="#fbbf24" />
              )}
            </View>

            {evidence.state !== 'SYNCED' && onDiscard && (
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Remover foto', 'Esta foto ainda não foi enviada. Deseja removê-la?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Remover', style: 'destructive', onPress: () => onDiscard(evidence.localId) },
                  ])
                }
                style={{ position: 'absolute', right: 4, top: 4, backgroundColor: 'rgba(15,23,42,.75)', borderRadius: 6, padding: 3 }}
                accessibilityLabel="Remover foto"
              >
                <Trash2 size={12} color="#ffffff" />
              </TouchableOpacity>
            )}

            {evidence.state === 'ERROR' && evidence.lastError ? (
              <Text style={{ color: '#dc2626', fontSize: 9, width: 84 }} numberOfLines={3}>
                {evidence.lastError}
              </Text>
            ) : null}
          </View>
        ))}

        {total === 0 && (
          <Text style={{ color: colors.muted, fontSize: 11 }}>Nenhuma foto registrada.</Text>
        )}
      </View>

      {canAdd && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <TouchableOpacity
            onPress={takePhoto}
            disabled={busy}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#2563eb',
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Camera size={16} color="#2563eb" />
            <Text style={{ color: '#2563eb', fontWeight: '700', fontSize: 12 }}>Tirar foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickFromGallery}
            disabled={busy}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: busy ? 0.6 : 1,
            }}
          >
            <ImagePlus size={16} color={colors.muted} />
            <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12 }}>Galeria</Text>
          </TouchableOpacity>
        </View>
      )}

      {busy && <ActivityIndicator style={{ marginTop: 6 }} color="#2563eb" />}
    </View>
  );
}
