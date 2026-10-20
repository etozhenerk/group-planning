export type AvatarProps = { name: string; size?: 'small' | 'normal'; own?: boolean };

export const Avatar = ({ name, size = 'normal', own = false }: AvatarProps) => {
  return (
    <span className={`avatar ${size} ${own ? 'own' : ''}`} aria-hidden="true">
      {name.trim().slice(0, 1).toUpperCase() || '?'}
    </span>
  );
};
