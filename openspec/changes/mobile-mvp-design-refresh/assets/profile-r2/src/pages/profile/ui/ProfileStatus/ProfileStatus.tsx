import { RefreshCw, UserRound } from "lucide-react";
import type { ProfileModel } from "@p/model/useProfilePreview";
import styles from "@p/ui/ProfileStatus/ProfileStatus.module.css";
export type ProfileStatusProps = { model: ProfileModel };
export const ProfileStatus = ({ model: m }: ProfileStatusProps) =>
  m.mode === "loading" ? (
    <div
      className={styles.skeleton}
      role="status"
      aria-label="Загружаем профиль"
    >
      <span />
      <div>
        <i />
        <i />
      </div>
    </div>
  ) : (
    <section className={styles.error}>
      <div className={styles.icon}>
        <UserRound size={26} strokeWidth={1.6} />
      </div>
      <h2>Профиль не загрузился</h2>
      <p>Повторите попытку, чтобы увидеть данные аккаунта.</p>
      <button type="button" onClick={() => m.setMode("ready")}>
        <RefreshCw size={17} />
        Повторить
      </button>
    </section>
  );
