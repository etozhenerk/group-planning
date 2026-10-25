import { useState } from 'react';
import styles from '@/shared/ui/Avatar/Avatar.module.css';

export type AvatarProps = {
  name: string;
  size?: 'small' | 'normal' | 'large' | 'chat';
  own?: boolean;
  tone?: 'sand' | 'lilac' | 'mint' | 'blue';
  src?: string | null;
};

export const Avatar = ({
  name,
  size = 'normal',
  own = false,
  src = null,
  tone,
}: AvatarProps) => {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={[
        styles['avatar'],
        size === 'small' ? styles['small'] : size === 'large' ? styles.large : '',
        size === 'chat' ? styles.chat : '',
        own ? styles['own'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="avatar"
      data-tone={tone}
      aria-hidden="true"
    >
      {src && !failed ? (
        <img
          className={styles.image}
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        name.trim().slice(0, 1).toUpperCase() || '?'
      )}
    </span>
  );
};
