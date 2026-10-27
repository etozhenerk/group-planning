import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Spike } from '@spike/Spike/Spike';
import '@/app/styles/design-tokens.css';
import '@/app/styles/tokens.css';
import '@/app/styles/base.css';
const root = document.querySelector('#root');
if (root) { createRoot(root).render(createElement(QueryClientProvider, { client: new QueryClient() }, createElement(Spike))); }
