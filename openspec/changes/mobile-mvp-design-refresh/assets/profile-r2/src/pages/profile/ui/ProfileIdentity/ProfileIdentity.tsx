import { UserRound } from "lucide-react";
import type { ProfileModel } from "@p/model/useProfilePreview";
import styles from "@p/ui/ProfileIdentity/ProfileIdentity.module.css";
export type ProfileIdentityProps = { profile: ProfileModel["profile"] };
export const ProfileIdentity = ({ profile }: ProfileIdentityProps) => (
  <section className={styles.identity} aria-label="Ваш профиль">
    <div className={styles.person}>
      <div className={styles.avatar}>
        {profile.avatar ? (
          <img src={profile.avatar} alt="Ваше фото" />
        ) : (
          <UserRound size={38} strokeWidth={1.5} aria-label="Нет фотографии" />
        )}
      </div>
      <div className={styles.text}>
        <h2>{profile.name}</h2>
        <p>Вход через Яндекс ID</p>
      </div>
    </div>
  </section>
);
