import { StyleSheet } from 'react-native';

export const nonConformitiesPageStyles =
  StyleSheet.create({
    content: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 100,
    },

    /*
     * CABEÇALHO
     */

    header: {
      marginBottom: 18,
    },

    eyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.6,
      color: '#2563eb',
      marginBottom: 5,
    },

    title: {
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
    },

    subtitle: {
      fontSize: 13,
      lineHeight: 19,
      marginTop: 5,
    },

    /*
     * RESUMO
     */

    summaryGrid: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },

    summaryCard: {
      flex: 1,
      minHeight: 78,
      borderWidth: 1,
      borderRadius: 13,
      paddingHorizontal: 10,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },

    summaryOpenNumber: {
      fontSize: 22,
      fontWeight: '800',
      color: '#dc2626',
    },

    summaryAnalysisNumber: {
      fontSize: 22,
      fontWeight: '800',
      color: '#d97706',
    },

    summaryResolvedNumber: {
      fontSize: 22,
      fontWeight: '800',
      color: '#16a34a',
    },

    summaryLabel: {
      fontSize: 9,
      fontWeight: '700',
      marginTop: 3,
      textAlign: 'center',
    },

    /*
     * BUSCA
     */

    searchContainer: {
      minHeight: 48,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    searchInput: {
      flex: 1,
      fontSize: 12,
      paddingVertical: 10,
    },

    /*
     * FILTROS
     */

    filtersContainer: {
      gap: 7,
      paddingTop: 11,
      paddingBottom: 6,
    },

    filterButton: {
      minHeight: 36,
      borderWidth: 1,
      borderRadius: 18,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },

    filterButtonSelected: {
      backgroundColor:
        'rgba(37, 99, 235, 0.08)',
    },

    filterButtonText: {
      fontSize: 10,
      fontWeight: '800',
    },

    /*
     * CABEÇALHO LISTA
     */

    listHeader: {
      marginTop: 14,
      marginBottom: 11,
    },

    listTitle: {
      fontSize: 18,
      fontWeight: '800',
    },

    listSubtitle: {
      fontSize: 10,
      marginTop: 3,
    },

    /*
     * LISTA
     */

    reportList: {
      gap: 12,
    },

    reportCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 15,
    },

    reportHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    equipmentIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor:
        'rgba(37, 99, 235, 0.10)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 11,
    },

    reportHeaderContent: {
      flex: 1,
    },

    equipmentName: {
      fontSize: 15,
      fontWeight: '800',
    },

    tagText: {
      fontSize: 9,
      fontWeight: '700',
      marginTop: 3,
    },

    /*
     * BADGES
     */

    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 13,
      marginBottom: 13,
    },

    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 18,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    badgeText: {
      fontSize: 9,
      fontWeight: '800',
    },

    severityLow: {
      backgroundColor:
        'rgba(22, 163, 74, 0.10)',
    },

    severityLowText: {
      color: '#16a34a',
    },

    severityModerate: {
      backgroundColor:
        'rgba(245, 158, 11, 0.12)',
    },

    severityModerateText: {
      color: '#d97706',
    },

    severityHigh: {
      backgroundColor:
        'rgba(234, 88, 12, 0.12)',
    },

    severityHighText: {
      color: '#ea580c',
    },

    severityCritical: {
      backgroundColor:
        'rgba(220, 38, 38, 0.10)',
    },

    severityCriticalText: {
      color: '#dc2626',
    },

    statusOpen: {
      backgroundColor:
        'rgba(220, 38, 38, 0.10)',
    },

    statusOpenText: {
      color: '#dc2626',
    },

    statusAnalysis: {
      backgroundColor:
        'rgba(245, 158, 11, 0.12)',
    },

    statusAnalysisText: {
      color: '#d97706',
    },

    statusResolved: {
      backgroundColor:
        'rgba(22, 163, 74, 0.10)',
    },

    statusResolvedText: {
      color: '#16a34a',
    },

    /*
     * TIPO
     */

    typeBox: {
      borderWidth: 1,
      borderRadius: 11,
      padding: 11,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 13,
    },

    typeContent: {
      flex: 1,
      marginLeft: 9,
    },

    typeValue: {
      fontSize: 12,
      fontWeight: '700',
      marginTop: 2,
    },

    /*
     * INFORMAÇÕES
     */

    informationRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },

    informationContent: {
      flex: 1,
      marginLeft: 9,
    },

    informationLabel: {
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.5,
    },

    informationValue: {
      fontSize: 11,
      fontWeight: '700',
      lineHeight: 16,
      marginTop: 2,
    },

    secondaryInformation: {
      fontSize: 10,
      marginTop: 2,
    },

    /*
     * PROBLEMA
     */

    problemBox: {
      borderWidth: 1,
      borderRadius: 11,
      padding: 12,
      marginTop: 1,
    },

    problemText: {
      fontSize: 12,
      lineHeight: 18,
      marginTop: 5,
    },

    /*
     * EVIDÊNCIAS
     */

    evidenceRow: {
      flexDirection: 'row',
      gap: 7,
      marginTop: 11,
    },

    evidenceItem: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    evidenceText: {
      fontSize: 10,
      fontWeight: '700',
    },

    /*
     * RELATÓRIO EXPANDIDO
     */

    expandedContent: {
      borderTopWidth: 1,
      marginTop: 14,
      paddingTop: 14,
    },

    detailSection: {
      marginBottom: 15,
    },

    detailLabel: {
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.6,
      marginBottom: 5,
    },

    detailText: {
      fontSize: 12,
      lineHeight: 19,
    },

    /*
     * BOTÃO DETALHES
     */

    detailsButton: {
      borderTopWidth: 1,
      marginTop: 14,
      paddingTop: 13,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },

    detailsButtonText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#2563eb',
    },

    /*
     * VAZIO
     */

    emptyState: {
      borderWidth: 1,
      borderRadius: 16,
      paddingVertical: 36,
      paddingHorizontal: 20,
      alignItems: 'center',
    },

    emptyTitle: {
      fontSize: 15,
      fontWeight: '800',
      marginTop: 10,
      textAlign: 'center',
    },

    emptyDescription: {
      fontSize: 11,
      lineHeight: 17,
      marginTop: 5,
      textAlign: 'center',
    },
  });