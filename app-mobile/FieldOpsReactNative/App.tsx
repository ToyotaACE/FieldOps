
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Bell,
  CloudOff,
  Menu,
  Moon,
  RefreshCw,
  Search,
  Sun,
} from 'lucide-react-native';

import { AppDrawer } from './src/components/AppDrawer';
import { RecentActivitySection } from './src/components/RecentActivitySection';
import { SyncBadge } from './src/components/SyncBadge';

import { DashboardPage } from './src/pages/DashboardPage';
import { InspectionsReportsPage } from './src/pages/InspectionsReportsPage';
import { CalendarPage } from './src/pages/CalendarPage';
import { InspectionModelsPage } from './src/pages/InspectionModelsPage';
import { ClientsPage } from './src/pages/ClientsPage';
import { LocationsPage } from './src/pages/LocationsPage';
import { EquipmentPage } from './src/pages/EquipmentPage';
import { NonConformitiesPage } from './src/pages/NonConformitiesPage';
import { AuditPage } from './src/pages/AuditPage';
import { SettingsPage } from './src/pages/SettingsPage';
import { SyncPage } from './src/pages/SyncPage';
import { LoginPage } from './src/pages/LoginPage';

import { Inspection, NonConformity, Page } from './src/types';

import {
  SESSION_INVALID,
  getAuditLogs,
  getClients,
  getCurrentUser,
  getEquipments,
  getInspectionTemplates,
  getSites,
  getTemplateVersions,
  isNetworkError,
  type ApiAuditLog,
  type ApiClient,
  type ApiEquipment,
  type ApiSite,
  type ApiTemplate,
  type ApiTemplateVersion,
  type AuthUser,
} from './src/services/api';

import { mapLocalInspection } from './src/services/mappers';
import { canAccessPage } from './src/navigation';

import { getCached, setCached } from './src/offline/db';
import { useLocalQuery, useSyncStatus } from './src/offline/hooks';
import { loadNonConformities } from './src/offline/nonConformities';
import * as repo from './src/offline/repository';
import {
  clearSession,
  loadSession,
  saveSession,
  saveUser,
} from './src/offline/session';
import { syncEngine } from './src/offline/syncEngine';

import { palettes } from './src/theme/colors';
import { appStyles as styles } from './src/styles/App.styles';

type Session = {
  token: string;
  user: AuthUser;
  issuedAt: number;
};

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/*
|--------------------------------------------------------------------------
| APLICAÇÃO
|--------------------------------------------------------------------------
*/

