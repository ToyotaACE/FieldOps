import React, { ReactNode } from 'react';
import {
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

type PageContentProps = {
  children: ReactNode;
  contentContainerStyle: StyleProp<ViewStyle>;
  embedded?: boolean;
};

export function PageContent({
  children,
  contentContainerStyle,
  embedded = false,
}: PageContentProps) {
  if (embedded) {
    return <View style={contentContainerStyle}>{children}</View>;
  }

  return (
    <ScrollView
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
