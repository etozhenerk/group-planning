import { useRef } from 'react';

export const useIntent = () => {
  const current = useRef<{ body: string; key: string } | null>(null);

  return (body: unknown): string => {
    const encoded = JSON.stringify(body);

    if (!current.current || current.current.body !== encoded) {
      current.current = { body: encoded, key: crypto.randomUUID() };
    }

    return current.current.key;
  };
};
