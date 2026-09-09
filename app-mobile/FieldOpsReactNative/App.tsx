import React, {
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
import { InspectionsPage } from './src/pages/InspectionsPage';
import { CalendarPage } from './src/pages/CalendarPage';
import { InspectionModelsPage } from './src/pages/InspectionModelsPage';
import { ClientsPage } from './src/pages/ClientsPage';
import { LocationsPage } from './src/pages/LocationsPage';
import { EquipmentPage } from './src/pages/EquipmentPage';
import { NonConformitiesPage } from './src/pages/NonConformitiesPage';
import { ReportsPage } from './src/pages/ReportsPage';
import { AuditPage } from './src/pages/AuditPage';
import { SettingsPage } from './src/pages/SettingsPage';

import {
  inspectionsSeed,
} from './src/data/mockData';

import {
  Inspection,
  NonConformity,
  Page,
  Status,
} from './src/types';

import {
  palettes,
} from './src/theme/colors';

import {
  appStyles as styles,
} from './src/styles/App.styles';

export default function App() {
  /*
  |--------------------------------------------------------------------------
  | NAVEGAÇÃO
  |--------------------------------------------------------------------------
  */

  const [
    page,
    setPage,
  ] = useState<Page>(
    'Dashboard',
  );

  const [
    drawerOpen,
    setDrawerOpen,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | TEMA
  |--------------------------------------------------------------------------
  */

  const [
    darkMode,
    setDarkMode,
  ] = useState(false);

  const colors =
    darkMode
      ? palettes.dark
      : palettes.light;

  /*
  |--------------------------------------------------------------------------
  | MODAL GENÉRICO
  |--------------------------------------------------------------------------
  |
  | Mantido apenas para páginas que ainda utilizam
  | o cadastro genérico.
  |
  */

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | BUSCA
  |--------------------------------------------------------------------------
  */

  const [
    query,
    setQuery,
  ] = useState('');

  /*
  |--------------------------------------------------------------------------
  | INSPEÇÕES
  |--------------------------------------------------------------------------
  */

  const [
    inspections,
    setInspections,
  ] = useState<Inspection[]>(
    inspectionsSeed,
  );

  const [
    selectedInspection,
    setSelectedInspection,
  ] =
    useState<Inspection | null>(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | NÃO CONFORMIDADES
  |--------------------------------------------------------------------------
  |
  | Este é o estado compartilhado entre:
  |
  | ReportsPage
  |      ↓
  | App.tsx
  |      ↓
  | NonConformitiesPage
  |
  */

  const [
    nonConformities,
    setNonConformities,
  ] = useState<
    NonConformity[]
  >([]);

  /*
  |--------------------------------------------------------------------------
  | FILTRO DE INSPEÇÕES
  |--------------------------------------------------------------------------
  */

  const filteredInspections =
    useMemo(() => {
      const normalizedQuery =
        query
          .trim()
          .toLowerCase();

      if (!normalizedQuery) {
        return inspections;
      }

      return inspections.filter(
        (inspection) =>
          Object.values(
            inspection,
          )
            .join(' ')
            .toLowerCase()
            .includes(
              normalizedQuery,
            ),
      );
    }, [
      inspections,
      query,
    ]);

  /*
  |--------------------------------------------------------------------------
  | NAVEGAÇÃO
  |--------------------------------------------------------------------------
  */

  function navigate(
    nextPage: Page,
  ) {
    setPage(nextPage);

    setSelectedInspection(
      null,
    );

    setDrawerOpen(false);
  }

  /*
  |--------------------------------------------------------------------------
  | ABRIR INSPEÇÃO
  |--------------------------------------------------------------------------
  */

  function openInspection(
    inspection: Inspection,
  ) {
    setSelectedInspection(
      inspection,
    );

    setPage('Inspeções');
  }

  /*
  |--------------------------------------------------------------------------
  | ALTERAR STATUS DA INSPEÇÃO
  |--------------------------------------------------------------------------
  */

  function updateInspectionStatus(
    status: Status,
  ) {
    if (
      !selectedInspection
    ) {
      return;
    }

    const updatedInspection: Inspection =
      {
        ...selectedInspection,
        status,
      };

    setInspections(
      (
        currentInspections,
      ) =>
        currentInspections.map(
          (inspection) =>
            inspection.id ===
            selectedInspection.id
              ? updatedInspection
              : inspection,
        ),
    );

    setSelectedInspection(
      updatedInspection,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NOVA NÃO CONFORMIDADE
  |--------------------------------------------------------------------------
  */

  function createNonConformity(
    nonConformity: NonConformity,
  ) {
    setNonConformities(
      (current) => [
        nonConformity,
        ...current,
      ],
    );
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
  | RENDERIZAÇÃO DAS PÁGINAS
  |--------------------------------------------------------------------------
  */

  function renderCurrentPage() {
    switch (page) {
      /*
      |--------------------------------------------------------------------------
      | DASHBOARD
      |--------------------------------------------------------------------------
      */

      case 'Dashboard':
        return (
          <DashboardPage
            colors={
              colors
            }
            inspections={
              filteredInspections
            }
            onOpenInspection={
              openInspection
            }
            onNewInspection={() =>
              Alert.alert(
                'Nova inspeção',
                'As inspeções deverão ser programadas pelo supervisor.',
              )
            }
          />
        );

      /*
      |--------------------------------------------------------------------------
      | INSPEÇÕES
      |--------------------------------------------------------------------------
      */

      case 'Inspeções':
        return (
          <InspectionsPage
            colors={
              colors
            }
            inspections={
              filteredInspections
            }
            selected={
              selectedInspection
            }
            onOpenInspection={
              openInspection
            }
            onBack={() =>
              setSelectedInspection(
                null,
              )
            }
            onApprove={() =>
              updateInspectionStatus(
                'Aprovada',
              )
            }
            onReject={() =>
              updateInspectionStatus(
                'Reprovada',
              )
            }
            onNewInspection={() =>
              Alert.alert(
                'Nova inspeção',
                'As inspeções deverão ser programadas pelo supervisor.',
              )
            }
          />
        );

      /*
      |--------------------------------------------------------------------------
      | CALENDÁRIO
      |--------------------------------------------------------------------------
      |
      | Somente visualização.
      |
      */

      case 'Calendário':
        return (
          <CalendarPage
            colors={
              colors
            }
          />
        );

      /*
      |--------------------------------------------------------------------------
      | MODELOS
      |--------------------------------------------------------------------------
      */

      case 'Modelos de inspeção':
        return (
          <InspectionModelsPage
            colors={
              colors
            }
            onNew={
              openNewRecordModal
            }
          />
        );

      /*
      |--------------------------------------------------------------------------
      | CLIENTES
      |--------------------------------------------------------------------------
      */

      case 'Clientes':
        return (
          <ClientsPage
            colors={
              colors
            }
            onNew={
              openNewRecordModal
            }
          />
        );

      /*
      |--------------------------------------------------------------------------
      | LOCAIS
      |--------------------------------------------------------------------------
      |
      | Inspetor apenas visualiza onde está o equipamento.
      |
      */

      case 'Locais':
        return (
          <LocationsPage
            colors={
              colors
            }
          />
        );

      /*
      |--------------------------------------------------------------------------
      | EQUIPAMENTOS
      |--------------------------------------------------------------------------
      */

      case 'Equipamentos':
        return (
          <EquipmentPage
            colors={
              colors
            }
            onNew={
              openNewRecordModal
            }
          />
        );

      /*
      |--------------------------------------------------------------------------
      | NÃO CONFORMIDADES
      |--------------------------------------------------------------------------
      |
      | Recebe exatamente os relatórios criados
      | na ReportsPage.
      |
      */

      case 'Não conformidades':
        return (
          <NonConformitiesPage
            colors={
              colors
            }
            nonConformities={
              nonConformities
            }
          />
        );

      /*
      |--------------------------------------------------------------------------
      | RELATÓRIOS
      |--------------------------------------------------------------------------
      |
      | Cria o relatório e envia para App.tsx.
      |
      */

      case 'Relatórios':
        return (
          <ReportsPage
            colors={
              colors
            }
            onCreateNonConformity={
              createNonConformity
            }
          />
        );

      /*
      |--------------------------------------------------------------------------
      | AUDITORIA
      |--------------------------------------------------------------------------
      */

      case 'Auditoria':
        return (
          <AuditPage
            colors={
              colors
            }
            onNew={
              openNewRecordModal
            }
          />
        );

      /*
      |--------------------------------------------------------------------------
      | CONFIGURAÇÕES
      |--------------------------------------------------------------------------
      */

      case 'Configurações':
        return (
          <SettingsPage
            colors={
              colors
            }
            onNew={
              openNewRecordModal
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
      page ===
        'Dashboard' ||
      page ===
        'Inspeções'
    ) &&
    !selectedInspection;

  /*
  |--------------------------------------------------------------------------
  | INTERFACE
  |--------------------------------------------------------------------------
  */

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor:
            colors.bg,
        },
      ]}
    >
      <StatusBar
        barStyle={
          darkMode
            ? 'light-content'
            : 'dark-content'
        }
        backgroundColor={
          colors.panel
        }
      />

      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              colors.panel,

            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() =>
            setDrawerOpen(
              true,
            )
          }
          style={
            styles.iconButton
          }
        >
          <Menu
            size={23}
            color={
              colors.text
            }
          />
        </TouchableOpacity>

        <View
          style={
            styles.headerTitleWrapper
          }
        >
          <Text
            style={[
              styles.headerKicker,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            OPERAÇÕES
          </Text>

          <Text
            style={[
              styles.headerTitle,
              {
                color:
                  colors.text,
              },
            ]}
            numberOfLines={
              1
            }
          >
            {page}
          </Text>
        </View>

        {/* TEMA */}

        <TouchableOpacity
          onPress={() =>
            setDarkMode(
              (currentValue) =>
                !currentValue,
            )
          }
          style={
            styles.iconButton
          }
        >
          {darkMode ? (
            <Sun
              size={20}
              color={
                colors.muted
              }
            />
          ) : (
            <Moon
              size={20}
              color={
                colors.muted
              }
            />
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
          style={
            styles.iconButton
          }
        >
          <Bell
            size={20}
            color={
              colors.muted
            }
          />

          <View
            style={
              styles.notificationDot
            }
          />
        </TouchableOpacity>
      </View>

      {/* BUSCA */}

      {showSearch && (
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor:
                colors.panel,

              borderColor:
                colors.border,
            },
          ]}
        >
          <Search
            size={18}
            color={
              colors.muted
            }
          />

          <TextInput
            value={
              query
            }
            onChangeText={
              setQuery
            }
            placeholder="Buscar no FieldOps..."
            placeholderTextColor={
              colors.muted
            }
            style={[
              styles.searchInput,
              {
                color:
                  colors.text,
              },
            ]}
          />
        </View>
      )}

      {/* PÁGINA */}

      <View
        style={
          styles.body
        }
      >
        {renderCurrentPage()}
      </View>

      {/* DRAWER */}

      <AppDrawer
        visible={
          drawerOpen
        }
        page={
          page
        }
        colors={
          colors
        }
        onClose={() =>
          setDrawerOpen(
            false,
          )
        }
        onNavigate={
          navigate
        }
      />

      {/* MODAL GENÉRICO */}

      <Modal
        visible={
          modalOpen
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalOpen(
            false,
          )
        }
      >
        <View
          style={
            styles.overlay
          }
        >
          <View
            style={[
              styles.modal,
              {
                backgroundColor:
                  colors.panel,
              },
            ]}
          >
            <TouchableOpacity
              style={
                styles.closeButton
              }
              onPress={() =>
                setModalOpen(
                  false,
                )
              }
            >
              <X
                color={
                  colors.muted
                }
              />
            </TouchableOpacity>

            <View
              style={
                styles.modalIcon
              }
            >
              <Plus
                color="#2563eb"
              />
            </View>

            <Text
              style={[
                styles.modalTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Novo registro
            </Text>

            <Text
              style={[
                styles.modalText,
                {
                  color:
                    colors.muted,
                },
              ]}
            >
              Formulário preparado
              para receber integração
              com Supabase.
            </Text>

            <TextInput
              placeholder="Nome / identificação"
              placeholderTextColor={
                colors.muted
              }
              style={[
                styles.input,
                {
                  color:
                    colors.text,

                  borderColor:
                    colors.border,

                  backgroundColor:
                    colors.bg,
                },
              ]}
            />

            <TextInput
              placeholder="Descrição"
              placeholderTextColor={
                colors.muted
              }
              multiline
              style={[
                styles.input,
                {
                  color:
                    colors.text,

                  borderColor:
                    colors.border,

                  backgroundColor:
                    colors.bg,
                },
              ]}
            />

            <TouchableOpacity
              style={
                styles.primaryButton
              }
              onPress={() =>
                setModalOpen(
                  false,
                )
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Salvar cadastro
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}