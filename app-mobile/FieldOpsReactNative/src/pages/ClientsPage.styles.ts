import { StyleSheet } from 'react-native';

export const clientsPageStyles = StyleSheet.create({
  content: {
    padding: 14,
    paddingBottom: 40,
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
  panel: {
    borderWidth: 1,
    borderRadius: 13,
    padding: 24,
    marginTop: 18,
    alignItems: 'center',
  },
  icon: {
    width: 62,
    height: 62,
    borderRadius: 15,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 15,
  },
  body: {
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 430,
  },
});
