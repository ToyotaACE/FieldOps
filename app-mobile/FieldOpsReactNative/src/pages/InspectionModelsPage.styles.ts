import { StyleSheet } from 'react-native';

export const inspectionModelsPageStyles = StyleSheet.create({
  content: {
    padding: 14,
    paddingBottom: 40,
  },
  heading: {
    gap: 12,
  },
  headingText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2563eb',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 25,
    fontWeight: '900',
    marginTop: 5,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    height: 42,
    borderRadius: 9,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  summaryCard: {
    flex: 1,
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  summaryLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  searchBox: {
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  filterButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  filterText: {
    fontSize: 10,
    fontWeight: '800',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 9,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  resultCount: {
    fontSize: 10,
  },
  modelCard: {
    borderWidth: 1,
    borderRadius: 13,
    padding: 14,
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modelIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modelIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelTitleBlock: {
    flex: 1,
  },
  modelTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  modelId: {
    fontSize: 10,
    marginTop: 3,
  },
  moreButton: {
    padding: 3,
  },
  modelDescription: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  publishedBadge: {
    backgroundColor: '#dcfce7',
  },
  draftBadge: {
    backgroundColor: '#fef3c7',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
  },
  equipmentText: {
    fontSize: 10,
  },
  metadataRow: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 16,
    marginTop: 13,
    paddingTop: 11,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metadataText: {
    fontSize: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    color: '#2563eb',
    fontSize: 10,
    fontWeight: '900',
  },
  updatedBy: {
    flex: 1,
    fontSize: 9,
    textAlign: 'right',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 13,
    padding: 28,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 11,
    marginTop: 5,
  },
});
