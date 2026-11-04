import { createRoot } from 'react-dom/client';
import { Declined } from '@rsvp/mobile/Declined/Declined';
import '@/app/styles/design-tokens.css';
import '@/app/styles/tokens.css';
import '@/app/styles/base.css';

createRoot(document.getElementById('root')!).render(<Declined/>);
