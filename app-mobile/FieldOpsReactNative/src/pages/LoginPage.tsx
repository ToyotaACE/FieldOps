
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { HardHat, LockKeyhole, Mail } from 'lucide-react-native';

import { Palette } from '../types';
import { AuthUser, loginRequest } from '../services/api';

type LoginPageProps = {
  colors: Palette;
  onLogin: (token: string, user: AuthUser) => void | Promise<void>;
};

export function LoginPage({ colors, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogin() {
    if (loading) return;

    if (!email.trim() || !password) {
      setErrorMessage('Informe seu e-mail e sua senha para continuar.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const result = await loginRequest(email, password);

      await onLogin(result.token, result.user);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '';

      if (
        message.toLowerCase().includes('failed to fetch') ||
        message.toLowerCase().includes('network request failed')
      ) {
        setErrorMessage(
          'Não foi possível conectar ao servidor. Verifique se o backend está ativo e se a conexão está configurada corretamente.',
        );
      } else {
        setErrorMessage(
          message || 'Não foi possível entrar. Tente novamente.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignSelf: 'center', width: '100%', maxWidth: 420 }}>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              backgroundColor: '#2563eb',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HardHat size={30} color="#ffffff" />
          </View>

          <Text
            style={{
              color: colors.text,
              fontSize: 28,
              fontWeight: '900',
              marginTop: 18,
            }}
          >
            FieldOps
          </Text>

          <Text
            style={{
              color: colors.muted,
              fontSize: 13,
              lineHeight: 20,
              marginTop: 5,
            }}
          >
            Gestão de inspeções e equipamentos em campo.
          </Text>

          <View
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 16,
              padding: 18,
              marginTop: 28,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 19,
                fontWeight: '900',
              }}
            >
              Entrar na sua conta
            </Text>

            <Text
              style={{
                color: colors.muted,
                fontSize: 11,
                marginTop: 5,
              }}
            >
              Acesse a operação da sua empresa.
            </Text>

            <View
              style={{
                height: 46,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 9,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 20,
                backgroundColor: colors.bg,
              }}
            >
              <Mail size={17} color={colors.muted} />

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail corporativo"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                onSubmitEditing={handleLogin}
                returnKeyType="next"
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 12,
                }}
              />
            </View>

            <View
              style={{
                height: 46,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 9,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 10,
                backgroundColor: colors.bg,
              }}
            >
              <LockKeyhole size={17} color={colors.muted} />

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Senha"
                placeholderTextColor={colors.muted}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 12,
                }}
              />
            </View>

            {errorMessage ? (
              <View
                accessibilityRole="alert"
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#dc2626',
                  backgroundColor: '#fef2f2',
                }}
              >
                <Text
                  style={{
                    color: '#b91c1c',
                    fontSize: 12,
                    lineHeight: 18,
                  }}
                >
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Entrar"
              style={{
                height: 46,
                borderRadius: 9,
                backgroundColor: loading ? '#93b4f5' : '#2563eb',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginTop: 16,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : null}

              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: '900',
                }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={{
              color: colors.muted,
              fontSize: 10,
              textAlign: 'center',
              marginTop: 18,
            }}
          >
            Ambiente seguro para inspetores e supervisores.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
