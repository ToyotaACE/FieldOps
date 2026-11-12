
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  Bell,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  X,
} from 'lucide-react-native';

import { AppDrawer } from './src/components/AppDrawer';

import { DashboardPage } from './src/pages/DashboardPage';
import {
  InspectionsReportsPage,
} from './src/pages/InspectionsReportsPage';
import { CalendarPage } from './src/pages/CalendarPage';
import { InspectionModelsPage } from './src/pages/InspectionModelsPage';
import { ClientsPage } from './src/pages/ClientsPage';
import { LocationsPage } from './src/pages/LocationsPage';
import { EquipmentPage } from './src/pages/EquipmentPage';
import { NonConformitiesPage } from './src/pages/NonConformitiesPage';
import { AuditPage } from './src/pages/AuditPage';
import { SettingsPage } from './src/pages/SettingsPage';
import { LoginPage } from './src/pages/LoginPage';

import {
  Inspection,
  NonConformity,
  Page,
  Status,
} from './src/types';

import {
  getCurrentUser,
  getInspections,
  getInspectionChecklist,
  getInspectionAnswers,
  createInspectionAnswer,
  updateInspectionAnswer,
  type AuthUser,
  type BackendInspection,
  type TemplateSection,
  type TemplateItem,
  type InspectionAnswer,
} from './src/services/api';

import {
  palettes,
} from './src/theme/colors';

import {
  appStyles as styles,
} from './src/styles/App.styles';

/*
|--------------------------------------------------------------------------
| CONVERSÃO DOS DADOS DO BACKEND
|--------------------------------------------------------------------------
*/

function mapBackendStatus(
  status: BackendInspection['status'],
): Status {
  switch (status) {
    case 'SCHEDULED':
      return 'Agendada';

    case 'IN_PROGRESS':
      return 'Em andamento';

    case 'COMPLETED':
      return 'Concluída';

    case 'UNDER_REVIEW':
      return 'Aguardando revisão';

    case 'APPROVED':
      return 'Aprovada';

    case 'REJECTED':
      return 'Reprovada';

    case 'CANCELLED':
      return 'Cancelada';

    default:
      return 'Agendada';
  }
}

function mapBackendPriority(
  priority: BackendInspection['priority'],
): Inspection['priority'] {
  switch (priority) {
    case 'LOW':
      return 'Baixa';

    case 'NORMAL':
      return 'Normal';

    case 'HIGH':
      return 'Alta';

    case 'CRITICAL':
      return 'Crítica';

    default:
      return 'Normal';
  }
}

function mapBackendInspection(
  backendInspection: BackendInspection,
): Inspection {
  return {
    id: String(backendInspection.id),
    templateVersionId: backendInspection.templateVersionId,
    client: backendInspection.clientName,
    location: backendInspection.siteName,
    equipment: backendInspection.equipmentName,
    technician: backendInspection.technicianName,

    date: [
      backendInspection.scheduledDate,
      backendInspection.scheduledTime,
    ]
      .filter(Boolean)
      .join(' '),

    status: mapBackendStatus(
      backendInspection.status,
    ),

    priority: mapBackendPriority(
      backendInspection.priority,
    ),
  };
}

/*
|--------------------------------------------------------------------------
| APLICAÇÃO
|--------------------------------------------------------------------------
*/

