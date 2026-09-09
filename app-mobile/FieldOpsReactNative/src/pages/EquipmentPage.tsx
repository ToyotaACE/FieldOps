import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Gauge, Plus } from 'lucide-react-native';

import { Palette } from '../types';
import { equipmentPageStyles as styles } from './EquipmentPage.styles';

type EquipmentPageProps = {
  colors: Palette;
  onNew: () => void;
};

export function EquipmentPage({ colors, onNew }: EquipmentPageProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>FIELDOPS</Text>
      <Text style={[styles.title, { color: colors.text }]}>Equipamentos</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Controle ativos, QR Codes e histórico de inspeções.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={onNew}>
        <Plus size={17} color="#ffffff" />
        <Text style={styles.primaryButtonText}>Novo registro</Text>
      </TouchableOpacity>

      <View
        style={[
          styles.panel,
          { backgroundColor: colors.panel, borderColor: colors.border },
        ]}
      >
        <View style={styles.icon}>
          <Gauge size={30} color="#2563eb" />
        </View>
        <Text style={[styles.panelTitle, { color: colors.text }]}>Cadastro de equipamentos</Text>
        <Text style={[styles.body, { color: colors.muted }]}>
          A estrutura desta área está criada e pronta para receber persistência no Supabase, CRUDs e regras de negócio.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onNew}>
          <Plus size={17} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Criar primeiro registro</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
