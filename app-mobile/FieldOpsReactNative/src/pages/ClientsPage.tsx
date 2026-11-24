import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Building2, Factory, Search, Wrench } from 'lucide-react-native';

import { Palette } from '../types';
import { ApiClient, ApiEquipment, ApiSite } from '../services/api';
import { clientsPageStyles as styles } from './ClientsPage.styles';

type ClientsPageProps = {
  colors: Palette;
  clients: ApiClient[];
  sites: ApiSite[];
  equipments: ApiEquipment[];
};

export function ClientsPage({ colors, clients, sites, equipments }: ClientsPageProps) {
  const [query, setQuery] = useState('');

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return clients.filter(
      (client) =>
        !normalizedQuery ||
        `${client.name} ${client.document ?? ''}`.toLowerCase().includes(normalizedQuery),
    );
  }, [clients, query]);

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>FIELDOPS</Text>
      <Text style={[styles.title, { color: colors.text }]}>Clientes</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Organizações atendidas pelo FieldOps, com seus locais e equipamentos.
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          marginTop: 14,
          backgroundColor: colors.panel,
          borderColor: colors.border,
        }}
      >
        <Search size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar cliente ou documento"
          placeholderTextColor={colors.muted}
          style={{ flex: 1, paddingVertical: 11, color: colors.text }}
        />
      </View>

      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 12, marginBottom: 4 }}>
        {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
      </Text>

      {filteredClients.map((client) => {
        const siteCount = sites.filter((site) => site.clientId === client.id).length;
        const equipmentCount = equipments.filter((equipment) => equipment.clientId === client.id).length;

        return (
          <View
            key={client.id}
            style={[
              styles.panel,
              { backgroundColor: colors.panel, borderColor: colors.border, alignItems: 'flex-start', marginTop: 10, padding: 14 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' }}>
              <View style={[styles.icon, { width: 44, height: 44 }]}>
                <Building2 size={24} color="#2563eb" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.panelTitle, { color: colors.text, marginTop: 0 }]}>{client.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                  {client.document || 'Documento não informado'}
                </Text>
              </View>

              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: client.active ? '#dcfce7' : '#fee2e2',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: client.active ? '#15803d' : '#b91c1c' }}>
                  {client.active ? 'Ativo' : 'Inativo'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 18, marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Factory size={14} color={colors.muted} />
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {siteCount} {siteCount === 1 ? 'local' : 'locais'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Wrench size={14} color={colors.muted} />
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {equipmentCount} {equipmentCount === 1 ? 'equipamento' : 'equipamentos'}
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      {filteredClients.length === 0 && (
        <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 24 }}>
          Nenhum cliente encontrado.
        </Text>
      )}
    </ScrollView>
  );
}
