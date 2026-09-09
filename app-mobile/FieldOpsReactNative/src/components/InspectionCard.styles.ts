import { StyleSheet } from 'react-native';

export const inspectionCardStyles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 15, marginBottom: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { color: '#2563eb', fontSize: 11, fontWeight: '900' },
  client: { fontSize: 14, fontWeight: '800', marginTop: 10 },
  equipment: { fontSize: 11, marginTop: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  meta: { fontSize: 10 },
  priority: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  progressLine: { height: 5, borderRadius: 4, backgroundColor: '#e5e7eb', overflow: 'hidden', marginTop: 12 },
  progress: { height: '100%', backgroundColor: '#2563eb' },
  progressText: { fontSize: 9, marginTop: 4, textAlign: 'right' },
});
