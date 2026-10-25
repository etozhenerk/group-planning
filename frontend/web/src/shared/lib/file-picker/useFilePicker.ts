import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

export const useFilePicker = (selected: (files: File[]) => void) => {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const choose = (photo: boolean) => {
    if (input.current) {
      input.current.accept = photo ? 'image/jpeg,image/png,image/webp' : '';
      input.current.click();
    }
  };

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (next.length) {
      setFiles(next);
      selected(next);
    }
  };

  return {
    files,
    choose,
    inputProps: {
      ref: input,
      type: 'file',
      multiple: true,
      hidden: true,
      onChange: change,
    },
  };
};
