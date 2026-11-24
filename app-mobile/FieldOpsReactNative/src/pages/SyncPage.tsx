import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, Camera, CloudOff, RefreshCw, Trash2, Wifi } from 'lucide-react-native';

import { Palette } from '../types';
import type { AuthUser } from '../services/api';
import { formatDateTimeBR, formatInspectionCode } from '../services/mappers';
import { SyncBadge } from '../components/SyncBadge';
import { useLocalQuery, useSyncStatus } from '../offline/hooks';
import * as repo from '../offline/repository';
import { syncEngine } from '../offline/syncEngine';

/*
|--------------------------------------------------------------------------
| TELA DE SINCRONIZAÇÃO
|--------------------------------------------------------------------------
| Mostra o estado geral, a última sincronização, as pendências e os erros.
| O técnico pode forçar o envio, reenviar o que falhou ou descartar uma
| pendência rejeitada (decisão explícita, nunca automática).
*/

const TYPE_LABELS: Record<string, string> = {
  START: 'Início da inspeção',
  COMPLETE: 'Conclusão da inspeção',
  REOPEN: 'Reabertura para correção',
  ANSWER: 'Resposta do checklist',
  NONCONFORMITY: 'Não conformidade',
};

const RESULT_LABELS: Record<string, string> = {
  OK: 'Concluída com sucesso',
  PARCIAL: 'Concluída com erros',
  FALHA: 'Falhou',
  SEM_CONEXAO: 'Sem conexão',
};

