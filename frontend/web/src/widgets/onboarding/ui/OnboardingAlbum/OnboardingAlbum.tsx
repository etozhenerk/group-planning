import { DownloadAlbumButton } from '@/features/download-album';
import { ignoreExampleAction } from '@/widgets/onboarding/model/examples';
import styles from '@/widgets/onboarding/ui/OnboardingAlbum/OnboardingAlbum.module.css';

export const OnboardingAlbum = () => (
  <div className={styles.album} inert>
    <div className={styles.photos}>
      <img className={styles.hero} src="/onboarding/boardgame.png" alt="" />
      <img className={styles.second} src="/onboarding/dinner.png" alt="" />
    </div>
    <div className={styles.bar}>
      <span>
        Настолки у Саши<small>2 фотографии встречи</small>
      </span>
      <DownloadAlbumButton
        state={{ phase: 'idle' }}
        start={ignoreExampleAction}
        cancel={ignoreExampleAction}
        mobile
      />
    </div>
  </div>
);
