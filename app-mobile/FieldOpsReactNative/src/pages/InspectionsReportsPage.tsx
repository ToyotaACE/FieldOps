
import React from 'react';
import { View } from 'react-native';

import {
  NonConformity,
  Palette,
} from '../types';

import { InspectionsPage } from './InspectionsPage';
import { ReportsPage } from './ReportsPage';

type InspectionsReportsPageProps =
  React.ComponentProps<typeof InspectionsPage> & {
    showReports: boolean;
    onBackToInspections: () => void;
    onCreateNonConformity: (
      nonConformity: NonConformity
    ) => void;
  };

export function InspectionsReportsPage({
  colors,
  showReports,
  onBackToInspections,
  onCreateNonConformity,
  ...inspectionProps
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
          {...inspectionProps}
          colors={colors}
        />
      )}
    </View>
  );
}
