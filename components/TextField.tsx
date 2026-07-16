import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  toggleSecure?: boolean;
}

/** iOS-style rounded input — white fill, hairline border, optional secure toggle. */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, hint, error, icon, toggleSecure, style, secureTextEntry, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.field,
          focused && styles.focused,
          !!error && styles.errored,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? Colors.primary : Colors.textMuted}
            style={styles.icon}
          />
        )}
        <TextInput
          ref={ref}
          placeholderTextColor={Colors.textFaint}
          style={[styles.input, style]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={toggleSecure ? hidden : secureTextEntry}
          {...rest}
        />
        {toggleSecure && (
          <Pressable hitSlop={8} onPress={() => setHidden((h) => !h)}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={19}
              color={Colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Layout.spacing.md,
  },
  label: {
    fontSize: Layout.font.xs,
    fontWeight: '500',
    color: Colors.textMuted,
    marginBottom: 6,
    marginLeft: 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Layout.touchTarget,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    paddingHorizontal: Layout.spacing.md,
  },
  focused: {
    borderColor: Colors.primary,
  },
  errored: {
    borderColor: Colors.danger,
  },
  icon: {
    marginRight: Layout.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Layout.font.md,
    color: Colors.text,
    paddingVertical: Layout.spacing.sm,
  },
  hint: {
    fontSize: Layout.font.xs,
    color: Colors.textMuted,
    marginTop: 5,
    marginLeft: 2,
  },
  error: {
    fontSize: Layout.font.xs,
    color: Colors.danger,
    marginTop: 5,
    marginLeft: 2,
    fontWeight: '500',
  },
});
