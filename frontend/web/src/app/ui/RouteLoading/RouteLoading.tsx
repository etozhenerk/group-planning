import { useLocation } from 'react-router';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';
import { WorkspaceSkeleton } from '@/shared/ui/WorkspaceSkeleton';

export const RouteLoading = () => {
  const { pathname } = useLocation();

  if (pathname.startsWith('/meetings')) {
    const layout =
      pathname === '/meetings'
        ? 'list'
        : pathname.endsWith('/new') || pathname.endsWith('/created')
          ? 'form'
          : 'conversation';

    return <WorkspaceSkeleton layout={layout} />;
  }

  return <LoadingScreen />;
};
