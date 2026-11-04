import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {InvitationsScreen} from '@preview/InvitationsScreen'
import '@/app/styles/design-tokens.css'
import '@/app/styles/tokens.css'
import '@/app/styles/base.css'
const client=new QueryClient({defaultOptions:{queries:{enabled:false,retry:false}}})
createRoot(document.getElementById('meetings-list')!).render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/invitations']}><InvitationsScreen/></MemoryRouter></QueryClientProvider>)
