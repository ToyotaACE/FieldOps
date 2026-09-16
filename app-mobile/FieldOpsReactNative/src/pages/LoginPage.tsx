import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { HardHat, LockKeyhole, Mail } from 'lucide-react-native';

import { Palette } from '../types';

type LoginPageProps = {
  colors: Palette;
  onLogin: () => void;
};

export function LoginPage({ colors, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Dados incompletos', 'Informe seu e-mail e sua senha para continuar.');
      return;
    }

    onLogin();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignSelf: 'center', width: '100%', maxWidth: 420 }}>
          <View style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' }}>
            <HardHat size={30} color="#ffffff" />
          </View>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 18 }}>FieldOps</Text>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 5 }}>
            Gestão de inspeções e equipamentos em campo.
          </Text>

          <View style={{ backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 18, marginTop: 28 }}>
            <Text style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>Entrar na sua conta</Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 5 }}>Acesse a operação da sua empresa.</Text>

            <View style={{ height: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, backgroundColor: colors.bg }}>
              <Mail size={17} color={colors.muted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail corporativo"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ flex: 1, color: colors.text, fontSize: 12 }}
              />
            </View>

            <View style={{ height: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: colors.bg }}>
              <LockKeyhole size={17} color={colors.muted} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Senha"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={{ flex: 1, color: colors.text, fontSize: 12 }}
              />
            </View>

            <TouchableOpacity onPress={handleLogin} style={{ height: 46, borderRadius: 9, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>Entrar</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 18 }}>Ambiente seguro para inspetores e supervisores.</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
