import React, { useMemo, useState } from 'react';

import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Building2,
  Factory,
  MapPin,
  Search,
  Wrench,
} from 'lucide-react-native';

import { Palette } from '../types';

import { locationsPageStyles as styles } from './LocationsPage.styles';

type LocationsPageProps = {
  colors: Palette;
};

type EquipmentLocation = {
  id: string;
  client: string;
  factory: string;
  sector: string;
  equipment: string;
  tag: string;
  reference: string;
};

const EQUIPMENT_LOCATIONS: EquipmentLocation[] = [
  {
    id: 'location-1',
    client: 'Toyota do Brasil',
    factory: 'Unidade Sorocaba',
    sector: 'Produção - Linha 01',
    equipment: 'Painel Elétrico Principal',
    tag: 'QGBT-001',
    reference: 'Ao lado da entrada principal da Linha 01.',
  },
  {
    id: 'location-2',
    client: 'Toyota do Brasil',
    factory: 'Unidade Sorocaba',
    sector: 'Casa de Máquinas',
    equipment: 'Compressor de Ar',
    tag: 'COMP-003',
    reference: 'Próximo ao reservatório principal de ar comprimido.',
  },
  {
    id: 'location-3',
    client: 'Toyota do Brasil',
    factory: 'Planta Jundiaí',
    sector: 'Usinagem',
    equipment: 'Centro de Usinagem CNC',
    tag: 'CNC-012',
    reference: 'Corredor B, terceira máquina após a entrada do setor.',
  },
];

export function LocationsPage({
  colors,
}: LocationsPageProps) {
  const [searchText, setSearchText] = useState('');

  const filteredLocations = useMemo(() => {
    const normalizedSearch = searchText
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return EQUIPMENT_LOCATIONS;
    }

    return EQUIPMENT_LOCATIONS.filter((location) => {
      return (
        location.client
          .toLowerCase()
          .includes(normalizedSearch) ||
        location.factory
          .toLowerCase()
          .includes(normalizedSearch) ||
        location.sector
          .toLowerCase()
          .includes(normalizedSearch) ||
        location.equipment
          .toLowerCase()
          .includes(normalizedSearch) ||
        location.tag
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [searchText]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>
        FIELDOPS
      </Text>

      <Text
        style={[
          styles.title,
          {
            color: colors.text,
          },
        ]}
      >
        Locais dos equipamentos
      </Text>

      <Text
        style={[
          styles.subtitle,
          {
            color: colors.muted,
          },
        ]}
      >
        Consulte onde estão localizados os equipamentos
        vinculados às suas inspeções.
      </Text>

      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.panel,
            borderColor: colors.border,
          },
        ]}
      >
        <Search
          size={19}
          color={colors.muted}
        />

        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar equipamento, setor, fábrica ou TAG..."
          placeholderTextColor={colors.muted}
          style={[
            styles.searchInput,
            {
              color: colors.text,
            },
          ]}
        />
      </View>

      <View style={styles.summaryRow}>
        <Text
          style={[
            styles.resultText,
            {
              color: colors.muted,
            },
          ]}
        >
          {filteredLocations.length}
          {filteredLocations.length === 1
            ? ' equipamento localizado'
            : ' equipamentos localizados'}
        </Text>
      </View>

      <View style={styles.locationList}>
        {filteredLocations.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: colors.panel,
                borderColor: colors.border,
              },
            ]}
          >
            <MapPin
              size={36}
              color={colors.muted}
            />

            <Text
              style={[
                styles.emptyStateTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Nenhum local encontrado
            </Text>

            <Text
              style={[
                styles.emptyStateText,
                {
                  color: colors.muted,
                },
              ]}
            >
              Não encontramos equipamentos com os dados pesquisados.
            </Text>
          </View>
        ) : (
          filteredLocations.map((location) => (
            <View
              key={location.id}
              style={[
                styles.locationCard,
                {
                  backgroundColor: colors.panel,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.equipmentIcon}>
                  <Wrench
                    size={23}
                    color="#2563eb"
                  />
                </View>

                <View style={styles.cardHeaderText}>
                  <Text
                    style={[
                      styles.equipmentName,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    {location.equipment}
                  </Text>

                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>
                      {location.tag}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.informationSection}>
                <View style={styles.informationRow}>
                  <Building2
                    size={18}
                    color="#2563eb"
                  />

                  <View style={styles.informationContent}>
                    <Text
                      style={[
                        styles.informationLabel,
                        {
                          color: colors.muted,
                        },
                      ]}
                    >
                      Cliente
                    </Text>

                    <Text
                      style={[
                        styles.informationValue,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {location.client}
                    </Text>
                  </View>
                </View>

                <View style={styles.informationRow}>
                  <Factory
                    size={18}
                    color="#2563eb"
                  />

                  <View style={styles.informationContent}>
                    <Text
                      style={[
                        styles.informationLabel,
                        {
                          color: colors.muted,
                        },
                      ]}
                    >
                      Fábrica / unidade
                    </Text>

                    <Text
                      style={[
                        styles.informationValue,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {location.factory}
                    </Text>
                  </View>
                </View>

                <View style={styles.informationRow}>
                  <MapPin
                    size={18}
                    color="#2563eb"
                  />

                  <View style={styles.informationContent}>
                    <Text
                      style={[
                        styles.informationLabel,
                        {
                          color: colors.muted,
                        },
                      ]}
                    >
                      Setor
                    </Text>

                    <Text
                      style={[
                        styles.sectorValue,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {location.sector}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.referenceBox,
                  {
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.referenceLabel,
                    {
                      color: colors.muted,
                    },
                  ]}
                >
                  Referência para localização
                </Text>

                <Text
                  style={[
                    styles.referenceText,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {location.reference}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}