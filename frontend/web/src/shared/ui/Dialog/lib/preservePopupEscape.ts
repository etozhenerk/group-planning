import type { KeyboardEvent } from 'react';

export const preservePopupEscape = (event: KeyboardEvent<HTMLDialogElement>) => {
  if (event.key === 'Escape' && event.currentTarget.querySelector('.g-popup_open')) {
    event.preventDefault();
  }
};
