import { InfoState } from '@preview/ui/InfoState';
import { Dialog } from '@/shared/ui/Dialog';
import { ShareForm } from '@/features/share-invitation';
import { ResponseButtons } from '@/features/respond';
import { EditMeetingForm } from '@/features/edit-meeting';
import { useInfoModel } from '@preview/model/InfoContext';
import styles from '@preview/ui/InfoDialogs/InfoDialogs.module.css';
export const InfoDialogs = () => {
  const m = useInfoModel();
  if (!m.child) {
    return null;
  }
  return (
    <>
      {m.child === 'share' && m.organizer && (
        <ShareForm id={m.meeting.id} meeting={m.meeting} />
      )}
      {m.child === 'settings' && !m.organizer && (
        <InfoState
          title="Настройки доступны организатору"
          text="Вы можете посмотреть детали встречи и изменить свой ответ."
          label="К деталям встречи"
          action={() => m.backToInfo()}
        />
      )}
      {m.child === 'settings' && m.organizer && (
        <EditMeetingForm
          key={m.generation}
          meeting={m.meeting}
          session={m.session}
          onSaved={() => {
            m.setSaved(true);
            m.backToInfo();
          }}
        />
      )}
      {m.child === 'response' && !m.organizer && (
        <div className={styles.response}>
          <p>Если выбрать «Возможно» или «Не смогу», доступ к чату закроется.</p>
          <ResponseButtons
            session={m.session}
            id={m.meeting.id}
            expected={m.meeting.myRsvpRevision}
            current={m.answer}
            onSaved={() => m.setChild(null)}
            inMeeting
          />
        </div>
      )}
    </>
  );
};
