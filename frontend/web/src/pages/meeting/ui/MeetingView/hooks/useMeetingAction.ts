import { useLocation, useNavigate, useSearchParams } from 'react-router';
import type { ConversationActionKind } from '@/widgets/conversation';

export const useMeetingAction = (id: string) => {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state: unknown = location.state;
  const fromAction =
    !!state &&
    typeof state === 'object' &&
    'meetingAction' in state &&
    state.meetingAction === true;

  const value = params.get('action');
  const open = value === 'date' || value === 'place' || value === 'task';
  const kind: ConversationActionKind = open ? value : 'date';

  return {
    open,
    kind,
    close: () => {
      if (fromAction) {
        void navigate(-1);
      } else {
        void navigate(`/meetings/${id}`, { replace: true });
      }
    },
  };
};
