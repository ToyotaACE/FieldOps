import React, {
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardList,
  FileText,
  ImagePlus,
  MapPin,
  Play,
  ShieldAlert,
  Trash2,
  Video,
  Wrench,
} from 'lucide-react-native';

import {
  NonConformity,
  NonConformitySeverity,
  Palette,
} from '../types';

import {
  reportsPageStyles as styles,
} from './ReportsPage.styles';

type ReportsPageProps = {
  colors: Palette;

  onCreateNonConformity: (
    nonConformity: NonConformity,
  ) => void;
};

type Equipment = {
  id: string;
  name: string;
  tag: string;
  client: string;
  factory: string;
  sector: string;
};

const EQUIPMENTS: Equipment[] = [
  {
    id: 'equipment-1',
    name:
      'Painel Elétrico Principal',
    tag:
      'QGBT-001',
    client:
      'Indústria Alpha',
    factory:
      'Unidade Sorocaba',
    sector:
      'Produção - Linha 01',
  },

  {
    id: 'equipment-2',
    name:
      'Compressor de Ar',
    tag:
      'COMP-003',
    client:
      'Indústria Alpha',
    factory:
      'Unidade Sorocaba',
    sector:
      'Casa de Máquinas',
  },

  {
    id: 'equipment-3',
    name:
      'Centro de Usinagem CNC',
    tag:
      'CNC-012',
    client:
      'Metalúrgica Beta',
    factory:
      'Planta Jundiaí',
    sector:
      'Usinagem',
  },
];

const NON_CONFORMITY_TYPES = [
  'Elétrica',
  'Mecânica',
  'Estrutural',
  'Segurança',
  'Operacional',
  'Desgaste',
  'Vazamento',
  'Temperatura',
  'Ruído / Vibração',
  'Outro',
];

const SEVERITIES:
  NonConformitySeverity[] = [
    'Baixa',
    'Moderada',
    'Alta',
    'Crítica',
  ];

