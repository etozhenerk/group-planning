import { Outlet } from 'react-router';
import { useSessionLifecycle } from '@/app/model/useSessionLifecycle';
import { isDemo } from '@/shared/config';
import '@/app/styles/workspace.css';
import '@/app/styles/conversation.css';

export const Root = () => {
  useSessionLifecycle();

  return (
    <div className={isDemo ? 'demo-active' : ''}>
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      {isDemo && (
        <div className="demo-notice">Демостенд · данные хранятся до перезапуска</div>
      )}
      <Outlet />
    </div>
  );
};
