import { StyleSheet } from 'react-native';

export const calendarPageStyles =
  StyleSheet.create({
    content: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 80,
    },

    /*
     * CABEÇALHO
     */

    header: {
      marginBottom: 16,
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
     * RESUMO DO MÊS
     */

    summaryCard: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },

    summaryIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor:
        'rgba(37, 99, 235, 0.10)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    summaryContent: {
      flex: 1,
    },

    summaryNumber: {
      fontSize: 21,
      fontWeight: '800',
      lineHeight: 23,
    },

    summaryLabel: {
      fontSize: 12,
      marginTop: 2,
    },

    /*
     * CARD DO CALENDÁRIO
     */

    calendarCard: {
      borderWidth: 1,
      borderRadius: 18,
      overflow: 'hidden',
    },

    calendarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      paddingHorizontal: 14,
      paddingTop: 16,
      paddingBottom: 14,
    },

    monthContainer: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 8,
    },

    monthTitle: {
      fontSize: 18,
      fontWeight: '800',
      textAlign: 'center',
    },

    todayText: {
      marginTop: 3,
      fontSize: 11,
      fontWeight: '700',
      color: '#2563eb',
    },

    navigationButton: {
      width: 38,
      height: 38,
      borderRadius: 11,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    /*
     * DIAS DA SEMANA
     */

    weekHeader: {
      flexDirection: 'row',
      paddingHorizontal: 5,
      paddingTop: 4,
      paddingBottom: 7,
    },

    weekDay: {
      width: '14.2857%',
      alignItems: 'center',
      justifyContent: 'center',
    },

    weekDayText: {
      fontSize: 10,
      fontWeight: '800',
    },

    /*
     * GRID
     */

    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 5,
      paddingBottom: 8,
    },

    dayCell: {
      width: '14.2857%',
      height: 62,
      alignItems: 'center',
      justifyContent:
        'flex-start',
      paddingTop: 3,
    },

    /*
     * NÚMERO DO DIA
     */

    dayCircle: {
      width: 35,
      height: 35,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },

    selectedDayCircle: {
      backgroundColor: '#2563eb',
    },

    todayDayCircle: {
      borderWidth: 1.5,
      borderColor: '#2563eb',
    },

    dayNumber: {
      fontSize: 13,
      fontWeight: '700',
    },

    outsideMonthDay: {
      opacity: 0.32,
    },

    selectedDayNumber: {
      color: '#ffffff',
      fontWeight: '800',
    },

    todayDayNumber: {
      color: '#2563eb',
      fontWeight: '800',
    },

    /*
     * QUANTIDADE DE INSPEÇÕES
     */

    inspectionCountContainer: {
      minWidth: 20,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 5,
      backgroundColor:
        'rgba(37, 99, 235, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 3,
    },

    selectedInspectionCountContainer: {
      backgroundColor: '#2563eb',
    },

    inspectionCountText: {
      fontSize: 9,
      lineHeight: 11,
      fontWeight: '800',
      color: '#2563eb',
    },

    selectedInspectionCountText: {
      color: '#ffffff',
    },

    inspectionCountPlaceholder: {
      height: 21,
    },

    /*
     * RODAPÉ DO CALENDÁRIO
     */

    calendarFooter: {
      borderTopWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },

    footerExample: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },

    exampleNumber: {
      minWidth: 20,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 5,
      backgroundColor:
        'rgba(37, 99, 235, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 7,
    },

    exampleNumberText: {
      color: '#2563eb',
      fontSize: 9,
      fontWeight: '800',
    },

    footerText: {
      fontSize: 10,
      fontWeight: '600',
    },

    /*
     * DATA SELECIONADA
     */

    selectedDateHeader: {
      marginTop: 22,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    selectedDateTextContainer: {
      flex: 1,
      paddingRight: 12,
    },

    scheduleTitle: {
      fontSize: 18,
      fontWeight: '800',
    },

    scheduleDate: {
      fontSize: 12,
      lineHeight: 17,
      marginTop: 3,
    },

    dayInspectionCount: {
      minWidth: 32,
      height: 32,
      borderRadius: 16,
      paddingHorizontal: 9,
      backgroundColor: '#2563eb',
      alignItems: 'center',
      justifyContent: 'center',
    },

    dayInspectionCountText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '800',
    },

    /*
     * DIA SEM INSPEÇÕES
     */

    emptyState: {
      borderWidth: 1,
      borderRadius: 16,
      paddingVertical: 28,
      paddingHorizontal: 20,
      alignItems: 'center',
    },

    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius: 15,
      backgroundColor:
        'rgba(37, 99, 235, 0.10)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },

    emptyStateTitle: {
      fontSize: 16,
      fontWeight: '800',
    },

    emptyStateDescription: {
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 5,
    },

    /*
     * LISTA DE INSPEÇÕES
     */

    inspectionList: {
      gap: 12,
    },

    inspectionCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
    },

    inspectionCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 10,
    },

    /*
     * HORÁRIO
     */

    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    timeIcon: {
      width: 40,
      height: 40,
      borderRadius: 11,
      backgroundColor:
        'rgba(37, 99, 235, 0.10)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },

    timeLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.7,
    },

    inspectionTime: {
      fontSize: 18,
      fontWeight: '800',
      marginTop: 1,
    },

    /*
     * STATUS
     */

    statusBadge: {
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    statusText: {
      fontSize: 10,
      fontWeight: '800',
    },

    statusScheduled: {
      backgroundColor:
        'rgba(37, 99, 235, 0.10)',
    },

    statusScheduledText: {
      color: '#2563eb',
    },

    statusInProgress: {
      backgroundColor:
        'rgba(245, 158, 11, 0.12)',
    },

    statusInProgressText: {
      color: '#d97706',
    },

    statusCompleted: {
      backgroundColor:
        'rgba(22, 163, 74, 0.12)',
    },

    statusCompletedText: {
      color: '#16a34a',
    },

    statusCancelled: {
      backgroundColor:
        'rgba(220, 38, 38, 0.10)',
    },

    statusCancelledText: {
      color: '#dc2626',
    },

    /*
     * CLIENTE
     */

    inspectionClient: {
      fontSize: 17,
      fontWeight: '800',
      marginTop: 15,
      marginBottom: 13,
    },

    /*
     * INFORMAÇÕES
     */

    detailBox: {
      borderWidth: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },

    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 13,
      paddingVertical: 11,
    },

    detailContent: {
      flex: 1,
      marginLeft: 10,
    },

    detailLabel: {
      fontSize: 9,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    detailValue: {
      fontSize: 13,
      fontWeight: '600',
      marginTop: 2,
    },

    detailDivider: {
      height: 1,
      marginLeft: 40,
    },

    /*
     * OBSERVAÇÕES
     */

    descriptionContainer: {
      marginTop: 14,
    },

    descriptionLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
      marginBottom: 5,
    },

    inspectionDescription: {
      fontSize: 12,
      lineHeight: 18,
    },
  });