export default function App() {
  /* ------------------------------ navegação ------------------------------ */

  const [page, setPage] = useState<Page>('Dashboard');
  const [showReports, setShowReports] = useState(false);
  const [reportInspectionId, setReportInspectionId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const colors = darkMode ? palettes.dark : palettes.light;

  /* ------------------------------- sessão ------------------------------- */

  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [offlineSession, setOfflineSession] = useState(false);

  const sync = useSyncStatus();

  /* -------------------------- dados de referência -------------------------- */

  const [clients, setClients] = useState<ApiClient[]>([]);
  const [sites, setSites] = useState<ApiSite[]>([]);
  const [equipments, setEquipments] = useState<ApiEquipment[]>([]);
  const [templates, setTemplates] = useState<ApiTemplate[]>([]);
  const [versionsByTemplate, setVersionsByTemplate] = useState<Record<number, ApiTemplateVersion[]>>({});
  const [auditLogs, setAuditLogs] = useState<ApiAuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const userId = session?.user.id ?? 0;
  const userRole = session?.user.role;

  /* ---------------------------- encerrar sessão ---------------------------- */

  const resetNavigation = useCallback(() => {
    setDrawerOpen(false);
    setSelectedInspectionId(null);
    setPage('Dashboard');
    setShowReports(false);
    setQuery('');
  }, []);

  const endSession = useCallback(async () => {
    syncEngine.stop();
    resetNavigation();

    try {
      await clearSession();
    } catch (error) {
      console.error('Erro ao limpar sessão:', error);
    }

    // Os dados locais (SQLite) NÃO são apagados: o que não foi sincronizado
    // continua no aparelho e é enviado no próximo login do mesmo usuário.
    setSession(null);
    setClients([]);
    setSites([]);
    setEquipments([]);
    setTemplates([]);
    setVersionsByTemplate({});
    setAuditLogs([]);
  }, [resetNavigation]);

  const expiredHandled = useRef(false);

  const handleSessionExpired = useCallback(() => {
    if (expiredHandled.current) return;
    expiredHandled.current = true;

    Alert.alert(
      'Sessão expirada',
      'Entre novamente para continuar. Suas respostas e fotos continuam salvas no aparelho.',
    );

    void endSession();
  }, [endSession]);

  async function logout() {
    const pending = await repo.getPendingSummary(userId);
    const total = pending.operations + pending.evidences + pending.errors;

    const doLogout = () => void endSession();

    if (total > 0) {
      Alert.alert(
        'Informações não sincronizadas',
        `Existem ${total} informação(ões) ainda não enviadas. Elas ficarão guardadas no aparelho e serão enviadas quando você entrar novamente.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sair mesmo assim', style: 'destructive', onPress: doLogout },
        ],
      );
      return;
    }

    doLogout();
  }

  /* ------------------------- restauração da sessão ------------------------- */

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const stored = await loadSession();

        if (!stored) return;

        try {
          const user = await getCurrentUser(stored.token);

          await saveUser(user);

          if (mounted) setSession({ ...stored, user });
        } catch (error) {
          const message = errorMessage(error, '');

          if (message === SESSION_INVALID || message === 'Este usuário está inativo.') {
            await clearSession();
            return;
          }

          // Sem internet: entra com o usuário salvo (modo offline, RN-065).
          if (isNetworkError(error) && mounted) {
            setOfflineSession(true);
            setSession(stored);
          }
        }
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    }

    void restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  /* ------------------------- motor de sincronização ------------------------- */

  useEffect(() => {
    if (!session) return;

    expiredHandled.current = false;

    void syncEngine.start(session, {
      onSessionExpired: handleSessionExpired,
      onTokenRefreshed: (token) => {
        void saveSession(token, session.user);
        setSession((current) => (current ? { ...current, token, issuedAt: Date.now() } : current));
      },
    });

    return () => syncEngine.stop();
    // Reinicia somente quando muda o usuário (o token renovado é repassado ao motor).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  useEffect(() => {
    if (session) syncEngine.updateToken(session.token);
  }, [session?.token]);

  async function handleLogin(token: string, user: AuthUser) {
    if (!user.active) {
      throw new Error('Este usuário está inativo.');
    }

    await saveSession(token, user);

    setOfflineSession(false);
    resetNavigation();
    setSession({ token, user, issuedAt: Date.now() });
  }

  async function handleProfileUpdated(user: AuthUser) {
    await saveUser(user);
    syncEngine.updateUser(user);
    setSession((current) => (current ? { ...current, user } : current));
  }

  /* --------------------------- dados de referência --------------------------- */

  const loadReference = useCallback(async () => {
    if (!session) return;

    // Primeiro o cache local (funciona offline)...
    setClients(await getCached<ApiClient[]>('clients', []));
    setSites(await getCached<ApiSite[]>('sites', []));
    setEquipments(await getCached<ApiEquipment[]>('equipments', []));
    setTemplates(await getCached<ApiTemplate[]>('templates', []));
    setVersionsByTemplate(await getCached<Record<number, ApiTemplateVersion[]>>('versions', {}));

    if (!sync.online) return;

    // ...depois os dados atuais do servidor.
    const token = session.token;
    const canSeeTemplates = canAccessPage(session.user.role, 'Modelos de inspeção');

    const [clientsResult, sitesResult, equipmentsResult, templatesResult] = await Promise.allSettled([
      getClients(token),
      getSites(token),
      getEquipments(token),
      canSeeTemplates ? getInspectionTemplates(token) : Promise.resolve([] as ApiTemplate[]),
    ]);

    const failed = [clientsResult, sitesResult, equipmentsResult, templatesResult].find(
      (result) => result.status === 'rejected' && errorMessage(result.reason, '') === SESSION_INVALID,
    );

    if (failed) {
      handleSessionExpired();
      return;
    }

    if (clientsResult.status === 'fulfilled') {
      setClients(clientsResult.value);
      await setCached('clients', clientsResult.value);
    }

    if (sitesResult.status === 'fulfilled') {
      setSites(sitesResult.value);
      await setCached('sites', sitesResult.value);
    }

    if (equipmentsResult.status === 'fulfilled') {
      setEquipments(equipmentsResult.value);
      await setCached('equipments', equipmentsResult.value);
    }

    if (templatesResult.status === 'fulfilled') {
      setTemplates(templatesResult.value);
      await setCached('templates', templatesResult.value);

      const versionResults = await Promise.allSettled(
        templatesResult.value.map((template) => getTemplateVersions(token, template.id)),
      );

      const versions: Record<number, ApiTemplateVersion[]> = {};

      templatesResult.value.forEach((template, index) => {
        const result = versionResults[index];

        if (result && result.status === 'fulfilled') versions[template.id] = result.value;
      });

      setVersionsByTemplate(versions);
      await setCached('versions', versions);
    }
  }, [session, sync.online, handleSessionExpired]);

  useEffect(() => {
    void loadReference();
  }, [loadReference]);

  const loadAudit = useCallback(async () => {
    if (!session || !canAccessPage(session.user.role, 'Auditoria')) return;

    if (!sync.online) {
      Alert.alert('Sem conexão', 'A auditoria é consultada diretamente no servidor.');
      return;
    }

    try {
      setLoadingAudit(true);

      const result = await getAuditLogs(session.token, 0, 100);

      setAuditLogs(result.content);
      setAuditTotal(result.totalElements);
    } catch (error) {
      const message = errorMessage(error, 'Não foi possível carregar a auditoria.');

      if (message === SESSION_INVALID) handleSessionExpired();
      else Alert.alert('Erro ao carregar auditoria', message);
    } finally {
      setLoadingAudit(false);
    }
  }, [session, sync.online, handleSessionExpired]);

  useEffect(() => {
    if (page === 'Auditoria') void loadAudit();
  }, [page, loadAudit]);

  /* ------------------------- inspeções (banco local) ------------------------- */

  const { data: localInspections, loading: loadingInspections } = useLocalQuery(
    () => (userId ? repo.listInspections(userId) : Promise.resolve([] as repo.LocalInspection[])),
    [] as repo.LocalInspection[],
    [userId],
  );

  const inspections = useMemo<Inspection[]>(
    () => localInspections.map((local) => mapLocalInspection(local, sync.online, sync.syncing)),
    [localInspections, sync.online, sync.syncing],
  );

  const { data: nonConformities } = useLocalQuery(
    () => (userId ? loadNonConformities(userId) : Promise.resolve([] as NonConformity[])),
    [] as NonConformity[],
    [userId],
  );

  const selectedInspection = useMemo(
    () =>
      selectedInspectionId
        ? inspections.find((inspection) => inspection.id === selectedInspectionId) ?? null
        : null,
    [inspections, selectedInspectionId],
  );

  const filteredInspections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return inspections;

    return inspections.filter((inspection) =>
      Object.values(inspection).join(' ').toLowerCase().includes(normalizedQuery),
    );
  }, [inspections, query]);

  /* ------------------------------ notificações ------------------------------ */

  const notificationLines = useMemo(() => {
    const today = new Date();
    const todayKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    const lines: string[] = [];

    const scheduledToday = inspections.filter(
      (inspection) => inspection.scheduledDate === todayKey && inspection.backendStatus === 'SCHEDULED',
    ).length;

    const inProgress = inspections.filter((inspection) => inspection.backendStatus === 'IN_PROGRESS').length;

    const rejected = inspections.filter((inspection) => inspection.backendStatus === 'REJECTED').length;

    const waitingReview = inspections.filter(
      (inspection) => inspection.backendStatus === 'COMPLETED' || inspection.backendStatus === 'UNDER_REVIEW',
    ).length;

    if (scheduledToday > 0) lines.push(`${scheduledToday} inspeção(ões) agendada(s) para hoje.`);
    if (inProgress > 0) lines.push(`${inProgress} inspeção(ões) em andamento.`);
    if (rejected > 0 && userRole === 'TECHNICIAN') lines.push(`${rejected} inspeção(ões) reprovada(s) para correção.`);
    if (waitingReview > 0 && userRole !== 'TECHNICIAN') lines.push(`${waitingReview} inspeção(ões) aguardando revisão.`);
    if (sync.errors > 0) lines.push(`${sync.errors} item(ns) com erro de sincronização.`);

    const pending = sync.pendingOperations + sync.pendingEvidences;

    if (pending > 0) lines.push(`${pending} informação(ões) aguardando envio.`);

    return lines;
  }, [inspections, userRole, sync.errors, sync.pendingOperations, sync.pendingEvidences]);

  /* ------------------------------- navegação ------------------------------- */

  function navigate(nextPage: Page) {
    const allowed = userRole && canAccessPage(userRole, nextPage);

    setPage(allowed ? nextPage : 'Dashboard');
    setShowReports(false);
    setSelectedInspectionId(null);
    setDrawerOpen(false);
  }

  function openInspection(inspection: { id: string }) {
    setSelectedInspectionId(inspection.id);
    setShowReports(false);
  }

  function openReports(inspectionId?: number) {
    setReportInspectionId(inspectionId ?? null);
    setSelectedInspectionId(null);
    setShowReports(true);
    setPage('Dashboard');
  }

  function refreshAll() {
    void syncEngine.syncNow();
    void loadReference();

    if (page === 'Auditoria') void loadAudit();
  }

  /* ------------------------------ verificação ------------------------------ */

  if (checkingSession) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.panel} />
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ color: colors.text, marginTop: 12 }}>Verificando sessão...</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.panel} />
        <LoginPage colors={colors} onLogin={handleLogin} />
      </SafeAreaView>
    );
  }

  const user = session.user;

  const inspectionPageProps = {
    colors,
    user,
    token: session.token,
    online: sync.online,
    inspections: filteredInspections,
    onOpenInspection: openInspection,
    onOpenReports: openReports,
    onSessionExpired: handleSessionExpired,
  };

  /* -------------------------------- páginas -------------------------------- */

  function renderCurrentPage() {
    switch (page) {
      case 'Dashboard':
        if (loadingInspections && inspections.length === 0) {
          return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={{ color: colors.text, marginTop: 12 }}>Carregando inspeções...</Text>
            </View>
          );
        }

        if (showReports) {
          return (
            <InspectionsReportsPage
              {...inspectionPageProps}
              inspections={inspections}
              showReports
              reportInspectionId={reportInspectionId}
              onBackToInspections={() => setShowReports(false)}
              selected={null}
              onBack={() => setShowReports(false)}
            />
          );
        }

        return (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 36 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <DashboardPage
              colors={colors}
              inspections={filteredInspections}
              nonConformityCount={nonConformities.length}
              embedded
            />

            <InspectionsReportsPage
              {...inspectionPageProps}
              showReports={false}
              onBackToInspections={() => setShowReports(false)}
              selected={null}
              onBack={() => setSelectedInspectionId(null)}
              embedded
            />

            <RecentActivitySection colors={colors} inspections={filteredInspections} />

            <CalendarPage colors={colors} inspections={filteredInspections} embedded />

            <LocationsPage colors={colors} equipments={equipments} sites={sites} embedded />

            <EquipmentPage colors={colors} equipments={equipments} inspections={inspections} embedded />
          </ScrollView>
        );

      case 'Inspeções e relatórios':
        return (
          <InspectionsReportsPage
            {...inspectionPageProps}
            showReports={showReports}
            reportInspectionId={reportInspectionId}
            onBackToInspections={() => setShowReports(false)}
            selected={selectedInspection}
            onBack={() => setSelectedInspectionId(null)}
          />
        );

      case 'Calendário':
        return <CalendarPage colors={colors} inspections={filteredInspections} />;

      case 'Modelos de inspeção':
        return <InspectionModelsPage colors={colors} templates={templates} versionsByTemplate={versionsByTemplate} />;

      case 'Clientes':
        return <ClientsPage colors={colors} clients={clients} sites={sites} equipments={equipments} />;

      case 'Locais':
        return <LocationsPage colors={colors} equipments={equipments} sites={sites} />;

      case 'Equipamentos':
        return <EquipmentPage colors={colors} equipments={equipments} inspections={inspections} />;

      case 'Não conformidades':
        return <NonConformitiesPage colors={colors} nonConformities={nonConformities} />;

      case 'Auditoria':
        if (loadingAudit && auditLogs.length === 0) {
          return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={{ color: colors.text, marginTop: 12 }}>Carregando auditoria...</Text>
            </View>
          );
        }

        return <AuditPage colors={colors} logs={auditLogs} totalElements={auditTotal} />;

      case 'Sincronização':
        return <SyncPage colors={colors} user={user} />;

      case 'Configurações':
        return (
          <SettingsPage
            colors={colors}
            user={user}
            token={session!.token}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((value) => !value)}
            onBack={() => setPage('Dashboard')}
            onProfileUpdated={handleProfileUpdated}
            onSessionExpired={handleSessionExpired}
          />
        );

      default:
        return null;
    }
  }

  const showSearch =
    (page === 'Dashboard' && !showReports) ||
    (page === 'Inspeções e relatórios' && !showReports && !selectedInspection);

  /* ------------------------------- interface ------------------------------- */

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.panel} />

      <View style={[styles.header, { backgroundColor: colors.panel, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setDrawerOpen((isOpen) => !isOpen)}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={drawerOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
        >
          <Menu size={23} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrapper}>
          <Text style={[styles.headerKicker, { color: colors.muted }]}>OPERAÇÕES</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {page}
          </Text>
        </View>

        <TouchableOpacity
          onPress={refreshAll}
          disabled={sync.syncing}
          style={[styles.iconButton, { opacity: sync.syncing ? 0.5 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Sincronizar e atualizar dados"
        >
          <RefreshCw size={20} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setDarkMode((value) => !value)} style={styles.iconButton}>
          {darkMode ? <Sun size={20} color={colors.muted} /> : <Moon size={20} color={colors.muted} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              'Notificações',
              notificationLines.length > 0 ? notificationLines.join('\n') : 'Nenhuma nova notificação.',
            )
          }
          style={styles.iconButton}
        >
          <Bell size={20} color={colors.muted} />
          {notificationLines.length > 0 && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      {/* ESTADO DA SINCRONIZAÇÃO (sempre visível) */}
      <TouchableOpacity
        onPress={() => navigate('Sincronização')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 6,
          backgroundColor: sync.online ? colors.panel : '#f1f5f9',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
        accessibilityLabel="Abrir tela de sincronização"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {!sync.online && <CloudOff size={14} color="#475569" />}
          <SyncBadge state={sync.state} count={sync.pendingOperations + sync.pendingEvidences + sync.errors} />
        </View>
        <Text style={{ color: colors.muted, fontSize: 10 }}>
          {sync.lastSyncAt
            ? `Última sincronização: ${new Date(sync.lastSyncAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
            : offlineSession
              ? 'Modo offline'
              : 'Ainda não sincronizado'}
        </Text>
      </TouchableOpacity>

      {showSearch && (
        <View style={[styles.searchBar, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <Search size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar no FieldOps..."
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      )}

      <View style={styles.body}>{renderCurrentPage()}</View>

      <AppDrawer
        visible={drawerOpen}
        page={page}
        user={user}
        onClose={() => setDrawerOpen(false)}
        onNavigate={navigate}
        onLogout={() => void logout()}
      />

      {/* DETALHE / EXECUÇÃO DA INSPEÇÃO */}
      <Modal
        visible={selectedInspection !== null}
        animationType="slide"
        onRequestClose={() => setSelectedInspectionId(null)}
      >
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
          {selectedInspection && (
            <InspectionsReportsPage
              {...inspectionPageProps}
              showReports={false}
              onBackToInspections={() => setSelectedInspectionId(null)}
              selected={selectedInspection}
              onBack={() => setSelectedInspectionId(null)}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
