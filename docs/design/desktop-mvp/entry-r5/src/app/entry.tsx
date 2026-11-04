import { ThemeProvider } from "@gravity-ui/uikit";
import "@gravity-ui/uikit/styles/styles.css";
import theme from "@/app/ui/App/App.module.css";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { EntryPage } from "@prototype/pages/entry/ui/EntryPage/EntryPage";
import "@/app/styles/design-tokens.css";
import "@/app/styles/tokens.css";
import "@/app/styles/base.css";

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={client}>
    <ThemeProvider theme="dark" lang="ru" rootClassName={theme.theme ?? ""}>
      <MemoryRouter>
        <EntryPage />
      </MemoryRouter>
    </ThemeProvider>
  </QueryClientProvider>,
);
