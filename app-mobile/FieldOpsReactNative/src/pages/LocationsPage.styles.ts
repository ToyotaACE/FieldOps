import { StyleSheet } from 'react-native';

export const locationsPageStyles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 80,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
    color: '#2563eb',
    marginBottom: 6,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
    marginBottom: 22,
    maxWidth: 700,
  },

  searchContainer: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 11,
  },

  summaryRow: {
    marginTop: 14,
    marginBottom: 14,
  },

  resultText: {
    fontSize: 13,
    fontWeight: '600',
  },

  locationList: {
    gap: 14,
  },

  locationCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  equipmentIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardHeaderText: {
    flex: 1,
    alignItems: 'flex-start',
  },

  equipmentName: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },

  tagBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },

  tagText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '800',
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
    marginVertical: 17,
  },

  informationSection: {
    gap: 15,
  },

  informationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },

  informationContent: {
    flex: 1,
  },

  informationLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },

  informationValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  sectorValue: {
    fontSize: 16,
    fontWeight: '800',
  },

  referenceBox: {
    borderTopWidth: 1,
    marginTop: 17,
    paddingTop: 15,
  },

  referenceLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },

  referenceText: {
    fontSize: 13,
    lineHeight: 20,
  },

  emptyState: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 45,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
  },

  emptyStateText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },
});