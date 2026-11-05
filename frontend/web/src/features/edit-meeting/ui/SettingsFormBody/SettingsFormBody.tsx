import type { Meeting } from '@/entities/meeting';
import { CoverEditor, MeetingFields } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { RequiredLegend } from '@/shared/ui/RequiredLegend';
import type { useEdit } from '@/features/edit-meeting/model/useEdit';

export type SettingsFormBodyProps = {
  meeting: Meeting;
  session: Session;
  form: ReturnType<typeof useEdit>;
  mobile: boolean;
};

export const SettingsFormBody = ({
  meeting,
  session,
  form,
  mobile,
}: SettingsFormBodyProps) => {
  const cover = (
    <CoverEditor
      compact={mobile}
      optionalHint={false}
      value={form.value.cover}
      onChange={(cover) => form.change({ ...form.value, cover })}
      onBusy={form.setPreparing}
      disabled={form.locked}
      invalid={!!form.errors.cover}
      original={{ url: meeting.coverUrl, meeting: meeting.id, user: session.user.id }}
    />
  );

  return (
    <>
      {mobile && cover}
      <RequiredLegend sentence />
      <MeetingFields
        settings
        dateRequired={!!meeting.startsAt || !!meeting.startsOn}
        value={form.value}
        onChange={form.change}
        disabled={form.locked}
        errors={form.errors}
      />
      {!mobile && cover}
    </>
  );
};
