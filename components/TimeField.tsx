import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { formatTime12 } from '@/lib/time';

interface Props {
  /** "HH:MM" 24-hour, or empty string when unset. */
  value: string;
  onChange: (time: string) => void;
  label?: string;
  placeholder?: string;
}

/** Tap-to-open native time picker. Replaces error-prone free-text entry. */
export function TimeField({
  value,
  onChange,
  label,
  placeholder = 'Pick a time',
}: Props) {
  const [show, setShow] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Android shows a modal that dismisses itself; close on any result.
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'set' && selected) {
      const h = String(selected.getHours()).padStart(2, '0');
      const m = String(selected.getMinutes()).padStart(2, '0');
      onChange(`${h}:${m}`);
      if (Platform.OS === 'ios') setShow(false);
    } else if (event.type === 'dismissed') {
      setShow(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
        onPress={() => setShow(true)}
        accessibilityRole="button"
        accessibilityLabel={value ? `Time ${formatTime12(value)}` : placeholder}
      >
        <Ionicons
          name="time-outline"
          size={20}
          color={value ? Colors.primary : Colors.textFaint}
          style={styles.icon}
        />
        <Text style={[styles.text, !value && styles.placeholder]}>
          {value ? formatTime12(value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.textFaint} />
      </Pressable>

      {show && (
        <DateTimePicker
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
          value={toDate(value)}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

function toDate(time: string): Date {
  const d = new Date();
  if (time) {
    const [h, m] = time.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(8, 0, 0, 0);
  }
  return d;
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Layout.spacing.md,
  },
  label: {
    fontSize: Layout.font.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Layout.touchTarget,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Layout.spacing.md,
  },
  pressed: {
    borderColor: Colors.primary,
    opacity: 0.9,
  },
  icon: {
    marginRight: Layout.spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: Layout.font.md,
    color: Colors.text,
    fontWeight: '600',
  },
  placeholder: {
    color: Colors.textFaint,
    fontWeight: '400',
  },
});
