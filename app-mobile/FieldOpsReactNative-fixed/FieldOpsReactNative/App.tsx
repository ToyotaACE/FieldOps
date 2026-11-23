import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bell, Menu, Moon, Search, Sun } from 'lucide-react-native';
import { AppDrawer } from './src/components/AppDrawer';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { InspectionsScreen } from './src/screens/InspectionsScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { inspectionsSeed } from './src/data/mockData';
import { Inspection, Page, Status } from './src/types';
import { palettes } from './src/theme/colors';

export default function App() {
  const [showAuth, setShowAuth] = useState(true);
  const [page, setPage] = useState<Page>('Dashboard');
  const [dark, setDark] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [inspections, setInspections] = useState<Inspection[]>(inspectionsSeed);
  const [selected, setSelected] = useState<Inspection | null>(null);
  const colors = dark ? palettes.dark : palettes.light;
  const filtered = useMemo(() => inspections.filter((item) =>
    Object.values(item).join(' ').toLowerCase().includes(query.trim().toLowerCase())
  ), [inspections, query]);

  if (showAuth) {
    return <AuthScreen colors={colors} onContinue={() => setShowAuth(false)} />;
  }

  function navigate(next: Page) {
    setPage(next === 'Configurações' ? 'Configurações' : 'Dashboard');
    setDrawerOpen(false);
  }

  function openInspection(item: Inspection) {
    setSelected(item);
  }

  function setInspectionStatus(status: Status) {
    if (!selected) return;
    const next = { ...selected, status };
    setInspections((previous) => previous.map((item) => item.id === selected.id ? next : item));
    setSelected(next);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={colors.panel} />
      <View style={[styles.header, { backgroundColor: colors.panel, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setDrawerOpen((open) => !open)}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={drawerOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
        >
          <Menu size={23} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerKicker, { color: colors.muted }]}>OPERAÇÕES</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {page === 'Configurações' ? 'Configurações' : 'Dashboard'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setDark((value) => !value)}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={dark ? 'Usar tema claro' : 'Usar tema escuro'}
        >
          {dark ? <Sun size={20} color={colors.muted} /> : <Moon size={20} color={colors.muted} />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Alert.alert('Notificações', 'Nenhuma nova notificação.')}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Notificações"
        >
          <Bell size={20} color={colors.muted} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {page === 'Dashboard' && (
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

      <View style={styles.body}>
        {page === 'Dashboard' ? (
          <DashboardScreen
            colors={colors}
            inspections={filtered}
            onOpenInspection={openInspection}
          />
        ) : (
          <SettingsScreen
            colors={colors}
            dark={dark}
            onToggleTheme={() => setDark((value) => !value)}
            onBack={() => setPage('Dashboard')}
          />
        )}
      </View>

      <AppDrawer
        visible={drawerOpen}
        page={page}
        onClose={() => setDrawerOpen(false)}
        onNavigate={navigate}
        onLogout={() => {
          setPage('Dashboard');
          setSelected(null);
          setDrawerOpen(false);
          setShowAuth(true);
        }}
      />

      <Modal visible={selected !== null} animationType="slide" onRequestClose={() => setSelected(null)}>
        <SafeAreaView style={[styles.detailSafe, { backgroundColor: colors.bg }]}>
          {selected && (
            <InspectionsScreen
              colors={colors}
              inspections={filtered}
              selected={selected}
              onOpenInspection={openInspection}
              onBack={() => setSelected(null)}
              onApprove={() => setInspectionStatus('Aprovada')}
              onReject={() => setInspectionStatus('Reprovada')}
              onNewInspection={() => Alert.alert('Nova inspeção', 'Fluxo preparado para integração com seu backend.')}
              onOpenReports={() => setSelected(null)}
            />
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  detailSafe: { flex: 1 },
  body: { flex: 1 },
  header: { height: 64, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  headerTitleWrap: { flex: 1, marginLeft: 4 },
  headerKicker: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  notificationDot: { position: 'absolute', right: 9, top: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' },
  searchBar: { marginHorizontal: 14, marginTop: 12, borderWidth: 1, borderRadius: 10, height: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 13 },
});
