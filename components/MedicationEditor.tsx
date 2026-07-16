import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ListRow, ListSection } from './List';
import { PrimaryButton } from './PrimaryButton';
import { TextField } from './TextField';
import { TimeField } from './TimeField';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { formatTime12 } from '@/lib/time';
import { useApp } from '@/store/AppContext';
import { Medication } from '@/types';

type Sheet = { mode: 'add' } | { mode: 'edit'; med: Medication } | null;

/** iOS grouped medication list with an add/edit bottom sheet. */
export function MedicationEditor({ header }: { header?: string }) {
  const { data, addMedication, updateMedication, removeMedication } = useApp();
  const meds = data?.medications ?? [];
  const [sheet, setSheet] = useState<Sheet>(null);

  return (
    <View>
      <ListSection header={header}>
        {meds.map((med) => (
          <ListRow
            key={med.id}
            icon="medical"
            iconBg={med.color}
            title={med.name}
            subtitle={`${formatTime12(med.time)}${med.dosage ? ` · ${med.dosage}` : ''}`}
            chevron
            onPress={() => setSheet({ mode: 'edit', med })}
          />
        ))}
        <ListRow
          icon="add"
          iconBg={Colors.primary}
          title="Add medication"
          onPress={() => setSheet({ mode: 'add' })}
        />
      </ListSection>

      <EditSheet
        sheet={sheet}
        onClose={() => setSheet(null)}
        onSave={(fields) => {
          if (!fields.name.trim() || !fields.time) {
            Alert.alert('Check the details', 'Enter a name and pick a time.');
            return;
          }
          if (sheet?.mode === 'edit') {
            updateMedication(sheet.med.id, fields);
          } else {
            addMedication(fields.name, fields.time, fields.dosage);
          }
          setSheet(null);
        }}
        onDelete={
          sheet?.mode === 'edit'
            ? () => {
                const target = sheet.med;
                Alert.alert('Remove medication', `Remove ${target.name}?`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                      removeMedication(target.id);
                      setSheet(null);
                    },
                  },
                ]);
              }
            : undefined
        }
      />
    </View>
  );
}

function EditSheet({
  sheet,
  onClose,
  onSave,
  onDelete,
}: {
  sheet: Sheet;
  onClose: () => void;
  onSave: (f: { name: string; dosage: string; time: string }) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [seeded, setSeeded] = useState<string | null>(null);

  // Seed/reset fields when the sheet opens.
  const key = sheet ? (sheet.mode === 'edit' ? sheet.med.id : 'add') : null;
  if (key && key !== seeded) {
    setSeeded(key);
    if (sheet?.mode === 'edit') {
      setName(sheet.med.name);
      setDosage(sheet.med.dosage ?? '');
      setTime(sheet.med.time);
    } else {
      setName('');
      setDosage('');
      setTime('');
    }
  }
  if (!sheet && seeded) setSeeded(null);

  return (
    <Modal
      visible={!!sheet}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.sheetTitle}>
              {sheet?.mode === 'edit' ? 'Edit' : 'New Medication'}
            </Text>
            <Pressable onPress={() => onSave({ name, dosage, time })} hitSlop={8}>
              <Text style={styles.save}>Save</Text>
            </Pressable>
          </View>

          <TextField label="NAME" placeholder="e.g. Metformin" value={name} onChangeText={setName} />
          <TextField label="DOSE" placeholder="e.g. 500 mg (optional)" value={dosage} onChangeText={setDosage} />
          <TimeField label="TIME" value={time} onChange={setTime} />

          {onDelete && (
            <PrimaryButton
              label="Remove medication"
              variant="tinted"
              icon="trash-outline"
              color={Colors.danger}
              onPress={onDelete}
              style={styles.delete}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Layout.radius.lg,
    borderTopRightRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    marginBottom: Layout.spacing.md,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.lg,
  },
  sheetTitle: {
    fontSize: Layout.font.md,
    fontWeight: '600',
    color: Colors.text,
  },
  cancel: {
    fontSize: Layout.font.md,
    color: Colors.info,
  },
  save: {
    fontSize: Layout.font.md,
    color: Colors.info,
    fontWeight: '600',
  },
  delete: {
    marginTop: Layout.spacing.sm,
  },
});
