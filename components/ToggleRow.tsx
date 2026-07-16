import { Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ListRow } from './List';
import { Colors } from '@/constants/Colors';

interface Props {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  description?: string;
}

/** iOS list row with a trailing switch (systemGreen). Use inside a ListSection. */
export function ToggleRow({
  label,
  value,
  onValueChange,
  icon,
  iconBg = Colors.primary,
  description,
}: Props) {
  return (
    <ListRow
      icon={icon}
      iconBg={iconBg}
      title={label}
      subtitle={description}
      trailing={
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: Colors.divider, true: Colors.primary }}
          thumbColor={Colors.white}
          ios_backgroundColor={Colors.divider}
        />
      }
    />
  );
}
