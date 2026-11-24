import React, { ReactNode } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

type PageContentProps = {
  children: ReactNode;
  contentContainerStyle: StyleProp<ViewStyle>;
  embedded?: boolean;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
};

export function PageContent({
  children,
  contentContainerStyle,
  embedded = false,
  showsVerticalScrollIndicator,
  keyboardShouldPersistTaps,
}: PageContentProps) {
  if (embedded) {
    return <View style={contentContainerStyle}>{children}</View>;
  }

  return (
    <ScrollView
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      {children}
    </ScrollView>
  );
}
