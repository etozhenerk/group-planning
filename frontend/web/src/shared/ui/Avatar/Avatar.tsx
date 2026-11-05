import { useState } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/shared/ui/Avatar/Avatar.module.css';

export type AvatarProps = {
  name: string;
  size?: 'tiny' | 'small' | 'normal' | 'large' | 'chat' | 'mobile-chat' | 'info-chip';
  own?: boolean;
  silhouette?: boolean;
  tone?: 'sand' | 'lilac' | 'mint' | 'blue';
  src?: string | null;
  mobileSrc?: string | null;
};

export const Avatar = ({
  name,
  size = 'normal',
  own = false,
  silhouette = false,
  src = null,
  tone,
  mobileSrc,
}: AvatarProps) => {
  const mobile = useMobileLayout();
  const source = mobile && mobileSrc !== undefined ? mobileSrc : src;
  const [failedSource, setFailedSource] = useState<string | null>(null);

  return (
    <span
      className={[
        styles['avatar'],
        size === 'small' ? styles['small'] : size === 'large' ? styles.large : '',
        size === 'chat' || size === 'mobile-chat' ? styles.chat : '',
        size === 'mobile-chat' ? styles.mobileChat : '',
        size === 'tiny' ? styles.tiny : '',
        size === 'info-chip' ? styles.infoChip : '',
        own ? styles['own'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="avatar"
      data-tone={tone}
      data-mobile={mobile || silhouette}
      aria-hidden="true"
    >
      {source && source !== failedSource ? (
        <img
          className={styles.image}
          src={source}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailedSource(source)}
        />
      ) : mobile || silhouette ? (
        <svg className={styles.silhouette} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" fill="currentColor" />
          <path d="M4 22v-2a8 8 0 0 1 16 0v2Z" fill="currentColor" />
        </svg>
      ) : (
        name.trim().slice(0, 1).toUpperCase() || '?'
      )}
    </span>
  );
};
