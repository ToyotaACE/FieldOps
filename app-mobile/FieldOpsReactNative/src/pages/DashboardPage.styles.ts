import { StyleSheet } from 'react-native';

export const dashboardPageStyles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 36 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 18 },
  headingText: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: '900', color: '#2563eb', letterSpacing: 1.2 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.6, marginTop: 5 },
  subtitle: { fontSize: 11, lineHeight: 17, marginTop: 5 },
  primaryButton: { backgroundColor: '#2563eb', height: 40, borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  primaryButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48.4%', borderWidth: 1, borderRadius: 12, padding: 13 },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statLabel: { fontSize: 10, flex: 1, paddingRight: 5 },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 25, fontWeight: '900', marginTop: 7 },
  delta: { color: '#16a34a', fontSize: 9, marginTop: 2 },
  panel: { borderWidth: 1, borderRadius: 12, padding: 15, marginTop: 12 },
  panelTitle: { fontSize: 14, fontWeight: '900' },
  panelSubtitle: { fontSize: 10, marginTop: 3, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '900', marginTop: 22, marginBottom: 10 },
});