export function SyncPage({ colors, user }: { colors: Palette; user: AuthUser }) {
  const status = useSyncStatus();
  const [busy, setBusy] = useState(false);

  const { data } = useLocalQuery(
    async () => ({
      operations: await repo.listOperations(user.id),
      evidences: await repo.listProblemEvidences(user.id),
    }),
    { operations: [] as repo.OutboxEntry[], evidences: [] as repo.LocalEvidence[] },
    [user.id],
  );

  async function syncNow() {
    setBusy(true);
    await syncEngine.syncNow();
    setBusy(false);
  }

  async function retryAll() {
    await repo.retryErrors(user.id);
    await syncNow();
  }

  const errorOps = data.operations.filter((op) => op.state === 'ERROR');
  const pendingOps = data.operations.filter((op) => op.state !== 'ERROR');
  const errorEvidences = data.evidences.filter((evidence) => evidence.state === 'ERROR');
  const pendingEvidences = data.evidences.filter((evidence) => evidence.state !== 'ERROR');

  const card = {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  } as const;

  return (
    <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
      <Text style={{ fontSize: 9, fontWeight: '900', color: '#2563eb', letterSpacing: 1.2 }}>MODO OFFLINE</Text>
      <Text style={{ fontSize: 25, fontWeight: '900', color: colors.text, marginTop: 5 }}>Sincronização</Text>
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 5 }}>
        As informações ficam salvas no aparelho e são enviadas automaticamente quando há internet.
      </Text>

      <View style={card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <SyncBadge state={status.state} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {status.online ? <Wifi size={15} color="#16a34a" /> : <CloudOff size={15} color="#64748b" />}
            <Text style={{ color: colors.muted, fontSize: 12 }}>{status.online ? 'Online' : 'Sem internet'}</Text>
          </View>
        </View>

        <Text style={{ color: colors.text, fontSize: 13, marginTop: 12 }}>
          Última sincronização: <Text style={{ fontWeight: '800' }}>{status.lastSyncAt ? formatDateTimeBR(status.lastSyncAt) : 'nunca'}</Text>
        </Text>

        {status.lastResult && (
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
            Resultado: {RESULT_LABELS[status.lastResult] ?? status.lastResult}
          </Text>
        )}

        {status.lastMessage && (
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{status.lastMessage}</Text>
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>{status.pendingOperations}</Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>operações pendentes</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>{status.pendingEvidences}</Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>fotos pendentes</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: status.errors ? '#dc2626' : colors.text, fontSize: 22, fontWeight: '900' }}>{status.errors}</Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>com erro</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => void syncNow()}
          disabled={busy || status.syncing || !status.online}
          style={{
            marginTop: 14,
            backgroundColor: '#2563eb',
            borderRadius: 9,
            padding: 12,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            opacity: busy || status.syncing || !status.online ? 0.6 : 1,
          }}
        >
          {status.syncing ? <ActivityIndicator color="#ffffff" /> : <RefreshCw size={16} color="#ffffff" />}
          <Text style={{ color: '#ffffff', fontWeight: '800' }}>
            {status.online ? 'Sincronizar agora' : 'Aguardando conexão'}
          </Text>
        </TouchableOpacity>

        {(errorOps.length > 0 || errorEvidences.length > 0) && (
          <TouchableOpacity
            onPress={() => void retryAll()}
            style={{ marginTop: 10, borderWidth: 1, borderColor: '#dc2626', borderRadius: 9, padding: 10, alignItems: 'center' }}
          >
            <Text style={{ color: '#dc2626', fontWeight: '800' }}>Tentar reenviar itens com erro</Text>
          </TouchableOpacity>
        )}
      </View>

      {(errorOps.length > 0 || errorEvidences.length > 0) && (
        <View style={card}>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 14 }}>Erros de sincronização</Text>
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
            O servidor recusou estes itens. Corrija a causa e reenvie, ou descarte.
          </Text>

          {errorOps.map((op) => (
            <View key={op.seq} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10, flexDirection: 'row', gap: 8 }}>
              <AlertTriangle size={16} color="#dc2626" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
                  {TYPE_LABELS[op.type] ?? op.type} · {formatInspectionCode(op.inspectionId)}
                </Text>
                <Text style={{ color: '#dc2626', fontSize: 11, marginTop: 2 }}>{op.lastError}</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Descartar pendência"
                onPress={() =>
                  Alert.alert(
                    'Descartar pendência',
                    'Esta alteração não será enviada ao servidor. Deseja descartá-la?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Descartar', style: 'destructive', onPress: () => void repo.discardOperation(user.id, op.seq) },
                    ],
                  )
                }
              >
                <Trash2 size={16} color={colors.muted} />
              </TouchableOpacity>
            </View>
          ))}

          {errorEvidences.map((evidence) => (
            <View key={evidence.localId} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10, flexDirection: 'row', gap: 8 }}>
              <Camera size={16} color="#dc2626" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
                  Foto · {formatInspectionCode(evidence.inspectionId)}
                </Text>
                <Text style={{ color: '#dc2626', fontSize: 11, marginTop: 2 }}>{evidence.lastError}</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Descartar foto"
                onPress={() =>
                  Alert.alert('Descartar foto', 'A foto não será enviada. Deseja descartá-la?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Descartar', style: 'destructive', onPress: () => void repo.discardEvidence(evidence.localId) },
                  ])
                }
              >
                <Trash2 size={16} color={colors.muted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={card}>
        <Text style={{ color: colors.text, fontWeight: '900', fontSize: 14 }}>Aguardando envio</Text>

        {pendingOps.length === 0 && pendingEvidences.length === 0 && (
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
            Nada pendente. Todas as informações foram confirmadas pelo servidor.
          </Text>
        )}

        {pendingOps.map((op) => (
          <Text key={op.seq} style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
            • {TYPE_LABELS[op.type] ?? op.type} · {formatInspectionCode(op.inspectionId)}
            {op.attempts > 0 ? ` (tentativas: ${op.attempts})` : ''}
          </Text>
        ))}

        {pendingEvidences.map((evidence) => (
          <View key={evidence.localId} style={{ marginTop: 10 }}>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
              Foto · {formatInspectionCode(evidence.inspectionId)}
              {` (tentativas: ${evidence.attempts})`}
            </Text>

            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>
              Estado: {evidence.state}
            </Text>

            {evidence.lastError ? (
              <Text style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>
                Motivo da última tentativa: {evidence.lastError}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
