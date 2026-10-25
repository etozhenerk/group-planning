import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useUploadSelection } from '@/features/upload-media';

export const useUploadView = (id: string, user: string) => {
  const upload = useUploadSelection(user, id);
  useEffect(() => upload.clear, [upload.clear]);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const purpose: 'memory' | 'message' =
    params.get('purpose') === 'memory' ? 'memory' : 'message';

  const photo = purpose === 'memory' || params.get('kind') !== 'file';
  const returnTo =
    upload.selection?.returnTo ??
    `/meetings/${id}${purpose === 'memory' ? '/memories' : ''}`;

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        void navigate(returnTo, { replace: true });
      }
    };

    document.addEventListener('keydown', close);

    return () => document.removeEventListener('keydown', close);
  }, [navigate, returnTo]);

  return {
    purpose,
    photo,
    returnTo,
    files: upload.selection?.files ?? [],
    denied: upload.denied,
    clear: upload.clear,
    done: () => {
      void navigate(returnTo, { replace: true });
      upload.clear();
    },
  };
};
