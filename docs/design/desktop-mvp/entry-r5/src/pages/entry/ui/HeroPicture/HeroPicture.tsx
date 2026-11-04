import { MeetingCard } from "@prototype/entities/meeting";
import { ResponseButtons } from "@/features/respond/ui/ResponseButtons";
import { meeting, session } from "@prototype/pages/entry/model/fixtures";
import styles from "@prototype/pages/entry/ui/HeroPicture/HeroPicture.module.css";

export const HeroPicture = () => (
  <div
    className={styles.scene}
    role="img"
    aria-label="Приглашение на настолки к Саше: 7 ноября в 19:00. Друзья отвечают Приду, Возможно или Не смогу."
  >
    <div className={styles.photo}>
      <img src="./boardgame.png" alt="" />
    </div>
    <div className={styles.invitation} inert aria-hidden="true">
      <MeetingCard
        meeting={{ ...meeting, coverUrl: "/boardgame", unreadCount: "0" }}
      />
      <div className={styles.response}>
        <ResponseButtons
          session={session}
          id={meeting.id}
          expected="1"
          current="going"
          inMeeting
        />
      </div>
    </div>
  </div>
);
