import React from 'react';
import { View } from 'react-native';

import { Inspection, NonConformity, Palette } from '../types';
import { InspectionsPage } from './InspectionsPage';
import { ReportsPage } from './ReportsPage';

type InspectionsReportsPageProps = {
  colors: Palette;
  showReports: boolean;
  onOpenReports: () => void;
  onBackToInspections: () => void;
  inspections: Inspection[];
  selected: Inspection | null;
  onOpenInspection: (inspection: Inspection) => void;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
  onNewInspection: () => void;
  onCreateNonConformity: (nonConformity: NonConformity) => void;
};

export function InspectionsReportsPage({
  colors,
  showReports,
  onOpenReports,
  onBackToInspections,
  inspections,
  selected,
  onOpenInspection,
  onBack,
  onApprove,
  onReject,
  onNewInspection,
  onCreateNonConformity,
}: InspectionsReportsPageProps) {
  return (
    <View style={{ flex: 1 }}>
      {showReports ? (
        <ReportsPage
          colors={colors}
          onBack={onBackToInspections}
          onCreateNonConformity={onCreateNonConformity}
        />
      ) : (
        <InspectionsPage
          colors={colors}
          inspections={inspections}
          selected={selected}
          onOpenInspection={onOpenInspection}
          onBack={onBack}
          onApprove={onApprove}
          onReject={onReject}
          onNewInspection={onNewInspection}
          onOpenReports={onOpenReports}
        />
      )}
    </View>
  );
}
