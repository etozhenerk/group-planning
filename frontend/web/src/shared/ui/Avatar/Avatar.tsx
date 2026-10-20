import styles from '@/shared/ui/Avatar/Avatar.module.css';

export type AvatarProps = { name: string; size?: 'small' | 'normal'; own?: boolean };

export const Avatar = ({ name, size = 'normal', own = false }: AvatarProps) => {
  return (
    <span
      className={[
        styles['avatar'],
        size === 'small' ? styles['small'] : '',
        own ? styles['own'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="avatar"
      aria-hidden="true"
    >
      {name.trim().slice(0, 1).toUpperCase() || '?'}
    </span>
  );
};
