import { supabase } from '@/lib/supabase';
import { Caregivers, DoseStatus, EscalationLevel, ReminderChannels } from '@/types';

export interface CaregiverAlert {
  patientName: string;
  medicationName: string;
  status: DoseStatus;
  minutesLate: number;
  levels: EscalationLevel[];
}

/** True if the user has at least one caregiver email relevant to this alert. */
function hasRelevantRecipient(
  caregivers: Caregivers,
  levels: EscalationLevel[]
): boolean {
  if (levels.includes('primary') && caregivers.primaryEmail) return true;
  if (levels.includes('secondary') && caregivers.secondaryEmail) return true;
  return false;
}

/**
 * Triggers caregiver email alerts via the Supabase `notify-caregiver` Edge
 * Function (Resend). For security the function derives the actual recipients
 * and patient name from the signed-in user's own profile server-side — this
 * client only sends the dose context, never email addresses. Best-effort:
 * never throws, so confirming a dose always succeeds. No-op offline.
 */
export async function notifyCaregivers(
  caregivers: Caregivers,
  channels: ReminderChannels,
  alert: CaregiverAlert
): Promise<void> {
  if (!channels.email || !supabase) return;
  // Skip the round-trip if the user has no caregiver email set for this level.
  if (!hasRelevantRecipient(caregivers, alert.levels)) return;

  try {
    await supabase.functions.invoke('notify-caregiver', {
      body: {
        medicationName: alert.medicationName,
        status: alert.status,
        minutesLate: alert.minutesLate,
      },
    });
  } catch {
    // best-effort
  }
}
