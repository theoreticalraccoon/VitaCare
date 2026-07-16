import { StyleSheet, View } from 'react-native';
import { ListSection } from './List';
import { TextField } from './TextField';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useApp } from '@/store/AppContext';
import { Caregivers } from '@/types';

interface Props {
  /** Hide the explanatory footer when embedded. */
  compact?: boolean;
}

/** Care-circle editor as two iOS grouped sections. */
export function CaregiversEditor({ compact }: Props) {
  const { data, setCaregivers } = useApp();
  const caregivers = data?.caregivers ?? {
    primaryName: '',
    primaryEmail: '',
    secondaryName: '',
    secondaryEmail: '',
  };

  const setField = (key: keyof Caregivers) => (value: string) =>
    setCaregivers({ ...caregivers, [key]: value });

  return (
    <View>
      <ListSection
        header="Primary caregiver"
        footer={
          compact
            ? undefined
            : 'Notified first if a dose runs late.'
        }
      >
        <View style={styles.rowPad}>
          <TextField
            icon="person-outline"
            placeholder="Name (e.g. home carer)"
            value={caregivers.primaryName}
            onChangeText={setField('primaryName')}
          />
          <TextField
            icon="mail-outline"
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={caregivers.primaryEmail}
            onChangeText={setField('primaryEmail')}
            style={styles.last}
          />
        </View>
      </ListSection>

      <ListSection
        header="Secondary contact"
        footer={
          compact ? undefined : 'Family — added to alerts if a dose is missed.'
        }
      >
        <View style={styles.rowPad}>
          <TextField
            icon="person-outline"
            placeholder="Name (e.g. son / daughter)"
            value={caregivers.secondaryName}
            onChangeText={setField('secondaryName')}
          />
          <TextField
            icon="mail-outline"
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={caregivers.secondaryEmail}
            onChangeText={setField('secondaryEmail')}
          />
        </View>
      </ListSection>
    </View>
  );
}

const styles = StyleSheet.create({
  rowPad: {
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xs,
    backgroundColor: Colors.surface,
  },
  last: {},
});
