import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gauge, HardHat, LogOut, Settings, X } from 'lucide-react-native';

import { AuthUser } from '../services/api';
import { Page } from '../types';

type AppDrawerProps = {
  visible: boolean;
  page: Page;
  user: AuthUser;
  onClose: () => void;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
};

function getRoleLabel(role: AuthUser['role']) {
  switch (role) {
    case 'ADMIN':
      return 'Administrador';
    case 'SUPERVISOR':
      return 'Supervisor';
    case 'TECHNICIAN':
      return 'Técnico';
  }
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase() || 'U';
}

export function AppDrawer({
  visible,
  page,
  user,
  onClose,
  onNavigate,
  onLogout,
}: AppDrawerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.drawer}>
          <View style={styles.brand}>
            <View style={styles.brandMark}><HardHat size={22} color="#ffffff" /></View>
            <View>
              <Text style={styles.brandTitle}>Field<Text style={styles.brandAccent}>Ops</Text></Text>
              <Text style={styles.brandSub}>Inspeção em campo</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel="Fechar menu">
              <X color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.nav}>
            <Text style={styles.sectionLabel}>NAVEGAÇÃO</Text>
            <TouchableOpacity
              onPress={() => onNavigate('Dashboard')}
              style={[styles.item, page === 'Dashboard' && styles.active]}
            >
              <Gauge size={19} color={page === 'Dashboard' ? '#ffffff' : '#9dadc4'} />
              <Text style={[styles.label, page === 'Dashboard' && styles.activeLabel]}>Dashboard</Text>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>PREFERÊNCIAS</Text>
            <TouchableOpacity
              onPress={() => onNavigate('Configurações')}
              style={[styles.item, page === 'Configurações' && styles.active]}
            >
              <Settings size={19} color={page === 'Configurações' ? '#ffffff' : '#9dadc4'} />
              <Text style={[styles.label, page === 'Configurações' && styles.activeLabel]}>Configurações</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.user}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(user.name)}</Text></View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userRole}>{getRoleLabel(user.role)}</Text>
                <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.logout}
              onPress={onLogout}
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
            >
              <LogOut size={18} color="#fca5a5" />
              <Text style={styles.logoutLabel}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.outside} onPress={onClose} accessibilityLabel="Fechar menu" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(2,6,23,.45)' },
  drawer: { width: '82%', maxWidth: 330, paddingTop: 16, backgroundColor: '#0f172a' },
  outside: { flex: 1 },
  brand: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  brandMark: { width: 40, height: 40, borderRadius: 11, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  brandTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  brandAccent: { color: '#60a5fa' },
  brandSub: { color: '#8090a8', fontSize: 11 },
  close: { marginLeft: 'auto', padding: 8 },
  nav: { padding: 12, gap: 4, flexGrow: 1 },
  sectionLabel: { color: '#64748b', fontSize: 9, fontWeight: '900', letterSpacing: 1.1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  item: { height: 45, borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  active: { backgroundColor: '#1d4ed8' },
  label: { color: '#9dadc4', fontSize: 13, fontWeight: '600' },
  activeLabel: { color: '#ffffff' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#253247', gap: 12 },
  user: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#1d4ed8', fontWeight: '900', fontSize: 11 },
  userDetails: { flex: 1 },
  userName: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  userRole: { color: '#8090a8', fontSize: 10, marginTop: 2 },
  userEmail: { color: '#8090a8', fontSize: 9, marginTop: 2 },
  logout: { height: 42, borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1e293b' },
  logoutLabel: { color: '#fecaca', fontSize: 12, fontWeight: '800' },
});
