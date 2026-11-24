
import React from 'react';
import { View } from 'react-native';

import { InspectionsPage } from './InspectionsPage';
import { ReportsPage } from './ReportsPage';

type InspectionsReportsPageProps =
  React.ComponentProps<typeof InspectionsPage> & {
    showReports: boolean;
    reportInspectionId?: number | null;
    onBackToInspections: () => void;
  };

/**
 * Lista/detalhe de inspeções ou o formulário de não conformidade.
 */
export function InspectionsReportsPage({
  showReports,
  reportInspectionId = null,
  onBackToInspections,
  embedded = false,
  ...inspectionProps
}: InspectionsReportsPageProps) {
  const content = showReports ? (
    <ReportsPage
      colors={inspectionProps.colors}
      user={inspectionProps.user}
      inspections={inspectionProps.inspections}
      initialInspectionId={reportInspectionId}
      embedded={embedded}
      onBack={onBackToInspections}
    />
  ) : (
    <InspectionsPage
      {...inspectionProps}
      embedded={embedded}
    />
  );

  return embedded ? content : <View style={{ flex: 1 }}>{content}</View>;
}
