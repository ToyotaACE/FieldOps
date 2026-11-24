import React, { useMemo, useState } from 'react';

import {
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
import { ApiEquipment, ApiSite } from '../services/api';
import { PageContent } from '../components/PageContent';

import { locationsPageStyles as styles } from './LocationsPage.styles';

type LocationsPageProps = {
  colors: Palette;
  equipments: ApiEquipment[];
  sites: ApiSite[];
  embedded?: boolean;
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

function buildLocations(
  equipments: ApiEquipment[],
  sites: ApiSite[],
): EquipmentLocation[] {
  return equipments.map((equipment) => {
    const site = sites.find((candidate) => candidate.id === equipment.siteId);

    const cityState = [site?.city, site?.state]
      .filter(Boolean)
      .join(' - ');

    const reference = [site?.address, cityState]
      .filter(Boolean)
      .join(', ');

    return {
      id: String(equipment.id),
      client: equipment.clientName,
      factory: equipment.siteName,
      sector: equipment.category || 'Não informado',
      equipment: equipment.name,
      tag: equipment.qrCode,
      reference: reference || 'Endereço do local não informado.',
    };
  });
}

export function LocationsPage({
  colors,
  equipments,
  sites,
  embedded = false,
}: LocationsPageProps) {
  const [searchText, setSearchText] = useState('');

  const locations = useMemo(
    () => buildLocations(equipments, sites),
    [equipments, sites],
  );

  const filteredLocations = useMemo(() => {
    const normalizedSearch = searchText
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return locations;
    }

    return locations.filter((location) => {
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
  }, [searchText, locations]);

  return (
    <PageContent
      embedded={embedded}
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
    </PageContent>
  );
}