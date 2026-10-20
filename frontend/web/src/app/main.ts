import { settings } from '@gravity-ui/date-utils';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/ui/App';
import '@gravity-ui/uikit/styles/styles.css';
import '@/app/styles/tokens.css';
import '@/app/styles/base.css';
import '@/app/styles/gravity.css';
import '@/app/styles/dialog.css';

await settings.loadLocale('ru');

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element is missing');
}

createRoot(container).render(createElement(App));
