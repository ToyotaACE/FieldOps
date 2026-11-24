import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X } from 'lucide-react-native';

/*
|--------------------------------------------------------------------------
| LEITURA DE QR CODE DO EQUIPAMENTO
|--------------------------------------------------------------------------
| Pede a permissão da câmera antes de abrir (RN-058). Se for negada, o
| técnico recebe orientação e pode seguir sem a leitura (RN-059).
*/

type Props = {
  visible: boolean;
  onClose: () => void;
  onScanned: (value: string) => void;
};

export function QrScannerModal({ visible, onClose, onScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [asked, setAsked] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    if (!visible) {
      handled.current = false;
      return;
    }

    if (permission && !permission.granted && permission.canAskAgain && !asked) {
      setAsked(true);
      void requestPermission();
    }
  }, [visible, permission, asked, requestPermission]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ler QR Code do equipamento</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar leitor">
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {!permission ? (
          <ActivityIndicator color="#ffffff" style={{ marginTop: 40 }} />
        ) : !permission.granted ? (
          <View style={styles.denied}>
            <Text style={styles.deniedText}>
              O acesso à câmera não foi permitido. Libere a permissão nas
              configurações do aparelho ou feche esta tela e confirme o
              equipamento manualmente.
            </Text>

            {permission.canAskAgain && (
              <TouchableOpacity style={styles.button} onPress={() => void requestPermission()}>
                <Text style={styles.buttonText}>Permitir câmera</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={(result) => {
              if (handled.current || !result.data) return;
              handled.current = true;
              onScanned(result.data.trim());
            }}
          />
        )}

        <Text style={styles.hint}>Aponte a câmera para a etiqueta do equipamento.</Text>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  camera: { flex: 1 },
  hint: { color: '#cbd5e1', textAlign: 'center', padding: 16, fontSize: 12 },
  denied: { padding: 24, gap: 16 },
  deniedText: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
  button: { backgroundColor: '#2563eb', padding: 12, borderRadius: 9, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: '800' },
});
