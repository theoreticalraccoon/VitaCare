import { Children, Fragment, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

/**
 * iOS inset-grouped list. `ListSection` renders an optional uppercase header
 * and footer around a white rounded card; children (`ListRow`) are separated by
 * inset hairlines, exactly like a UITableView (insetGrouped).
 */
export function ListSection({
  header,
  footer,
  children,
  style,
}: {
  header?: string;
  footer?: string;
  children: ReactNode;
  style?: ViewStyle;
}) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.section, style]}>
      {header && <Text style={styles.header}>{header.toUpperCase()}</Text>}
      <View style={styles.card}>
        {items.map((child, i) => (
          <Fragment key={i}>
            {child}
            {i < items.length - 1 && <View style={styles.separator} />}
          </Fragment>
        ))}
      </View>
      {footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  );
}

interface RowProps {
  /** Leading SF-style icon in a rounded tile. */
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  /** Trailing detail text (greyed). */
  detail?: string;
  /** Custom trailing element (switch, etc.) — overrides chevron/detail. */
  trailing?: ReactNode;
  /** Show a disclosure chevron. */
  chevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  /** Center the title (used for plain action rows). */
  center?: boolean;
}

export function ListRow({
  icon,
  iconColor = Colors.white,
  iconBg = Colors.primary,
  title,
  subtitle,
  detail,
  trailing,
  chevron,
  onPress,
  destructive,
  center,
}: RowProps) {
  const body = (
    <View style={styles.row}>
      {icon && (
        <View style={[styles.iconTile, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={17} color={iconColor} />
        </View>
      )}
      <View style={styles.rowBody}>
        <Text
          style={[
            styles.title,
            center && styles.centerTitle,
            destructive && styles.destructive,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {trailing}
      {!trailing && detail && <Text style={styles.detail}>{detail}</Text>}
      {!trailing && chevron && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={Colors.textFaint}
          style={styles.chevron}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: Colors.divider }}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Layout.spacing.lg,
  },
  header: {
    fontSize: Layout.font.xs,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginLeft: Layout.spacing.md,
    marginBottom: 7,
  },
  footer: {
    fontSize: Layout.font.xs,
    color: Colors.textMuted,
    marginTop: 7,
    marginHorizontal: Layout.spacing.md,
    lineHeight: 17,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.md,
    overflow: 'hidden',
  },
  separator: {
    height: Layout.hairline,
    backgroundColor: Colors.border,
    marginLeft: Layout.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: 11,
  },
  pressed: {
    backgroundColor: Colors.divider,
  },
  iconTile: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  rowBody: {
    flex: 1,
  },
  title: {
    fontSize: Layout.font.md,
    color: Colors.text,
    fontWeight: '400',
  },
  centerTitle: {
    textAlign: 'center',
    fontWeight: '600',
    color: Colors.primary,
  },
  destructive: {
    color: Colors.danger,
  },
  subtitle: {
    fontSize: Layout.font.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  detail: {
    fontSize: Layout.font.md,
    color: Colors.textMuted,
    marginLeft: Layout.spacing.sm,
  },
  chevron: {
    marginLeft: 6,
  },
});
