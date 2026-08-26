import React, { useMemo, useState } from 'react';
import { Alert, Modal, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Bell, Menu, Moon, Plus, Search, Sun, X } from 'lucide-react-native';
import { AppDrawer } from './src/components/AppDrawer';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { InspectionsScreen } from './src/screens/InspectionsScreen';
import { GenericScreen } from './src/screens/GenericScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { inspectionsSeed } from './src/data/mockData';
import { Inspection, Page, Status } from './src/types';
import { palettes } from './src/theme/colors';

export default function App() {
  const [showAuth, setShowAuth] = useState(true);
  const [page, setPage] = useState<Page>('Dashboard');
  const [dark, setDark] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [inspections, setInspections] = useState<Inspection[]>(inspectionsSeed);
  const [selected, setSelected] = useState<Inspection | null>(null);
  const colors = dark ? palettes.dark : palettes.light;
  const filtered = useMemo(() => inspections.filter(item =>
    Object.values(item).join(' ').toLowerCase().includes(query.trim().toLowerCase())
  ), [inspections, query]);

  if (showAuth) {
    return <AuthScreen colors={colors} onContinue={() => setShowAuth(false)} />;
  }

  function navigate(next: Page) {
    setPage(next);
    setSelected(null);
    setDrawerOpen(false);
  }

  function openInspection(item: Inspection) {
    setSelected(item);
    setPage('Inspeções');
  }

  function setInspectionStatus(status: Status) {
    if (!selected) return;
    const next = { ...selected, status };
    setInspections(prev => prev.map(item => item.id === selected.id ? next : item));
    setSelected(next);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}> 
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={colors.panel} />
      <View style={[styles.header, { backgroundColor: colors.panel, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.iconButton}><Menu size={23} color={colors.text}/></TouchableOpacity>
        <View style={styles.headerTitleWrap}><Text style={[styles.headerKicker,{color:colors.muted}]}>OPERAÇÕES</Text><Text style={[styles.headerTitle,{color:colors.text}]} numberOfLines={1}>{page}</Text></View>
        <TouchableOpacity onPress={() => setDark(v => !v)} style={styles.iconButton}>{dark ? <Sun size={20} color={colors.muted}/> : <Moon size={20} color={colors.muted}/>}</TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('Notificações', 'Nenhuma nova notificação.')} style={styles.iconButton}><Bell size={20} color={colors.muted}/><View style={styles.notificationDot}/></TouchableOpacity>
      </View>

      {(page === 'Dashboard' || page === 'Inspeções') && !selected && (
        <View style={[styles.searchBar,{backgroundColor:colors.panel,borderColor:colors.border}]}>
          <Search size={18} color={colors.muted}/>
          <TextInput value={query} onChangeText={setQuery} placeholder="Buscar no FieldOps..." placeholderTextColor={colors.muted} style={[styles.searchInput,{color:colors.text}]}/>
        </View>
      )}

      <View style={styles.body}>
        {page === 'Dashboard' && <DashboardScreen colors={colors} inspections={filtered} onOpenInspection={openInspection} onNewInspection={() => Alert.alert('Nova inspeção', 'Fluxo preparado para integração com seu backend.')}/>} 
        {page === 'Inspeções' && <InspectionsScreen colors={colors} inspections={filtered} selected={selected} onOpenInspection={openInspection} onBack={() => setSelected(null)} onApprove={() => setInspectionStatus('Aprovada')} onReject={() => setInspectionStatus('Reprovada')} onNewInspection={() => Alert.alert('Nova inspeção', 'Fluxo preparado para integração com seu backend.')}/>} 
        {page !== 'Dashboard' && page !== 'Inspeções' && <GenericScreen page={page} colors={colors} onNew={() => setModalOpen(true)}/>} 
      </View>

      <AppDrawer visible={drawerOpen} page={page} colors={colors} onClose={() => setDrawerOpen(false)} onNavigate={navigate} onLogout={() => { setPage('Dashboard'); setSelected(null); setDrawerOpen(false); setShowAuth(true); }}/>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.overlay}><View style={[styles.modal,{backgroundColor:colors.panel}]}>
          <TouchableOpacity style={styles.close} onPress={() => setModalOpen(false)}><X color={colors.muted}/></TouchableOpacity>
          <View style={styles.modalIcon}><Plus color="#2563eb"/></View>
          <Text style={[styles.modalTitle,{color:colors.text}]}>Novo registro</Text>
          <Text style={[styles.modalText,{color:colors.muted}]}>Este protótipo usa dados locais e está disponível apenas para visualização.</Text>
          <TextInput placeholder="Nome / identificação" placeholderTextColor={colors.muted} style={[styles.input,{color:colors.text,borderColor:colors.border,backgroundColor:colors.bg}]}/>
          <TextInput placeholder="Descrição" placeholderTextColor={colors.muted} style={[styles.input,{color:colors.text,borderColor:colors.border,backgroundColor:colors.bg}]}/>
          <TouchableOpacity style={styles.primary} onPress={() => setModalOpen(false)}><Text style={styles.primaryText}>Salvar cadastro</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1}, body:{flex:1}, header:{height:64,borderBottomWidth:1,flexDirection:'row',alignItems:'center',paddingHorizontal:12},
  iconButton:{width:42,height:42,alignItems:'center',justifyContent:'center',position:'relative'}, headerTitleWrap:{flex:1,marginLeft:4}, headerKicker:{fontSize:9,fontWeight:'800',letterSpacing:1.2}, headerTitle:{fontSize:18,fontWeight:'800'},
  notificationDot:{position:'absolute',right:9,top:9,width:7,height:7,borderRadius:4,backgroundColor:'#ef4444'},
  searchBar:{marginHorizontal:14,marginTop:12,borderWidth:1,borderRadius:10,height:44,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:8}, searchInput:{flex:1,fontSize:13},
  overlay:{flex:1,backgroundColor:'rgba(2,6,23,.68)',alignItems:'center',justifyContent:'center',padding:20}, modal:{width:'100%',maxWidth:440,borderRadius:16,padding:24},close:{position:'absolute',right:12,top:12,padding:8},modalIcon:{width:44,height:44,borderRadius:11,backgroundColor:'#dbeafe',alignItems:'center',justifyContent:'center'},modalTitle:{fontSize:20,fontWeight:'800',marginTop:14},modalText:{fontSize:12,lineHeight:18,marginTop:6,marginBottom:10},input:{height:44,borderWidth:1,borderRadius:9,paddingHorizontal:12,marginTop:9},primary:{height:44,backgroundColor:'#2563eb',borderRadius:9,alignItems:'center',justifyContent:'center',marginTop:14},primaryText:{color:'#fff',fontSize:13,fontWeight:'800'}
});
