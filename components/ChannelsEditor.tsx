import { ListSection } from './List';
import { ToggleRow } from './ToggleRow';
import { Colors } from '@/constants/Colors';
import { isExpoGo } from '@/lib/env';
import { useApp } from '@/store/AppContext';

/** Reminder delivery preferences as an iOS grouped section. */
export function ChannelsEditor({ header }: { header?: string }) {
  const { data, setChannels } = useApp();
  const channels = data?.channels ?? {
    notification: true,
    email: false,
    phoneAlarm: false,
  };

  const footer = isExpoGo
    ? "Push reminders and alarms activate in the installed app — Expo Go can't run them. Email summaries still work."
    : "We'll remind you at each dose time. Alarm plays a sound; email sends your caregivers a daily summary.";

  return (
    <ListSection header={header} footer={footer}>
      <ToggleRow
        icon="notifications"
        iconBg={Colors.danger}
        label="Push notification"
        value={channels.notification}
        onValueChange={(v) => setChannels({ ...channels, notification: v })}
      />
      <ToggleRow
        icon="alarm"
        iconBg={Colors.accent}
        label="Alarm sound"
        value={channels.phoneAlarm}
        onValueChange={(v) => setChannels({ ...channels, phoneAlarm: v })}
      />
      <ToggleRow
        icon="mail"
        iconBg={Colors.info}
        label="Email summary"
        value={channels.email}
        onValueChange={(v) => setChannels({ ...channels, email: v })}
      />
    </ListSection>
  );
}
