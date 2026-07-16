import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useApp } from '@/store/AppContext';

/** Subtle pill showing whether the app is cloud-synced or running offline. */
export function ConnectionPill() {
  const { isCloud } = useApp();
  return (
    <View style={styles.pill}>
      <Ionicons
        name={isCloud ? 'cloud-done' : 'cloud-offline-outline'}
        size={12}
        color={isCloud ? Colors.primary : Colors.textMuted}
      />
      <Text
        style={[
          styles.text,
          { color: isCloud ? Colors.primary : Colors.textMuted },
        ]}
      >
        {isCloud ? 'Synced' : 'Offline'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Layout.radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
