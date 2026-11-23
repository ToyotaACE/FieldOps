import React from 'react';
import { ArrowLeft, Moon, Sun, UserRound } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Palette } from '../types';

type SettingsScreenProps = {
  colors: Palette;
  dark: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
};

export function SettingsScreen({ colors, dark, onToggleTheme, onBack }: SettingsScreenProps) {
  return (
    <View style={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <ArrowLeft size={16} color="#2563eb" />
        <Text style={styles.backText}>Voltar ao dashboard</Text>
      </TouchableOpacity>
      <Text style={styles.eyebrow}>PREFERÊNCIAS</Text>
      <Text style={[styles.title, { color: colors.text }]}>Configurações</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Gerencie sua aparência e informações de perfil.
      </Text>

      <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={styles.icon}><UserRound size={20} color="#2563eb" /></View>
        <View style={styles.panelCopy}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Perfil</Text>
          <Text style={[styles.body, { color: colors.muted }]}>Carlos Souza · Supervisor</Text>
        </View>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={[styles.icon, styles.themeIcon]}>
          {dark ? <Sun size={20} color="#2563eb" /> : <Moon size={20} color="#2563eb" />}
        </View>
        <View style={styles.panelCopy}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Tema da aplicação</Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            Aparência atual: {dark ? 'escura' : 'clara'}.
          </Text>
        </View>
        <TouchableOpacity style={styles.themeButton} onPress={onToggleTheme}>
          <Text style={styles.themeButtonText}>{dark ? 'Usar tema claro' : 'Usar tema escuro'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.note, { color: colors.muted }]}>
        As preferências ficam disponíveis durante esta sessão.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 36 },
  backButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  backText: { color: '#2563eb', fontSize: 12, fontWeight: '800' },
  eyebrow: { fontSize: 9, fontWeight: '900', color: '#2563eb', letterSpacing: 1.2 },
  title: { fontSize: 24, fontWeight: '900', marginTop: 5 },
  subtitle: { fontSize: 11, lineHeight: 17, marginTop: 5, marginBottom: 8 },
  panel: { borderWidth: 1, borderRadius: 12, padding: 15, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  themeIcon: { backgroundColor: '#dbeafe' },
  panelCopy: { flex: 1 },
  panelTitle: { fontSize: 13, fontWeight: '900' },
  body: { fontSize: 10, marginTop: 4 },
  themeButton: { backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  themeButtonText: { color: '#ffffff', fontSize: 9, fontWeight: '800' },
  note: { fontSize: 10, lineHeight: 16, marginTop: 18 },
});
