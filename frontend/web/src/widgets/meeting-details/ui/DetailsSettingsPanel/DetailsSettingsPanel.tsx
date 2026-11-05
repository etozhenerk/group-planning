import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { EditMeetingForm } from '@/features/edit-meeting';
import type { useMeetingDetailsPanel } from '@/widgets/meeting-details/ui/MeetingDetails/hooks/useMeetingDetailsPanel';
import styles from '@/widgets/meeting-details/ui/DetailsSettingsPanel/DetailsSettingsPanel.module.css';

export type DetailsSettingsPanelProps = {
  meeting: Meeting;
  session: Session;
  panel: string | null;
  surface: ReturnType<typeof useMeetingDetailsPanel>;
};

export const DetailsSettingsPanel = ({
  meeting,
  session,
  panel,
  surface,
}: DetailsSettingsPanelProps) => (
  <div
    className={styles.form}
    hidden={panel !== 'settings'}
    ref={surface.settings}
    tabIndex={-1}
  >
    {(surface.visited || panel === 'settings') && (
      <EditMeetingForm
        key={surface.generation}
        meeting={meeting}
        session={session}
        onSaved={surface.saved}
        active={panel === 'settings'}
        onRegisterClose={surface.registerClose}
        onModeChange={surface.setSettingsTitle}
        onDiscard={surface.discarded}
      />
    )}
  </div>
);