export default function App() {
  /*
  |--------------------------------------------------------------------------
  | NAVEGAÇÃO
  |--------------------------------------------------------------------------
  */

  const [page, setPage] = useState<Page>('Dashboard');
  const [showReports, setShowReports] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | AUTENTICAÇÃO E SESSÃO
  |--------------------------------------------------------------------------
  */

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | CARREGAMENTO DAS INSPEÇÕES
  |--------------------------------------------------------------------------
  */

  const [loadingInspections, setLoadingInspections] = useState(false);
  const [inspectionsError, setInspectionsError] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | CHECKLIST E RESPOSTAS DA INSPEÇÃO
  |--------------------------------------------------------------------------
  */

  const [inspectionChecklist, setInspectionChecklist] = useState<
    { section: TemplateSection; items: TemplateItem[] }[]
  >([]);

  const [inspectionAnswers, setInspectionAnswers] = useState<
    InspectionAnswer[]
  >([]);

  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [checklistError, setChecklistError] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | TEMA
  |--------------------------------------------------------------------------
  */

  const [darkMode, setDarkMode] = useState(false);

  const colors = darkMode
    ? palettes.dark
    : palettes.light;

  /*
  |--------------------------------------------------------------------------
  | MODAL GENÉRICO
  |--------------------------------------------------------------------------
  */

  const [modalOpen, setModalOpen] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | BUSCA
  |--------------------------------------------------------------------------
  */

  const [query, setQuery] = useState('');

  /*
  |--------------------------------------------------------------------------
  | INSPEÇÕES
  |--------------------------------------------------------------------------
  */

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  /*
  |--------------------------------------------------------------------------
  | NÃO CONFORMIDADES
  |--------------------------------------------------------------------------
  */

  const [nonConformities, setNonConformities] = useState<NonConformity[]>([]);

  /*
  |--------------------------------------------------------------------------
  | RESTAURAÇÃO E VALIDAÇÃO DA SESSÃO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const token = await AsyncStorage.getItem('fieldops_token');
        const savedUser = await AsyncStorage.getItem('fieldops_user');

        if (!mounted) return;

        if (!token || !savedUser) {
          await AsyncStorage.multiRemove([
            'fieldops_token',
            'fieldops_user',
          ]);
          return;
        }

        const user = await getCurrentUser(token);

        if (!mounted) return;

        await AsyncStorage.setItem(
          'fieldops_user',
          JSON.stringify(user),
        );

        if (!mounted) return;

        setCurrentUser(user);
        setAuthToken(token);
        setIsAuthenticated(true);
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'Erro desconhecido ao validar a sessão.';

        console.error('Erro ao restaurar sessão:', message);

        if (!mounted) return;

        if (
          message === 'SESSION_INVALID' ||
          message === 'Este usuário está inativo.'
        ) {
          try {
            await AsyncStorage.multiRemove([
              'fieldops_token',
              'fieldops_user',
            ]);
          } catch (storageError) {
            console.error('Erro ao limpar sessão inválida:', storageError);
          }
        }

        setCurrentUser(null);
        setAuthToken(null);
        setIsAuthenticated(false);
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | REALIZAR LOGIN
  |--------------------------------------------------------------------------
  */

  async function handleLogin(
    token: string,
    user: AuthUser,
  ) {
    if (!user.active) {
      throw new Error('Este usuário está inativo.');
    }

    await AsyncStorage.multiSet([
      ['fieldops_token', token],
      ['fieldops_user', JSON.stringify(user)],
    ]);

    setCurrentUser(user);
    setAuthToken(token);
    setIsAuthenticated(true);

    setPage('Dashboard');
    setShowReports(false);
    setSelectedInspection(null);
    setQuery('');
  }

  /*
  |--------------------------------------------------------------------------
  | BUSCAR INSPEÇÕES DO BACKEND
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    async function loadInspections() {
      if (!isAuthenticated || !authToken) return;

      try {
        setLoadingInspections(true);
        setInspectionsError(null);

        const backendInspections = await getInspections(authToken);

        if (!mounted) return;

        const mappedInspections = backendInspections.map(
          mapBackendInspection,
        );

        setInspections(mappedInspections);

        setSelectedInspection((currentSelected) => {
          if (!currentSelected) return null;

          return (
            mappedInspections.find(
              (inspection) => inspection.id === currentSelected.id,
            ) ?? currentSelected
          );
        });
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'Não foi possível carregar as inspeções.';

        console.error('Erro ao carregar inspeções:', error);

        if (!mounted) return;

        setInspectionsError(message);

        Alert.alert('Erro ao carregar inspeções', message);
      } finally {
        if (mounted) {
          setLoadingInspections(false);
        }
      }
    }

    loadInspections();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, authToken]);

  /*
  |--------------------------------------------------------------------------
  | FILTRO DE INSPEÇÕES
  |--------------------------------------------------------------------------
  */

  const filteredInspections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return inspections;

    return inspections.filter(
      (inspection) =>
        Object.values(inspection)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
    );
  }, [inspections, query]);

  /*
  |--------------------------------------------------------------------------
  | NAVEGAÇÃO
  |--------------------------------------------------------------------------
  */

  function navigate(nextPage: Page) {
    setPage(nextPage);
    setShowReports(false);
    setSelectedInspection(null);
    setDrawerOpen(false);
  }

  /*
  |--------------------------------------------------------------------------
  | ABRIR INSPEÇÃO
  |--------------------------------------------------------------------------
  */

  function openInspection(inspection: Inspection) {
    setSelectedInspection(inspection);
    setPage('Inspeções e relatórios');
    setShowReports(false);
  }

  /*
  |--------------------------------------------------------------------------
  | CARREGAR CHECKLIST E RESPOSTAS DA INSPEÇÃO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    async function loadChecklist() {
      if (!selectedInspection || !authToken || !isAuthenticated) {
        setInspectionChecklist([]);
        setInspectionAnswers([]);
        return;
      }

      try {
        setLoadingChecklist(true);
        setChecklistError(null);

        const inspectionId = Number(selectedInspection.id);

        const [checklist, answers] = await Promise.all([
          getInspectionChecklist(
            authToken,
            selectedInspection.templateVersionId,
          ),
          getInspectionAnswers(
            authToken,
            inspectionId,
          ),
        ]);

        if (!mounted) return;

        setInspectionChecklist(checklist);
        setInspectionAnswers(answers);
      } catch (error) {
        if (!mounted) return;

        const message = error instanceof Error
          ? error.message
          : 'Não foi possível carregar o checklist.';

        setChecklistError(message);

        Alert.alert('Erro ao carregar inspeção', message);
      } finally {
        if (mounted) {
          setLoadingChecklist(false);
        }
      }
    }

    loadChecklist();

    return () => {
      mounted = false;
    };
  }, [
    selectedInspection?.id,
    selectedInspection?.templateVersionId,
    authToken,
    isAuthenticated,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SALVAR RESPOSTA DA INSPEÇÃO
  |--------------------------------------------------------------------------
  */

  async function saveInspectionAnswer(
    templateItemId: number,
    value: string,
    observation: string,
  ) {
    if (!selectedInspection || !authToken) {
      Alert.alert('Erro', 'Nenhuma inspeção selecionada.');
      return;
    }

    try {
      const inspectionId = Number(selectedInspection.id);

      const existingAnswer = inspectionAnswers.find(
        (answer) => answer.templateItemId === templateItemId,
      );

      const answerData = {
        templateItemId,
        value,
        observation,
      };

      let savedAnswer: InspectionAnswer;

      if (existingAnswer) {
        savedAnswer = await updateInspectionAnswer(
          authToken,
          inspectionId,
          existingAnswer.id,
          answerData,
        );

        setInspectionAnswers((current) =>
          current.map((answer) =>
            answer.id === existingAnswer.id
              ? savedAnswer
              : answer,
          ),
        );
      } else {
        savedAnswer = await createInspectionAnswer(
          authToken,
          inspectionId,
          answerData,
        );

        setInspectionAnswers((current) => [
          ...current,
          savedAnswer,
        ]);
      }

      Alert.alert('Sucesso', 'Resposta salva no FieldOps.');
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Não foi possível salvar a resposta.';

      Alert.alert('Erro ao salvar resposta', message);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ALTERAR STATUS DA INSPEÇÃO
  |--------------------------------------------------------------------------
  */

  function updateInspectionStatus(status: Status) {
    if (!selectedInspection) return;

    const updatedInspection: Inspection = {
      ...selectedInspection,
      status,
    };

    setInspections((currentInspections) =>
      currentInspections.map((inspection) =>
        inspection.id === selectedInspection.id
          ? updatedInspection
          : inspection,
      ),
    );

    setSelectedInspection(updatedInspection);
  }

  /*
  |--------------------------------------------------------------------------
  | NOVA NÃO CONFORMIDADE
  |--------------------------------------------------------------------------
  */

  function createNonConformity(nonConformity: NonConformity) {
    setNonConformities((current) => [
      nonConformity,
      ...current,
    ]);
  }

  /*
  |--------------------------------------------------------------------------
  | MODAL GENÉRICO
  |--------------------------------------------------------------------------
  */

  function openNewRecordModal() {
    setModalOpen(true);
  }

  /*
  |--------------------------------------------------------------------------
  | ENCERRAR SESSÃO
  |--------------------------------------------------------------------------
  */

  async function logout() {
    setDrawerOpen(false);
    setModalOpen(false);
    setSelectedInspection(null);
    setPage('Dashboard');
    setShowReports(false);
    setQuery('');

    try {
      await AsyncStorage.multiRemove([
        'fieldops_token',
        'fieldops_user',
      ]);
    } catch (error) {
      console.error('Erro ao limpar sessão:', error);
    } finally {
      setCurrentUser(null);
      setAuthToken(null);
      setIsAuthenticated(false);
      setInspections([]);
      setInspectionsError(null);
      setInspectionChecklist([]);
      setInspectionAnswers([]);
      setChecklistError(null);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | VERIFICAR SESSÃO
  |--------------------------------------------------------------------------
  */

  if (checkingSession) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <StatusBar
          barStyle={darkMode ? 'light-content' : 'dark-content'}
          backgroundColor={colors.panel}
        />

        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text
          style={{
            color: colors.text,
            marginTop: 12,
          }}
        >
          Verificando sessão...
        </Text>
      </SafeAreaView>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TELA DE LOGIN
  |--------------------------------------------------------------------------
  */

  if (!isAuthenticated || !currentUser) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.bg,
          },
        ]}
      >
        <StatusBar
          barStyle={darkMode ? 'light-content' : 'dark-content'}
          backgroundColor={colors.panel}
        />

        <LoginPage
          colors={colors}
          onLogin={handleLogin}
        />
      </SafeAreaView>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDERIZAÇÃO DAS PÁGINAS
  |--------------------------------------------------------------------------
  */

  function renderCurrentPage() {
    switch (page) {
      case 'Dashboard':
        if (loadingInspections) {
          return (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}
            >
              <ActivityIndicator
                size="large"
                color="#2563eb"
              />

              <Text
                style={{
                  color: colors.text,
                  marginTop: 12,
                }}
              >
                Carregando inspeções...
              </Text>
            </View>
          );
        }

        return (
          <DashboardPage
            colors={colors}
            inspections={filteredInspections}
            onOpenInspection={openInspection}
            onNewInspection={() =>
              Alert.alert(
                'Nova inspeção',
                'As inspeções deverão ser programadas pelo supervisor.',
              )
            }
          />
        );

      case 'Inspeções e relatórios':
        return (
          <InspectionsReportsPage
            colors={colors}
            showReports={showReports}
            onOpenReports={() => setShowReports(true)}
            onBackToInspections={() => setShowReports(false)}
            inspections={filteredInspections}
            selected={selectedInspection}
            onOpenInspection={openInspection}
            onBack={() => setSelectedInspection(null)}
            onApprove={() => updateInspectionStatus('Aprovada')}
            onReject={() => updateInspectionStatus('Reprovada')}
            onNewInspection={() =>
              Alert.alert(
                'Nova inspeção',
                'As inspeções deverão ser programadas pelo supervisor.',
              )
            }
            onCreateNonConformity={createNonConformity}
            checklist={inspectionChecklist}
            answers={inspectionAnswers}
            loadingChecklist={loadingChecklist}
            checklistError={checklistError}
            onSaveAnswer={saveInspectionAnswer}
          />
        );

      case 'Calendário':
        return <CalendarPage colors={colors} />;

      case 'Modelos de inspeção':
        return (
          <InspectionModelsPage
            colors={colors}
            onNew={openNewRecordModal}
          />
        );

      case 'Clientes':
        return (
          <ClientsPage
            colors={colors}
            onNew={openNewRecordModal}
          />
        );

      case 'Locais':
        return <LocationsPage colors={colors} />;

      case 'Equipamentos':
        return (
          <EquipmentPage
            colors={colors}
            onNew={openNewRecordModal}
          />
        );

      case 'Não conformidades':
        return (
          <NonConformitiesPage
            colors={colors}
            nonConformities={nonConformities}
          />
        );

      case 'Auditoria':
        return (
          <AuditPage
            colors={colors}
            onNew={openNewRecordModal}
          />
        );

      case 'Configurações':
        return (
          <SettingsPage
            colors={colors}
            darkMode={darkMode}
            onToggleDarkMode={() =>
              setDarkMode((currentValue) => !currentValue)
            }
          />
        );

      default:
        return null;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | BUSCA GLOBAL
  |--------------------------------------------------------------------------
  */

  const showSearch =
    (
      page === 'Dashboard' ||
      (
        page === 'Inspeções e relatórios' &&
        !showReports
      )
    ) &&
    !selectedInspection;

  /*
  |--------------------------------------------------------------------------
  | INTERFACE PRINCIPAL
  |--------------------------------------------------------------------------
  */

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.panel}
      />

      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.panel,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setDrawerOpen(true)}
          style={styles.iconButton}
        >
          <Menu size={23} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrapper}>
          <Text
            style={[
              styles.headerKicker,
              { color: colors.muted },
            ]}
          >
            OPERAÇÕES
          </Text>

          <Text
            style={[
              styles.headerTitle,
              { color: colors.text },
            ]}
            numberOfLines={1}
          >
            {page}
          </Text>
        </View>

        {/* TEMA */}

        <TouchableOpacity
          onPress={() =>
            setDarkMode((currentValue) => !currentValue)
          }
          style={styles.iconButton}
        >
          {darkMode ? (
            <Sun size={20} color={colors.muted} />
          ) : (
            <Moon size={20} color={colors.muted} />
          )}
        </TouchableOpacity>

        {/* NOTIFICAÇÕES */}

        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              'Notificações',
              'Nenhuma nova notificação.',
            )
          }
          style={styles.iconButton}
        >
          <Bell size={20} color={colors.muted} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* BUSCA */}

      {showSearch && (
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.panel,
              borderColor: colors.border,
            },
          ]}
        >
          <Search size={18} color={colors.muted} />

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar no FieldOps..."
            placeholderTextColor={colors.muted}
            style={[
              styles.searchInput,
              { color: colors.text },
            ]}
          />
        </View>
      )}

      {/* AVISO DE ERRO DE CARREGAMENTO */}

      {inspectionsError &&
        page === 'Dashboard' &&
        !loadingInspections && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: '#fee2e2',
            }}
          >
            <Text
              style={{
                color: '#991b1b',
                fontSize: 13,
              }}
            >
              Não foi possível atualizar as inspeções.
              Verifique a conexão com o backend.
            </Text>
          </View>
        )}

      {/* PÁGINA */}

      <View style={styles.body}>
        {renderCurrentPage()}
      </View>

      {/* MENU LATERAL */}

      <AppDrawer
        visible={drawerOpen}
        page={page}
        colors={colors}
        onClose={() => setDrawerOpen(false)}
        onNavigate={navigate}
        onLogout={logout}
      />

      {/* MODAL GENÉRICO */}

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.overlay}>
          <View
            style={[
              styles.modal,
              { backgroundColor: colors.panel },
            ]}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalOpen(false)}
            >
              <X color={colors.muted} />
            </TouchableOpacity>

            <View style={styles.modalIcon}>
              <Plus color="#2563eb" />
            </View>

            <Text
              style={[
                styles.modalTitle,
                { color: colors.text },
              ]}
            >
              Novo registro
            </Text>

            <Text
              style={[
                styles.modalText,
                { color: colors.muted },
              ]}
            >
              Formulário preparado
              para receber integração
              com o backend FieldOps.
            </Text>

            <TextInput
              placeholder="Nome / identificação"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.bg,
                },
              ]}
            />

            <TextInput
              placeholder="Descrição"
              placeholderTextColor={colors.muted}
              multiline
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.bg,
                },
              ]}
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setModalOpen(false)}
            >
              <Text style={styles.primaryButtonText}>
                Salvar cadastro
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
