import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Bell, Check, ChevronRight, Cloud, Moon, ShieldCheck, Smartphone, Sun, UserRound } from 'lucide-react-native';

import { Palette } from '../types';
import { settingsPageStyles as styles } from './SettingsPage.styles';

type SettingsPageProps = {
  colors: Palette;
  darkMode: boolean;
  onToggleDarkMode: () => void;
};

export function SettingsPage({ colors, darkMode, onToggleDarkMode }: SettingsPageProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(true);

  function showComingSoon(title: string) {
    Alert.alert(title, 'Esta configuração será persistida quando a conta estiver conectada ao Supabase.');
  }

  function renderToggle(enabled: boolean, onPress: () => void) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.toggle, enabled && styles.toggleActive]} accessibilityRole="switch" accessibilityState={{ checked: enabled }}>
        <View style={[styles.toggleThumb, enabled && styles.toggleThumbActive]} />
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>PREFERÊNCIAS DO USUÁRIO</Text>
      <Text style={[styles.title, { color: colors.text }]}>Configurações</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>Ajuste seu ambiente de trabalho e as preferências do inspetor.</Text>

      <View style={[styles.profileCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={styles.avatar}><Text style={styles.avatarText}>CS</Text></View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>Carlos Souza</Text>
          <Text style={[styles.profileRole, { color: colors.muted }]}>Supervisor · Operações</Text>
          <Text style={[styles.profileEmail, { color: colors.muted }]}>carlos.souza@fieldops.com</Text>
        </View>
        <TouchableOpacity onPress={() => showComingSoon('Editar perfil')} style={styles.chevronButton} accessibilityLabel="Editar perfil">
          <ChevronRight size={19} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferências gerais</Text>
      <View style={[styles.settingsCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={styles.settingRow}>
          <View style={[styles.settingIcon, { backgroundColor: '#dbeafe' }]}><Bell size={17} color="#2563eb" /></View>
          <View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.text }]}>Notificações</Text><Text style={[styles.settingDescription, { color: colors.muted }]}>Alertas de inspeções e não conformidades</Text></View>
          {renderToggle(notificationsEnabled, () => setNotificationsEnabled((current) => !current))}
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.settingRow}>
          <View style={[styles.settingIcon, { backgroundColor: '#dcfce7' }]}><Cloud size={17} color="#16a34a" /></View>
          <View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.text }]}>Sincronização offline</Text><Text style={[styles.settingDescription, { color: colors.muted }]}>Continue trabalhando sem conexão</Text></View>
          {renderToggle(offlineSyncEnabled, () => setOfflineSyncEnabled((current) => !current))}
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.settingRow}>
          <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>{darkMode ? <Moon size={17} color="#a16207" /> : <Sun size={17} color="#d97706" />}</View>
          <View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.text }]}>Tema escuro</Text><Text style={[styles.settingDescription, { color: colors.muted }]}>{darkMode ? 'Ativado' : 'Desativado'}</Text></View>
          {renderToggle(darkMode, onToggleDarkMode)}
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Operação</Text>
      <View style={[styles.settingsCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.settingRow} onPress={() => showComingSoon('Modelos padrão')}>
          <View style={[styles.settingIcon, { backgroundColor: '#eff6ff' }]}><Check size={17} color="#2563eb" /></View>
          <View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.text }]}>Modelo padrão de inspeção</Text><Text style={[styles.settingDescription, { color: colors.muted }]}>Segurança operacional · v2.1</Text></View>
          <ChevronRight size={18} color={colors.muted} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={styles.settingRow} onPress={() => showComingSoon('Dispositivos conectados')}>
          <View style={[styles.settingIcon, { backgroundColor: '#f1f5f9' }]}><Smartphone size={17} color="#475569" /></View>
          <View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.text }]}>Dispositivos conectados</Text><Text style={[styles.settingDescription, { color: colors.muted }]}>1 dispositivo ativo nesta conta</Text></View>
          <ChevronRight size={18} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Segurança</Text>
      <TouchableOpacity style={[styles.securityCard, { backgroundColor: colors.panel, borderColor: colors.border }]} onPress={() => showComingSoon('Segurança da conta')}>
        <View style={styles.securityIcon}><ShieldCheck size={19} color="#16a34a" /></View>
        <View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.text }]}>Conta protegida</Text><Text style={[styles.settingDescription, { color: colors.muted }]}>Senha e autenticação da sua conta</Text></View>
        <ChevronRight size={18} color={colors.muted} />
      </TouchableOpacity>

      <Text style={[styles.version, { color: colors.muted }]}>FieldOps Mobile · versão 1.0.0</Text>
    </ScrollView>
  );
}
