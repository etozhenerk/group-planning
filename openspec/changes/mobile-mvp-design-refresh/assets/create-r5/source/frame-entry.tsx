import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router'
import {ThemeProvider} from '@gravity-ui/uikit'
import {settings} from '@gravity-ui/date-utils'
import {CreatePreview} from '@preview/CreatePreview'
import '@gravity-ui/uikit/styles/styles.css'
import '@/app/styles/design-tokens.css'
import '@/app/styles/tokens.css'
import '@/app/styles/base.css'
import theme from '@/app/ui/App/App.module.css'
await settings.loadLocale('ru')
createRoot(document.getElementById('meetings-list')!).render(<ThemeProvider theme="dark" lang="ru" rootClassName={theme.theme}><MemoryRouter initialEntries={['/meetings/new']}><CreatePreview/></MemoryRouter></ThemeProvider>)
