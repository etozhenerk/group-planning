import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  clearPrivateStorage,
  deleteAccount,
  prepareDeletion,
  readDeletion,
  resetSession,
} from '@/entities/session';
import { resetAccess } from '@/entities/meeting';
import { ApiError } from '@/shared/api';

export const useDeletion = () => {
  const client = useQueryClient();
  const navigate = useNavigate();
  const [pending, setPending] = useState(readDeletion);
  const [open, setOpen] = useState(pending !== null);
  const [csrf, setCsrf] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [complete, setComplete] = useState(false);

  const clean = async () => {
    await client.cancelQueries();
    resetSession(client);
    resetAccess();
    clearPrivateStorage();
  };

  const submit = async () => {
    if (busy) {
      return;
    }

    let operation = pending;

    if (!operation) {
      try {
        operation = prepareDeletion(csrf);
        setPending(operation);
      } catch {
        setError(
          'Не удалось сохранить запрос. Разрешите хранение данных сайта и повторите.',
        );

        return;
      }
    }

    setBusy(true);
    setError(null);

    try {
      await deleteAccount(operation);
      await clean();
      setPending(null);
      setOpen(false);
      setComplete(true);
      await navigate('/', { replace: true });
    } catch (failure) {
      const expired = failure instanceof ApiError && failure.status === 401;
      setNeedsLogin(expired);
      setError(
        expired
          ? 'Сессия закончилась. Войдите снова, чтобы удалить аккаунт.'
          : failure instanceof ApiError && failure.status === 403
            ? 'Не удалось подтвердить запрос. Откройте страницу заново.'
            : 'Не удалось подтвердить удаление. Проверьте подключение и повторите.',
      );
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    try {
      await clean();
      setPending(null);
      setOpen(false);
      await navigate('/', { replace: true });
    } catch {
      setError('Не удалось очистить данные сайта. Повторите попытку.');
    }
  };

  const show = (token: string | null) => {
    setCsrf(token);
    setError(null);
    setNeedsLogin(false);
    setComplete(false);
    setOpen(true);
  };

  const close = () => {
    if (!busy && !pending) {
      setOpen(false);
    }
  };

  return { pending, open, busy, error, needsLogin, complete, submit, leave, show, close };
};
