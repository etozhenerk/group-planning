import { useEffect, useState } from 'react';

export const useAppearanceDelay = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);

    return () => clearTimeout(timer);
  }, []);

  return visible;
};
