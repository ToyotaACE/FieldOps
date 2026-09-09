import React, {
  useMemo,
  useState,
} from 'react';

import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  AlertTriangle,
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  MapPin,
  Search,
  Video,
  Wrench,
} from 'lucide-react-native';

import {
  NonConformity,
  NonConformitySeverity,
  NonConformityStatus,
  Palette,
} from '../types';

import {
  nonConformitiesPageStyles as styles,
} from './NonConformitiesPage.styles';

type NonConformitiesPageProps = {
  colors: Palette;

  nonConformities:
    NonConformity[];
};

type StatusFilter =
  | 'Todas'
  | NonConformityStatus;

export function NonConformitiesPage({
  colors,
  nonConformities,
}: NonConformitiesPageProps) {
  const [
    searchText,
    setSearchText,
  ] = useState('');

  const [
    selectedStatus,
    setSelectedStatus,
  ] =
    useState<StatusFilter>(
      'Todas',
    );

  const [
    expandedId,
    setExpandedId,
  ] =
    useState<string | null>(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | FILTRO
  |--------------------------------------------------------------------------
  */

  const filteredNonConformities =
    useMemo(() => {
      const search =
        searchText
          .trim()
          .toLowerCase();

      return nonConformities.filter(
        (item) => {
          const statusMatches =
            selectedStatus ===
              'Todas' ||
            item.status ===
              selectedStatus;

          if (
            !statusMatches
          ) {
            return false;
          }

          if (!search) {
            return true;
          }

          const searchable =
            [
              item.equipmentName,
              item.tag,
              item.client,
              item.factory,
              item.sector,
              item.type,
              item.problemDescription,
            ]
              .join(' ')
              .toLowerCase();

          return searchable.includes(
            search,
          );
        },
      );
    }, [
      nonConformities,
      searchText,
      selectedStatus,
    ]);

  /*
  |--------------------------------------------------------------------------
  | CONTADORES
  |--------------------------------------------------------------------------
  */

  const openCount =
    nonConformities.filter(
      (item) =>
        item.status ===
        'Aberta',
    ).length;

  const analysisCount =
    nonConformities.filter(
      (item) =>
        item.status ===
        'Em análise',
    ).length;

  const resolvedCount =
    nonConformities.filter(
      (item) =>
        item.status ===
        'Resolvida',
    ).length;

  function toggleExpanded(
    id: string,
  ) {
    setExpandedId(
      (current) =>
        current === id
          ? null
          : id,
    );
  }

  function getSeverityStyle(
    severity:
      NonConformitySeverity,
  ) {
    switch (severity) {
      case 'Crítica':
        return styles.severityCritical;

      case 'Alta':
        return styles.severityHigh;

      case 'Moderada':
        return styles.severityModerate;

      default:
        return styles.severityLow;
    }
  }

  function getSeverityTextStyle(
    severity:
      NonConformitySeverity,
  ) {
    switch (severity) {
      case 'Crítica':
        return styles.severityCriticalText;

      case 'Alta':
        return styles.severityHighText;

      case 'Moderada':
        return styles.severityModerateText;

      default:
        return styles.severityLowText;
    }
  }

  function getStatusStyle(
    status:
      NonConformityStatus,
  ) {
    switch (status) {
      case 'Resolvida':
        return styles.statusResolved;

      case 'Em análise':
        return styles.statusAnalysis;

      default:
        return styles.statusOpen;
    }
  }

  function getStatusTextStyle(
    status:
      NonConformityStatus,
  ) {
    switch (status) {
      case 'Resolvida':
        return styles.statusResolvedText;

      case 'Em análise':
        return styles.statusAnalysisText;

      default:
        return styles.statusOpenText;
    }
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={
          styles.header
        }
      >
        <Text
          style={
            styles.eyebrow
          }
        >
          FIELDOPS
        </Text>

        <Text
          style={[
            styles.title,
            {
              color:
                colors.text,
            },
          ]}
        >
          Não conformidades
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color:
                colors.muted,
            },
          ]}
        >
          Consulte os relatórios de
          não conformidade registrados
          durante suas inspeções.
        </Text>
      </View>

      {/* RESUMO */}

      <View
        style={
          styles.summaryGrid
        }
      >
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor:
                colors.panel,

              borderColor:
                colors.border,
            },
          ]}
        >
          <Text
            style={
              styles.summaryOpenNumber
            }
          >
            {openCount}
          </Text>

          <Text
            style={[
              styles.summaryLabel,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            Abertas
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor:
                colors.panel,

              borderColor:
                colors.border,
            },
          ]}
        >
          <Text
            style={
              styles.summaryAnalysisNumber
            }
          >
            {analysisCount}
          </Text>

          <Text
            style={[
              styles.summaryLabel,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            Em análise
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor:
                colors.panel,

              borderColor:
                colors.border,
            },
          ]}
        >
          <Text
            style={
              styles.summaryResolvedNumber
            }
          >
            {resolvedCount}
          </Text>

          <Text
            style={[
              styles.summaryLabel,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            Resolvidas
          </Text>
        </View>
      </View>

      {/* BUSCA */}

      <View
        style={[
          styles.searchContainer,
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
            searchText
          }
          onChangeText={
            setSearchText
          }
          placeholder="Buscar equipamento, TAG, cliente ou setor..."
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

      {/* FILTROS */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.filtersContainer
        }
      >
        {(
          [
            'Todas',
            'Aberta',
            'Em análise',
            'Resolvida',
          ] as StatusFilter[]
        ).map(
          (status) => {
            const selected =
              selectedStatus ===
                status;

            return (
              <TouchableOpacity
                key={
                  status
                }
                style={[
                  styles.filterButton,

                  {
                    borderColor:
                      selected
                        ? '#2563eb'
                        : colors.border,
                  },

                  selected &&
                    styles.filterButtonSelected,
                ]}
                onPress={() =>
                  setSelectedStatus(
                    status,
                  )
                }
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    {
                      color:
                        selected
                          ? '#2563eb'
                          : colors.muted,
                    },
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            );
          },
        )}
      </ScrollView>

      <View
        style={
          styles.listHeader
        }
      >
        <View>
          <Text
            style={[
              styles.listTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Meus relatórios
          </Text>

          <Text
            style={[
              styles.listSubtitle,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            {
              filteredNonConformities.length
            }{' '}
            {filteredNonConformities.length ===
            1
              ? 'registro encontrado'
              : 'registros encontrados'}
          </Text>
        </View>
      </View>

      {/* SEM REGISTROS */}

      {filteredNonConformities.length ===
      0 ? (
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor:
                colors.panel,

              borderColor:
                colors.border,
            },
          ]}
        >
          <ClipboardList
            size={36}
            color={
              colors.muted
            }
          />

          <Text
            style={[
              styles.emptyTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Nenhum relatório encontrado
          </Text>

          <Text
            style={[
              styles.emptyDescription,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            Quando você registrar
            uma não conformidade na
            tela de Relatórios, ela
            aparecerá aqui.
          </Text>
        </View>
      ) : (
        <View
          style={
            styles.reportList
          }
        >
          {filteredNonConformities.map(
            (item) => {
              const expanded =
                expandedId ===
                item.id;

              return (
                <View
                  key={
                    item.id
                  }
                  style={[
                    styles.reportCard,
                    {
                      backgroundColor:
                        colors.panel,

                      borderColor:
                        colors.border,
                    },
                  ]}
                >
                  {/* EQUIPAMENTO */}

                  <View
                    style={
                      styles.reportHeader
                    }
                  >
                    <View
                      style={
                        styles.equipmentIcon
                      }
                    >
                      <Wrench
                        size={21}
                        color="#2563eb"
                      />
                    </View>

                    <View
                      style={
                        styles.reportHeaderContent
                      }
                    >
                      <Text
                        style={[
                          styles.equipmentName,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {
                          item.equipmentName
                        }
                      </Text>

                      <Text
                        style={[
                          styles.tagText,
                          {
                            color:
                              colors.muted,
                          },
                        ]}
                      >
                        TAG{' '}
                        {
                          item.tag
                        }
                      </Text>
                    </View>
                  </View>

                  {/* BADGES */}

                  <View
                    style={
                      styles.badgesRow
                    }
                  >
                    <View
                      style={[
                        styles.badge,
                        getSeverityStyle(
                          item.severity,
                        ),
                      ]}
                    >
                      <AlertTriangle
                        size={12}
                        color={
                          getSeverityTextStyle(
                            item.severity,
                          ).color
                        }
                      />

                      <Text
                        style={[
                          styles.badgeText,
                          getSeverityTextStyle(
                            item.severity,
                          ),
                        ]}
                      >
                        {
                          item.severity
                        }
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.badge,
                        getStatusStyle(
                          item.status,
                        ),
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          getStatusTextStyle(
                            item.status,
                          ),
                        ]}
                      >
                        {
                          item.status
                        }
                      </Text>
                    </View>
                  </View>

                  {/* TIPO */}

                  <View
                    style={[
                      styles.typeBox,
                      {
                        borderColor:
                          colors.border,
                      },
                    ]}
                  >
                    <FileText
                      size={16}
                      color="#2563eb"
                    />

                    <View
                      style={
                        styles.typeContent
                      }
                    >
                      <Text
                        style={[
                          styles.informationLabel,
                          {
                            color:
                              colors.muted,
                          },
                        ]}
                      >
                        TIPO DE NÃO CONFORMIDADE
                      </Text>

                      <Text
                        style={[
                          styles.typeValue,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {
                          item.type
                        }
                      </Text>
                    </View>
                  </View>

                  {/* LOCAL */}

                  <View
                    style={
                      styles.informationRow
                    }
                  >
                    <MapPin
                      size={16}
                      color={
                        colors.muted
                      }
                    />

                    <View
                      style={
                        styles.informationContent
                      }
                    >
                      <Text
                        style={[
                          styles.informationLabel,
                          {
                            color:
                              colors.muted,
                          },
                        ]}
                      >
                        LOCAL
                      </Text>

                      <Text
                        style={[
                          styles.informationValue,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {
                          item.client
                        }
                        {' • '}
                        {
                          item.factory
                        }
                      </Text>

                      <Text
                        style={[
                          styles.secondaryInformation,
                          {
                            color:
                              colors.muted,
                          },
                        ]}
                      >
                        Setor:{' '}
                        {
                          item.sector
                        }
                      </Text>
                    </View>
                  </View>

                  {/* DATA */}

                  <View
                    style={
                      styles.informationRow
                    }
                  >
                    <CalendarDays
                      size={16}
                      color={
                        colors.muted
                      }
                    />

                    <View
                      style={
                        styles.informationContent
                      }
                    >
                      <Text
                        style={[
                          styles.informationLabel,
                          {
                            color:
                              colors.muted,
                          },
                        ]}
                      >
                        REGISTRADO EM
                      </Text>

                      <Text
                        style={[
                          styles.informationValue,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {
                          item.createdAt
                        }
                      </Text>
                    </View>
                  </View>

                  {/* PROBLEMA */}

                  <View
                    style={[
                      styles.problemBox,
                      {
                        borderColor:
                          colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.informationLabel,
                        {
                          color:
                            colors.muted,
                        },
                      ]}
                    >
                      PROBLEMA IDENTIFICADO
                    </Text>

                    <Text
                      numberOfLines={
                        expanded
                          ? undefined
                          : 3
                      }
                      style={[
                        styles.problemText,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      {
                        item.problemDescription
                      }
                    </Text>
                  </View>

                  {/* EVIDÊNCIAS */}

                  <View
                    style={
                      styles.evidenceRow
                    }
                  >
                    <View
                      style={[
                        styles.evidenceItem,
                        {
                          borderColor:
                            colors.border,
                        },
                      ]}
                    >
                      <Camera
                        size={15}
                        color="#2563eb"
                      />

                      <Text
                        style={[
                          styles.evidenceText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {
                          item.photos.length
                        }{' '}
                        {item.photos.length ===
                        1
                          ? 'foto'
                          : 'fotos'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.evidenceItem,
                        {
                          borderColor:
                            colors.border,
                        },
                      ]}
                    >
                      <Video
                        size={15}
                        color="#2563eb"
                      />

                      <Text
                        style={[
                          styles.evidenceText,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {
                          item.videos.length
                        }{' '}
                        {item.videos.length ===
                        1
                          ? 'vídeo'
                          : 'vídeos'}
                      </Text>
                    </View>
                  </View>

                  {/* DETALHES */}

                  {expanded && (
                    <View
                      style={[
                        styles.expandedContent,
                        {
                          borderTopColor:
                            colors.border,
                        },
                      ]}
                    >
                      {item.photos.length >
                        0 && (
                        <View
                          style={
                            styles.detailSection
                          }
                        >
                          <Text
                            style={[
                              styles.detailLabel,
                              {
                                color:
                                  colors.muted,
                              },
                            ]}
                          >
                            FOTOS
                          </Text>

                          <View
                            style={{
                              flexDirection:
                                'row',

                              flexWrap:
                                'wrap',

                              gap: 7,

                              marginTop:
                                5,
                            }}
                          >
                            {item.photos.map(
                              (
                                photo,
                                index,
                              ) => (
                                <Image
                                  key={`${photo}-${index}`}
                                  source={{
                                    uri: photo,
                                  }}
                                  style={{
                                    width:
                                      '31%',

                                    aspectRatio:
                                      1,

                                    borderRadius:
                                      9,
                                  }}
                                />
                              ),
                            )}
                          </View>
                        </View>
                      )}

                      {item.probableCause ? (
                        <View
                          style={
                            styles.detailSection
                          }
                        >
                          <Text
                            style={[
                              styles.detailLabel,
                              {
                                color:
                                  colors.muted,
                              },
                            ]}
                          >
                            CAUSA PROVÁVEL
                          </Text>

                          <Text
                            style={[
                              styles.detailText,
                              {
                                color:
                                  colors.text,
                              },
                            ]}
                          >
                            {
                              item.probableCause
                            }
                          </Text>
                        </View>
                      ) : null}

                      <View
                        style={
                          styles.detailSection
                        }
                      >
                        <Text
                          style={[
                            styles.detailLabel,
                            {
                              color:
                                colors.muted,
                            },
                          ]}
                        >
                          AÇÃO RECOMENDADA
                        </Text>

                        <Text
                          style={[
                            styles.detailText,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                        >
                          {
                            item.recommendedAction
                          }
                        </Text>
                      </View>

                      {item.technicalNotes ? (
                        <View
                          style={
                            styles.detailSection
                          }
                        >
                          <Text
                            style={[
                              styles.detailLabel,
                              {
                                color:
                                  colors.muted,
                              },
                            ]}
                          >
                            OBSERVAÇÕES TÉCNICAS
                          </Text>

                          <Text
                            style={[
                              styles.detailText,
                              {
                                color:
                                  colors.text,
                              },
                            ]}
                          >
                            {
                              item.technicalNotes
                            }
                          </Text>
                        </View>
                      ) : null}

                      {item.videos.length >
                        0 && (
                        <View
                          style={
                            styles.detailSection
                          }
                        >
                          <Text
                            style={[
                              styles.detailLabel,
                              {
                                color:
                                  colors.muted,
                              },
                            ]}
                          >
                            VÍDEOS
                          </Text>

                          <Text
                            style={[
                              styles.detailText,
                              {
                                color:
                                  colors.text,
                              },
                            ]}
                          >
                            {
                              item.videos.length
                            }{' '}
                            {item.videos.length ===
                            1
                              ? 'vídeo anexado ao relatório.'
                              : 'vídeos anexados ao relatório.'}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.detailsButton,
                      {
                        borderTopColor:
                          colors.border,
                      },
                    ]}
                    onPress={() =>
                      toggleExpanded(
                        item.id,
                      )
                    }
                  >
                    <Text
                      style={
                        styles.detailsButtonText
                      }
                    >
                      {expanded
                        ? 'Ocultar detalhes'
                        : 'Ver relatório completo'}
                    </Text>

                    {expanded ? (
                      <ChevronUp
                        size={18}
                        color="#2563eb"
                      />
                    ) : (
                      <ChevronDown
                        size={18}
                        color="#2563eb"
                      />
                    )}
                  </TouchableOpacity>
                </View>
              );
            },
          )}
        </View>
      )}
    </ScrollView>
  );
}