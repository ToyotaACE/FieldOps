import { StyleSheet } from 'react-native';

export const reportsPageStyles =
  StyleSheet.create({
    content: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 100,
    },

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

    introCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },

    introIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor:
        'rgba(220, 38, 38, 0.10)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    introContent: {
      flex: 1,
    },

    introTitle: {
      fontSize: 15,
      fontWeight: '800',
    },

    introDescription: {
      fontSize: 12,
      lineHeight: 18,
      marginTop: 3,
    },

    formCard: {
      borderWidth: 1,
      borderRadius: 17,
      padding: 16,
      marginBottom: 14,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 17,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
    },

    fieldLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.7,
      marginBottom: 8,
    },

    optionsContainer: {
      gap: 9,
    },

    equipmentOption: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 13,
    },

    selectedEquipmentOption: {
      backgroundColor:
        'rgba(37, 99, 235, 0.06)',
    },

    equipmentOptionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },

    equipmentName: {
      flex: 1,
      fontSize: 14,
      fontWeight: '800',
    },

    equipmentClient: {
      fontSize: 11,
      marginTop: 4,
    },

    tagBadge: {
      backgroundColor:
        'rgba(37, 99, 235, 0.10)',
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    tagText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#2563eb',
    },

    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 7,
    },

    locationText: {
      flex: 1,
      fontSize: 11,
    },

    selectedEquipmentCard: {
      borderTopWidth: 1,
      marginTop: 15,
      paddingTop: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
    },

    selectedEquipmentContent: {
      flex: 1,
    },

    selectedEquipmentLabel: {
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.7,
    },

    selectedEquipmentText: {
      fontSize: 13,
      fontWeight: '700',
      marginTop: 2,
    },

    selectedEquipmentLocation: {
      fontSize: 11,
      lineHeight: 16,
      marginTop: 3,
    },

    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },

    typeChip: {
      borderWidth: 1,
      borderRadius: 18,
      paddingHorizontal: 11,
      paddingVertical: 8,
    },

    selectedTypeChip: {
      backgroundColor:
        'rgba(37, 99, 235, 0.08)',
    },

    typeChipText: {
      fontSize: 11,
      fontWeight: '700',
    },

    severityLabel: {
      marginTop: 19,
    },

    severityContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },

    severityButton: {
      flexGrow: 1,
      minWidth: '45%',
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 10,
      alignItems: 'center',
    },

    selectedSeverityButton: {
      backgroundColor:
        'rgba(37, 99, 235, 0.08)',
    },

    severityButtonText: {
      fontSize: 11,
      fontWeight: '800',
    },

    textAreaLarge: {
      minHeight: 145,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 12,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 17,
    },

    textArea: {
      minHeight: 105,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 12,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 17,
    },

    /*
     * EVIDÊNCIAS
     */

    evidenceSection: {
      borderTopWidth: 1,
      marginTop: 3,
      paddingTop: 18,
      marginBottom: 20,
    },

    evidenceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 19,
    },

    evidenceIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor:
        'rgba(37, 99, 235, 0.10)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },

    evidenceHeaderContent: {
      flex: 1,
    },

    evidenceTitle: {
      fontSize: 15,
      fontWeight: '800',
    },

    evidenceDescription: {
      fontSize: 11,
      lineHeight: 16,
      marginTop: 2,
    },

    mediaSection: {
      marginBottom: 20,
    },

    mediaButtons: {
      flexDirection: 'row',
      gap: 8,
    },

    mediaButton: {
      flex: 1,
      minHeight: 48,
      borderWidth: 1,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingHorizontal: 8,
    },

    mediaButtonText: {
      fontSize: 11,
      fontWeight: '800',
    },

    /*
     * FOTOS
     */

    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },

    photoContainer: {
      width: '31%',
      aspectRatio: 1,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor:
        'rgba(148, 163, 184, 0.12)',
    },

    photoPreview: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },

    removeMediaButton: {
      position: 'absolute',
      right: 5,
      top: 5,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor:
        'rgba(15, 23, 42, 0.80)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    photoNumberBadge: {
      position: 'absolute',
      bottom: 5,
      left: 5,
      minWidth: 21,
      height: 21,
      borderRadius: 11,
      paddingHorizontal: 5,
      backgroundColor:
        'rgba(15, 23, 42, 0.75)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    photoNumberText: {
      color: '#ffffff',
      fontSize: 9,
      fontWeight: '800',
    },

    /*
     * VÍDEOS
     */

    videoList: {
      gap: 8,
      marginTop: 12,
    },

    videoItem: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },

    videoIcon: {
      width: 42,
      height: 42,
      borderRadius: 11,
      backgroundColor:
        'rgba(37, 99, 235, 0.10)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },

    videoInformation: {
      flex: 1,
    },

    videoName: {
      fontSize: 12,
      fontWeight: '800',
    },

    videoDescription: {
      fontSize: 10,
      marginTop: 2,
    },

    videoDeleteButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
    },

    /*
     * CONTADOR DE ANEXOS
     */

    mediaSummary: {
      minHeight: 42,
      borderWidth: 1,
      borderRadius: 11,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
    },

    mediaSummaryText: {
      fontSize: 10,
      fontWeight: '700',
    },

    /*
     * SALVAR
     */

    saveButton: {
      minHeight: 50,
      borderRadius: 12,
      backgroundColor: '#2563eb',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 14,
    },

    saveButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
    },

    /*
     * REGISTROS
     */

    recordsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 9,
      marginBottom: 12,
    },

    recordsHeaderContent: {
      flex: 1,
      paddingRight: 12,
    },

    recordsTitle: {
      fontSize: 18,
      fontWeight: '800',
    },

    recordsSubtitle: {
      fontSize: 11,
      marginTop: 3,
    },

    recordsCount: {
      minWidth: 32,
      height: 32,
      borderRadius: 16,
      paddingHorizontal: 8,
      backgroundColor: '#2563eb',
      alignItems: 'center',
      justifyContent: 'center',
    },

    recordsCountText: {
      color: '#ffffff',
      fontWeight: '800',
      fontSize: 12,
    },

    emptyState: {
      borderWidth: 1,
      borderRadius: 16,
      paddingVertical: 30,
      paddingHorizontal: 20,
      alignItems: 'center',
    },

    emptyStateTitle: {
      fontSize: 15,
      fontWeight: '800',
      marginTop: 10,
    },

    emptyStateDescription: {
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
      marginTop: 4,
    },

    recordsList: {
      gap: 12,
    },

    recordCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 15,
    },

    recordHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
    },

    recordHeaderText: {
      flex: 1,
    },

    recordEquipment: {
      fontSize: 15,
      fontWeight: '800',
    },

    recordTag: {
      fontSize: 10,
      fontWeight: '700',
      marginTop: 3,
    },

    recordType: {
      fontSize: 13,
      fontWeight: '700',
      marginTop: 11,
    },

    recordLocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 6,
    },

    recordLocation: {
      flex: 1,
      fontSize: 11,
    },

    /*
     * SEVERIDADE
     */

    severityBadge: {
      borderRadius: 18,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    severityBadgeText: {
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

    /*
     * DETALHES DO REGISTRO
     */

    recordDetailBox: {
      borderWidth: 1,
      borderRadius: 11,
      padding: 12,
      marginTop: 13,
    },

    recordTextSection: {
      marginTop: 13,
    },

    recordDetailLabel: {
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.6,
      marginBottom: 5,
    },

    recordDetailText: {
      fontSize: 12,
      lineHeight: 18,
    },

    /*
     * EVIDÊNCIAS DO REGISTRO SALVO
     */

    recordEvidenceSection: {
      borderTopWidth: 1,
      marginTop: 15,
      paddingTop: 13,
    },

    recordPhotoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 5,
    },

    recordPhoto: {
      width: '31%',
      aspectRatio: 1,
      borderRadius: 9,
      resizeMode: 'cover',
    },

    recordVideoSummary: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    recordVideoSummaryText: {
      fontSize: 11,
      fontWeight: '700',
    },

    /*
     * RODAPÉ
     */

    recordFooter: {
      borderTopWidth: 1,
      marginTop: 15,
      paddingTop: 11,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },

    openStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    openStatusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#dc2626',
    },

    openStatusText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#dc2626',
    },

    createdAt: {
      fontSize: 9,
    },
  });