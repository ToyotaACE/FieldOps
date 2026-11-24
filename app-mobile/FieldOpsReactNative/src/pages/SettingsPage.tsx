import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, ChevronDown, ChevronRight, Cloud, Moon, ShieldCheck, Sun } from 'lucide-react-native';

import { Palette } from '../types';
import { API_BASE_URL, AuthUser, changeMyPassword, updateMyProfile } from '../services/api';
import { settingsPageStyles as styles } from './SettingsPage.styles';

type SettingsPageProps = {
  colors: Palette;
  user: AuthUser;
  token: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onBack: () => void;
  onProfileUpdated: (user: AuthUser) => void | Promise<void>;
  onSessionExpired: () => void;
};

function getRoleLabel(role: AuthUser['role']) {
  switch (role) {
    case 'ADMIN':
      return 'Administrador';
    case 'SUPERVISOR':
      return 'Supervisor';
    case 'TECHNICIAN':
      return 'Técnico';
  }
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || 'U'
  );
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function SettingsPage({
  colors,
  user,
  token,
  darkMode,
  onToggleDarkMode,
  onBack,
  onProfileUpdated,
  onSessionExpired,
}: SettingsPageProps) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(user.name);
  const [document, setDocument] = useState(user.document ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.bg,
    marginTop: 6,
  } as const;

  const labelStyle = { color: colors.muted, fontSize: 10, fontWeight: '800', marginTop: 12 } as const;

  const primaryButtonStyle = (disabled: boolean) =>
    ({
      backgroundColor: '#2563eb',
      borderRadius: 9,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 16,
      opacity: disabled ? 0.6 : 1,
    }) as const;

  function handleApiError(error: unknown, title: string) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.';

    if (message === 'SESSION_INVALID') {
      onSessionExpired();
      return;
    }

    Alert.alert(title, message);
  }

  function toggleProfileEditor() {
    if (!editingProfile) {
      setName(user.name);
      setDocument(user.document ?? '');
      setPhone(user.phone ?? '');
    }

    setEditingProfile((current) => !current);
  }

  async function handleSaveProfile() {
    const cleanName = name.trim();
    const cleanDocument = onlyDigits(document);
    const cleanPhone = onlyDigits(phone);

    if (!cleanName) {
      Alert.alert('Nome obrigatório', 'Informe o seu nome.');
      return;
    }

    if (cleanDocument && cleanDocument.length !== 11) {
      Alert.alert('CPF inválido', 'O CPF deve conter 11 números.');
      return;
    }

    if (cleanPhone && (cleanPhone.length < 10 || cleanPhone.length > 11)) {
      Alert.alert('Telefone inválido', 'Informe o DDD e o número (10 ou 11 dígitos).');
      return;
    }

    try {
      setSavingProfile(true);

      const updated = await updateMyProfile(token, {
        name: cleanName,
        document: cleanDocument,
        phone: cleanPhone,
      });

      await onProfileUpdated(updated);

      setEditingProfile(false);
      Alert.alert('Perfil atualizado', 'Seus dados foram salvos no FieldOps.');
    } catch (error) {
      handleApiError(error, 'Erro ao atualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      Alert.alert('Campos obrigatórios', 'Informe a senha atual e a nova senha.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Senha curta', 'A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Senhas diferentes', 'A confirmação não confere com a nova senha.');
      return;
    }

    try {
      setSavingPassword(true);

      await changeMyPassword(token, currentPassword, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChangingPassword(false);

      Alert.alert('Senha alterada', 'Sua senha foi atualizada com sucesso.');
    } catch (error) {
      handleApiError(error, 'Erro ao alterar senha');
    } finally {
      setSavingPassword(false);
    }
  }

  function renderToggle(enabled: boolean, onPress: () => void) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.toggle, enabled && styles.toggleActive]} accessibilityRole="switch" accessibilityState={{ checked: enabled }}>
        <View style={[styles.toggleThumb, enabled && styles.toggleThumbActive]} />
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <ArrowLeft size={16} color="#2563eb" />
        <Text style={styles.backButtonText}>Voltar ao dashboard</Text>
      </TouchableOpacity>
      <Text style={styles.eyebrow}>PREFERÊNCIAS DO USUÁRIO</Text>
      <Text style={[styles.title, { color: colors.text }]}>Configurações</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>Ajuste seu ambiente de trabalho e os dados da sua conta.</Text>

      <View style={[styles.profileCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(user.name)}</Text></View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>{user.name}</Text>
          <Text style={[styles.profileRole, { color: colors.muted }]}>{getRoleLabel(user.role)}</Text>
          <Text style={[styles.profileEmail, { color: colors.muted }]}>{user.email}</Text>
        </View>
        <TouchableOpacity onPress={toggleProfileEditor} style={styles.chevronButton} accessibilityLabel="Editar perfil">
          {editingProfile ? <ChevronDown size={19} color={colors.muted} /> : <ChevronRight size={19} color={colors.muted} />}
        </TouchableOpacity>
      </View>

      {editingProfile && (
        <View style={[styles.settingsCard, { backgroundColor: colors.panel, borderColor: colors.border, padding: 14, marginTop: 10 }]}>
          <Text style={labelStyle}>NOME</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor={colors.muted} style={inputStyle} editable={!savingProfile} />

          <Text style={labelStyle}>CPF (somente números)</Text>
          <TextInput value={document} onChangeText={setDocument} placeholder="00000000000" placeholderTextColor={colors.muted} keyboardType="number-pad" maxLength={14} style={inputStyle} editable={!savingProfile} />

          <Text style={labelStyle}>TELEFONE (com DDD)</Text>
          <TextInput value={phone} onChangeText={setPhone} placeholder="11999999999" placeholderTextColor={colors.muted} keyboardType="phone-pad" maxLength={16} style={inputStyle} editable={!savingProfile} />

          <TouchableOpacity onPress={handleSaveProfile} disabled={savingProfile} style={primaryButtonStyle(savingProfile)}>
            {savingProfile ? <ActivityIndicator color="#ffffff" /> : <Text style={{ color: '#ffffff', fontWeight: '800' }}>Salvar perfil</Text>}
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferências gerais</Text>
      <View style={[styles.settingsCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={styles.settingRow}>
          <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>{darkMode ? <Moon size={17} color="#a16207" /> : <Sun size={17} color="#d97706" />}</View>
          <View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.text }]}>Tema escuro</Text><Text style={[styles.settingDescription, { color: colors.muted }]}>{darkMode ? 'Ativado' : 'Desativado'}</Text></View>
          {renderToggle(darkMode, onToggleDarkMode)}
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.settingRow}>
          <View style={[styles.settingIcon, { backgroundColor: '#dcfce7' }]}><Cloud size={17} color="#16a34a" /></View>
          <View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.text }]}>Servidor FieldOps</Text><Text style={[styles.settingDescription, { color: colors.muted }]} numberOfLines={2}>{API_BASE_URL}</Text></View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Segurança</Text>
      <TouchableOpacity style={[styles.securityCard, { backgroundColor: colors.panel, borderColor: colors.border }]} onPress={() => setChangingPassword((current) => !current)}>
        <View style={styles.securityIcon}><ShieldCheck size={19} color="#16a34a" /></View>
        <View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.text }]}>Alterar senha</Text><Text style={[styles.settingDescription, { color: colors.muted }]}>Use pelo menos 8 caracteres</Text></View>
        {changingPassword ? <ChevronDown size={18} color={colors.muted} /> : <ChevronRight size={18} color={colors.muted} />}
      </TouchableOpacity>

      {changingPassword && (
        <View style={[styles.settingsCard, { backgroundColor: colors.panel, borderColor: colors.border, padding: 14, marginTop: 10 }]}>
          <Text style={labelStyle}>SENHA ATUAL</Text>
          <TextInput value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" placeholder="Senha atual" placeholderTextColor={colors.muted} style={inputStyle} editable={!savingPassword} />

          <Text style={labelStyle}>NOVA SENHA</Text>
          <TextInput value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" placeholder="Nova senha" placeholderTextColor={colors.muted} style={inputStyle} editable={!savingPassword} />

          <Text style={labelStyle}>CONFIRMAR NOVA SENHA</Text>
          <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" placeholder="Repita a nova senha" placeholderTextColor={colors.muted} style={inputStyle} editable={!savingPassword} />

          <TouchableOpacity onPress={handleChangePassword} disabled={savingPassword} style={primaryButtonStyle(savingPassword)}>
            {savingPassword ? <ActivityIndicator color="#ffffff" /> : <Text style={{ color: '#ffffff', fontWeight: '800' }}>Alterar senha</Text>}
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.version, { color: colors.muted }]}>FieldOps Mobile · versão 1.0.0</Text>
    </ScrollView>
  );
}
