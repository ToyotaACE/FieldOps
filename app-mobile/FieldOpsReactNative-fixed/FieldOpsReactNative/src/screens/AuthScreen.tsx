import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Eye, EyeOff, HardHat, LockKeyhole, Mail } from 'lucide-react-native';
import { Palette } from '../types';

type AuthMode = 'login' | 'signup';

type AuthScreenProps = {
  colors: Palette;
  onContinue: () => void;
};

export function AuthScreen({ colors, onContinue }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const isSignup = mode === 'signup';

  function submit() {
    setError('');
    if (isSignup && !name.trim()) {
      setError('Informe seu nome.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Informe um e-mail valido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    onContinue();
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
  }

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={styles.mark}><HardHat size={24} color="#fff" /></View>
        <Text style={[styles.brand, { color: colors.text }]}>Field<Text style={styles.accent}>Ops</Text></Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Operacoes de campo, sob controle.</Text>

        <View style={[styles.tabs, { backgroundColor: colors.bg }]}>
          <TouchableOpacity onPress={() => switchMode('login')} style={[styles.tab, mode === 'login' && styles.activeTab]}>
            <Text style={[styles.tabText, { color: mode === 'login' ? '#1d4ed8' : colors.muted }]}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => switchMode('signup')} style={[styles.tab, mode === 'signup' && styles.activeTab]}>
            <Text style={[styles.tabText, { color: mode === 'signup' ? '#1d4ed8' : colors.muted }]}>Criar conta</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{isSignup ? 'Crie seu acesso' : 'Bem-vindo de volta'}</Text>
        <Text style={[styles.description, { color: colors.muted }]}>{isSignup ? 'Preencha seus dados para entrar no prototipo.' : 'Entre para visualizar o painel de operacoes.'}</Text>
        {isSignup && <TextInput value={name} onChangeText={setName} placeholder="Nome completo" placeholderTextColor={colors.muted} autoCapitalize="words" style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]} />}
        <View style={styles.inputWrap}>
          <Mail size={17} color={colors.muted} style={styles.icon} />
          <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={[styles.input, styles.withIcon, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]} />
        </View>
        <View style={styles.inputWrap}>
          <LockKeyhole size={17} color={colors.muted} style={styles.icon} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Senha" placeholderTextColor={colors.muted} secureTextEntry={!showPassword} style={[styles.input, styles.withIcon, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]} />
          <TouchableOpacity onPress={() => setShowPassword(value => !value)} style={styles.eye} accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
            {showPassword ? <EyeOff size={18} color={colors.muted} /> : <Eye size={18} color={colors.muted} />}
          </TouchableOpacity>
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity onPress={submit} style={styles.submit}><Text style={styles.submitText}>{isSignup ? 'Criar minha conta' : 'Entrar no FieldOps'}</Text></TouchableOpacity>
        <TouchableOpacity onPress={onContinue} style={styles.guest}><Text style={[styles.guestText, { color: colors.muted }]}>Continuar como visitante</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: 20 },
  panel: { width: '100%', maxWidth: 460, alignSelf: 'center', borderWidth: 1, borderRadius: 18, padding: 28 },
  mark: { width: 48, height: 48, borderRadius: 13, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 27, fontWeight: '900', marginTop: 12 },
  accent: { color: '#2563eb' },
  subtitle: { fontSize: 13, marginTop: 3 },
  tabs: { flexDirection: 'row', borderRadius: 9, padding: 3, marginTop: 28 },
  tab: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 7 },
  activeTab: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontSize: 12, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '900', marginTop: 26 },
  description: { fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 16 },
  inputWrap: { position: 'relative' },
  input: { height: 48, borderWidth: 1, borderRadius: 9, paddingHorizontal: 13, fontSize: 14, marginTop: 10 },
  withIcon: { paddingLeft: 42, paddingRight: 42 },
  icon: { position: 'absolute', left: 13, top: 25, zIndex: 1 },
  eye: { position: 'absolute', right: 9, top: 12, padding: 7 },
  error: { color: '#dc2626', fontSize: 12, marginTop: 12 },
  submit: { height: 48, borderRadius: 9, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  submitText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  guest: { alignItems: 'center', padding: 12, marginTop: 6 },
  guestText: { fontSize: 12, fontWeight: '700' },
});
