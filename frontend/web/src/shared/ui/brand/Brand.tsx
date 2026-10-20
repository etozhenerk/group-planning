import { Link } from 'react-router';

export const Brand = () => {
  return (
    <Link to="/" className="brand" aria-label="Somewhere — на главную">
      <img src="/somewhere.svg" alt="" width="34" height="34" />
      <span>somewhere</span>
    </Link>
  );
};
