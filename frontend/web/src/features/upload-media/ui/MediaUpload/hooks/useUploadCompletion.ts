import { useEffect, useRef } from 'react';

export const useUploadCompletion = (
  complete: boolean,
  active: boolean,
  done: () => void,
) => {
  const delivered = useRef(false);
  useEffect(() => {
    if (!complete) {
      delivered.current = false;
    } else if (active && !delivered.current) {
      delivered.current = true;
      done();
    }
  }, [complete, active, done]);
};
