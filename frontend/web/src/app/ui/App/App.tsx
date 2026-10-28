import styles from '@/app/ui/App/App.module.css';
import { ThemeProvider } from '@gravity-ui/uikit';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { queryClient } from '@/app/config/queryClient';
import { router } from '@/app/config/router';
import { useInputModality } from '@/app/ui/App/hooks/useInputModality';

export const App = () => {
  useInputModality();

  return (
    <ThemeProvider theme="dark" lang="ru" rootClassName={styles.theme ?? ''}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  );
};