export function ReportsPage({
  colors,
  onCreateNonConformity,
}: ReportsPageProps) {
  const [
    selectedEquipmentId,
    setSelectedEquipmentId,
  ] = useState('');

  const [
    nonConformityType,
    setNonConformityType,
  ] = useState('');

  const [
    severity,
    setSeverity,
  ] =
    useState<NonConformitySeverity>(
      'Moderada',
    );

  const [
    problemDescription,
    setProblemDescription,
  ] = useState('');

  const [
    probableCause,
    setProbableCause,
  ] = useState('');

  const [
    recommendedAction,
    setRecommendedAction,
  ] = useState('');

  const [
    technicalNotes,
    setTechnicalNotes,
  ] = useState('');

  const [
    photos,
    setPhotos,
  ] =
    useState<string[]>([]);

  const [
    videos,
    setVideos,
  ] =
    useState<string[]>([]);

  const selectedEquipment =
    useMemo(() => {
      return EQUIPMENTS.find(
        (equipment) =>
          equipment.id ===
          selectedEquipmentId,
      );
    }, [
      selectedEquipmentId,
    ]);

  /*
  |--------------------------------------------------------------------------
  | FOTO PELA CÂMERA
  |--------------------------------------------------------------------------
  */

  async function takePhoto() {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (
        !permission.granted
      ) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à câmera para registrar fotos.',
        );

        return;
      }

      const result =
        await ImagePicker.launchCameraAsync(
          {
            mediaTypes: [
              'images',
            ],
            quality: 0.8,
          },
        );

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      setPhotos(
        (current) => [
          ...current,
          result.assets[0].uri,
        ],
      );
    } catch (error) {
      console.error(
        error,
      );

      Alert.alert(
        'Erro',
        'Não foi possível abrir a câmera.',
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FOTO DA GALERIA
  |--------------------------------------------------------------------------
  */

  async function addPhotoFromGallery() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (
        !permission.granted
      ) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à galeria.',
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes: [
              'images',
            ],

            allowsMultipleSelection:
              true,

            quality: 0.8,
          },
        );

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const newPhotos =
        result.assets.map(
          (asset) =>
            asset.uri,
        );

      setPhotos(
        (current) => [
          ...current,
          ...newPhotos,
        ],
      );
    } catch (error) {
      console.error(
        error,
      );

      Alert.alert(
        'Erro',
        'Não foi possível selecionar as fotos.',
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | GRAVAR VÍDEO
  |--------------------------------------------------------------------------
  */

  async function recordVideo() {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (
        !permission.granted
      ) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à câmera.',
        );

        return;
      }

      const result =
        await ImagePicker.launchCameraAsync(
          {
            mediaTypes: [
              'videos',
            ],

            videoMaxDuration:
              60,
          },
        );

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      setVideos(
        (current) => [
          ...current,
          result.assets[0].uri,
        ],
      );
    } catch (error) {
      console.error(
        error,
      );

      Alert.alert(
        'Erro',
        'Não foi possível gravar o vídeo.',
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | VÍDEO DA GALERIA
  |--------------------------------------------------------------------------
  */

  async function addVideoFromGallery() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (
        !permission.granted
      ) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à galeria.',
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes: [
              'videos',
            ],

            allowsMultipleSelection:
              true,
          },
        );

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const newVideos =
        result.assets.map(
          (asset) =>
            asset.uri,
        );

      setVideos(
        (current) => [
          ...current,
          ...newVideos,
        ],
      );
    } catch (error) {
      console.error(
        error,
      );

      Alert.alert(
        'Erro',
        'Não foi possível selecionar os vídeos.',
      );
    }
  }

  function removePhoto(
    indexToRemove: number,
  ) {
    setPhotos(
      (current) =>
        current.filter(
          (_, index) =>
            index !==
            indexToRemove,
        ),
    );
  }

  function removeVideo(
    indexToRemove: number,
  ) {
    setVideos(
      (current) =>
        current.filter(
          (_, index) =>
            index !==
            indexToRemove,
        ),
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LIMPAR
  |--------------------------------------------------------------------------
  */

  function clearForm() {
    setSelectedEquipmentId(
      '',
    );

    setNonConformityType(
      '',
    );

    setSeverity(
      'Moderada',
    );

    setProblemDescription(
      '',
    );

    setProbableCause(
      '',
    );

    setRecommendedAction(
      '',
    );

    setTechnicalNotes(
      '',
    );

    setPhotos([]);
    setVideos([]);
  }

  /*
  |--------------------------------------------------------------------------
  | SALVAR
  |--------------------------------------------------------------------------
  */

  function handleSaveNonConformity() {
    if (
      !selectedEquipment
    ) {
      Alert.alert(
        'Equipamento obrigatório',
        'Selecione o equipamento.',
      );

      return;
    }

    if (
      !nonConformityType
    ) {
      Alert.alert(
        'Tipo obrigatório',
        'Selecione o tipo de não conformidade.',
      );

      return;
    }

    if (
      !problemDescription.trim()
    ) {
      Alert.alert(
        'Descrição obrigatória',
        'Descreva o problema encontrado.',
      );

      return;
    }

    if (
      !recommendedAction.trim()
    ) {
      Alert.alert(
        'Ação recomendada',
        'Informe a ação recomendada.',
      );

      return;
    }

    const newNonConformity: NonConformity =
      {
        id:
          Date.now().toString(),

        equipmentId:
          selectedEquipment.id,

        equipmentName:
          selectedEquipment.name,

        tag:
          selectedEquipment.tag,

        client:
          selectedEquipment.client,

        factory:
          selectedEquipment.factory,

        sector:
          selectedEquipment.sector,

        type:
          nonConformityType,

        severity,

        problemDescription:
          problemDescription.trim(),

        probableCause:
          probableCause.trim(),

        recommendedAction:
          recommendedAction.trim(),

        technicalNotes:
          technicalNotes.trim(),

        photos: [
          ...photos,
        ],

        videos: [
          ...videos,
        ],

        status:
          'Aberta',

        createdAt:
          new Date().toLocaleString(
            'pt-BR',
          ),
      };

    /*
     * ENVIA PARA O APP.TSX
     */

    onCreateNonConformity(
      newNonConformity,
    );

    clearForm();

    Alert.alert(
      'Relatório registrado',
      'A não conformidade foi registrada e já está disponível na tela de Não conformidades.',
    );
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
        Relatório de não conformidade
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
        Registre detalhadamente
        problemas encontrados durante
        a inspeção.
      </Text>

      <View
        style={[
          styles.introCard,
          {
            backgroundColor:
              colors.panel,

            borderColor:
              colors.border,
          },
        ]}
      >
        <View
          style={
            styles.introIcon
          }
        >
          <ShieldAlert
            size={24}
            color="#dc2626"
          />
        </View>

        <View
          style={
            styles.introContent
          }
        >
          <Text
            style={[
              styles.introTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Novo relatório técnico
          </Text>

          <Text
            style={[
              styles.introDescription,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            Informe o equipamento,
            descreva o problema e
            adicione evidências.
          </Text>
        </View>
      </View>

      {/* EQUIPAMENTO */}

      <View
        style={[
          styles.formCard,
          {
            backgroundColor:
              colors.panel,

            borderColor:
              colors.border,
          },
        ]}
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <Wrench
            size={19}
            color="#2563eb"
          />

          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Equipamento
          </Text>
        </View>

        <Text
          style={[
            styles.fieldLabel,
            {
              color:
                colors.muted,
            },
          ]}
        >
          SELECIONE O EQUIPAMENTO
        </Text>

        <View
          style={
            styles.optionsContainer
          }
        >
          {EQUIPMENTS.map(
            (equipment) => {
              const selected =
                equipment.id ===
                selectedEquipmentId;

              return (
                <TouchableOpacity
                  key={
                    equipment.id
                  }
                  style={[
                    styles.equipmentOption,

                    {
                      borderColor:
                        selected
                          ? '#2563eb'
                          : colors.border,
                    },

                    selected &&
                      styles.selectedEquipmentOption,
                  ]}
                  onPress={() =>
                    setSelectedEquipmentId(
                      equipment.id,
                    )
                  }
                >
                  <View
                    style={
                      styles.equipmentOptionHeader
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
                        equipment.name
                      }
                    </Text>

                    <View
                      style={
                        styles.tagBadge
                      }
                    >
                      <Text
                        style={
                          styles.tagText
                        }
                      >
                        {
                          equipment.tag
                        }
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.equipmentClient,
                      {
                        color:
                          colors.muted,
                      },
                    ]}
                  >
                    {
                      equipment.client
                    }
                  </Text>

                  <View
                    style={
                      styles.locationRow
                    }
                  >
                    <MapPin
                      size={14}
                      color={
                        colors.muted
                      }
                    />

                    <Text
                      style={[
                        styles.locationText,
                        {
                          color:
                            colors.muted,
                        },
                      ]}
                    >
                      {
                        equipment.factory
                      }
                      {' • '}
                      {
                        equipment.sector
                      }
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            },
          )}
        </View>

        {selectedEquipment && (
          <View
            style={[
              styles.selectedEquipmentCard,
              {
                borderTopColor:
                  colors.border,
              },
            ]}
          >
            <CheckCircle2
              size={18}
              color="#16a34a"
            />

            <View
              style={
                styles.selectedEquipmentContent
              }
            >
              <Text
                style={[
                  styles.selectedEquipmentLabel,
                  {
                    color:
                      colors.muted,
                  },
                ]}
              >
                EQUIPAMENTO SELECIONADO
              </Text>

              <Text
                style={[
                  styles.selectedEquipmentText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {
                  selectedEquipment.name
                }
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* CLASSIFICAÇÃO */}

      <View
        style={[
          styles.formCard,
          {
            backgroundColor:
              colors.panel,

            borderColor:
              colors.border,
          },
        ]}
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <AlertTriangle
            size={19}
            color="#dc2626"
          />

          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Classificação
          </Text>
        </View>

        <Text
          style={[
            styles.fieldLabel,
            {
              color:
                colors.muted,
            },
          ]}
        >
          TIPO DE NÃO CONFORMIDADE
        </Text>

        <View
          style={
            styles.chipContainer
          }
        >
          {NON_CONFORMITY_TYPES.map(
            (type) => {
              const selected =
                type ===
                nonConformityType;

              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,

                    {
                      borderColor:
                        selected
                          ? '#2563eb'
                          : colors.border,
                    },

                    selected &&
                      styles.selectedTypeChip,
                  ]}
                  onPress={() =>
                    setNonConformityType(
                      type,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      {
                        color:
                          selected
                            ? '#2563eb'
                            : colors.text,
                      },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </View>

        <Text
          style={[
            styles.fieldLabel,
            styles.severityLabel,
            {
              color:
                colors.muted,
            },
          ]}
        >
          SEVERIDADE
        </Text>

        <View
          style={
            styles.severityContainer
          }
        >
          {SEVERITIES.map(
            (option) => {
              const selected =
                severity ===
                option;

              return (
                <TouchableOpacity
                  key={
                    option
                  }
                  style={[
                    styles.severityButton,

                    {
                      borderColor:
                        selected
                          ? '#2563eb'
                          : colors.border,
                    },

                    selected &&
                      styles.selectedSeverityButton,
                  ]}
                  onPress={() =>
                    setSeverity(
                      option,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.severityButtonText,
                      {
                        color:
                          selected
                            ? '#2563eb'
                            : colors.text,
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </View>
      </View>

      {/* DESCRIÇÃO */}

      <View
        style={[
          styles.formCard,
          {
            backgroundColor:
              colors.panel,

            borderColor:
              colors.border,
          },
        ]}
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <FileText
            size={19}
            color="#2563eb"
          />

          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Relatório detalhado
          </Text>
        </View>

        <Text
          style={[
            styles.fieldLabel,
            {
              color:
                colors.muted,
            },
          ]}
        >
          DESCRIÇÃO DO PROBLEMA *
        </Text>

        <TextInput
          value={
            problemDescription
          }
          onChangeText={
            setProblemDescription
          }
          multiline
          textAlignVertical="top"
          placeholder="Descreva detalhadamente o problema encontrado..."
          placeholderTextColor={
            colors.muted
          }
          style={[
            styles.textAreaLarge,
            {
              color:
                colors.text,

              borderColor:
                colors.border,
            },
          ]}
        />

        <Text
          style={[
            styles.fieldLabel,
            {
              color:
                colors.muted,
            },
          ]}
        >
          CAUSA PROVÁVEL
        </Text>

        <TextInput
          value={
            probableCause
          }
          onChangeText={
            setProbableCause
          }
          multiline
          textAlignVertical="top"
          placeholder="Informe a possível causa..."
          placeholderTextColor={
            colors.muted
          }
          style={[
            styles.textArea,
            {
              color:
                colors.text,

              borderColor:
                colors.border,
            },
          ]}
        />

        <Text
          style={[
            styles.fieldLabel,
            {
              color:
                colors.muted,
            },
          ]}
        >
          AÇÃO RECOMENDADA *
        </Text>

        <TextInput
          value={
            recommendedAction
          }
          onChangeText={
            setRecommendedAction
          }
          multiline
          textAlignVertical="top"
          placeholder="Informe a ação recomendada..."
          placeholderTextColor={
            colors.muted
          }
          style={[
            styles.textArea,
            {
              color:
                colors.text,

              borderColor:
                colors.border,
            },
          ]}
        />

        <Text
          style={[
            styles.fieldLabel,
            {
              color:
                colors.muted,
            },
          ]}
        >
          OBSERVAÇÕES TÉCNICAS
        </Text>

        <TextInput
          value={
            technicalNotes
          }
          onChangeText={
            setTechnicalNotes
          }
          multiline
          textAlignVertical="top"
          placeholder="Medições, testes realizados e outras observações..."
          placeholderTextColor={
            colors.muted
          }
          style={[
            styles.textArea,
            {
              color:
                colors.text,

              borderColor:
                colors.border,
            },
          ]}
        />

        {/* EVIDÊNCIAS */}

        <View
          style={[
            styles.evidenceSection,
            {
              borderTopColor:
                colors.border,
            },
          ]}
        >
          <View
            style={
              styles.evidenceHeader
            }
          >
            <View
              style={
                styles.evidenceIcon
              }
            >
              <Camera
                size={20}
                color="#2563eb"
              />
            </View>

            <View
              style={
                styles.evidenceHeaderContent
              }
            >
              <Text
                style={[
                  styles.evidenceTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Evidências
              </Text>

              <Text
                style={[
                  styles.evidenceDescription,
                  {
                    color:
                      colors.muted,
                  },
                ]}
              >
                Fotos e vídeos do
                problema encontrado.
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.fieldLabel,
              {
                color:
                  colors.muted,
              },
            ]}
          >
            FOTOS
          </Text>

          <View
            style={
              styles.mediaButtons
            }
          >
            <TouchableOpacity
              style={[
                styles.mediaButton,
                {
                  borderColor:
                    colors.border,
                },
              ]}
              onPress={
                takePhoto
              }
            >
              <Camera
                size={18}
                color="#2563eb"
              />

              <Text
                style={[
                  styles.mediaButtonText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Tirar foto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mediaButton,
                {
                  borderColor:
                    colors.border,
                },
              ]}
              onPress={
                addPhotoFromGallery
              }
            >
              <ImagePlus
                size={18}
                color="#2563eb"
              />

              <Text
                style={[
                  styles.mediaButtonText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Galeria
              </Text>
            </TouchableOpacity>
          </View>

          {photos.length >
            0 && (
            <View
              style={
                styles.photoGrid
              }
            >
              {photos.map(
                (
                  photo,
                  index,
                ) => (
                  <View
                    key={`${photo}-${index}`}
                    style={
                      styles.photoContainer
                    }
                  >
                    <Image
                      source={{
                        uri: photo,
                      }}
                      style={
                        styles.photoPreview
                      }
                    />

                    <TouchableOpacity
                      style={
                        styles.removeMediaButton
                      }
                      onPress={() =>
                        removePhoto(
                          index,
                        )
                      }
                    >
                      <Trash2
                        size={14}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                  </View>
                ),
              )}
            </View>
          )}

          <Text
            style={[
              styles.fieldLabel,
              {
                color:
                  colors.muted,

                marginTop:
                  20,
              },
            ]}
          >
            VÍDEOS
          </Text>

          <View
            style={
              styles.mediaButtons
            }
          >
            <TouchableOpacity
              style={[
                styles.mediaButton,
                {
                  borderColor:
                    colors.border,
                },
              ]}
              onPress={
                recordVideo
              }
            >
              <Video
                size={18}
                color="#2563eb"
              />

              <Text
                style={[
                  styles.mediaButtonText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Gravar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mediaButton,
                {
                  borderColor:
                    colors.border,
                },
              ]}
              onPress={
                addVideoFromGallery
              }
            >
              <Play
                size={18}
                color="#2563eb"
              />

              <Text
                style={[
                  styles.mediaButtonText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Galeria
              </Text>
            </TouchableOpacity>
          </View>

          {videos.length >
            0 && (
            <View
              style={
                styles.videoList
              }
            >
              {videos.map(
                (
                  video,
                  index,
                ) => (
                  <View
                    key={`${video}-${index}`}
                    style={[
                      styles.videoItem,
                      {
                        borderColor:
                          colors.border,
                      },
                    ]}
                  >
                    <View
                      style={
                        styles.videoIcon
                      }
                    >
                      <Video
                        size={20}
                        color="#2563eb"
                      />
                    </View>

                    <View
                      style={
                        styles.videoInformation
                      }
                    >
                      <Text
                        style={[
                          styles.videoName,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        Vídeo{' '}
                        {index +
                          1}
                      </Text>

                      <Text
                        style={[
                          styles.videoDescription,
                          {
                            color:
                              colors.muted,
                          },
                        ]}
                      >
                        Evidência da
                        não conformidade
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={
                        styles.videoDeleteButton
                      }
                      onPress={() =>
                        removeVideo(
                          index,
                        )
                      }
                    >
                      <Trash2
                        size={18}
                        color="#dc2626"
                      />
                    </TouchableOpacity>
                  </View>
                ),
              )}
            </View>
          )}

          <View
            style={[
              styles.mediaSummary,
              {
                borderColor:
                  colors.border,
              },
            ]}
          >
            <Camera
              size={15}
              color={
                colors.muted
              }
            />

            <Text
              style={[
                styles.mediaSummaryText,
                {
                  color:
                    colors.muted,
                },
              ]}
            >
              {photos.length}{' '}
              {photos.length ===
              1
                ? 'foto'
                : 'fotos'}
              {' • '}
              {videos.length}{' '}
              {videos.length ===
              1
                ? 'vídeo'
                : 'vídeos'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={
            styles.saveButton
          }
          onPress={
            handleSaveNonConformity
          }
        >
          <ClipboardList
            size={19}
            color="#ffffff"
          />

          <Text
            style={
              styles.saveButtonText
            }
          >
            Registrar não conformidade
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}