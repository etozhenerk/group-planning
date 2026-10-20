import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/ui/App';
import '@/app/styles/tokens.css';
import '@/app/styles/base.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element is missing');
}

createRoot(container).render(createElement(App));
