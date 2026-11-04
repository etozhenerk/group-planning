import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@gravity-ui/uikit";
import { InvitationsPage } from "@inv/pages/invitations/ui/InvitationsPage/InvitationsPage";
import "@gravity-ui/uikit/styles/styles.css";
import "@/app/styles/design-tokens.css";
import "@/app/styles/tokens.css";
import "@/app/styles/base.css";
import "@inv/app/preview.css";
import theme from "@/app/ui/App/App.module.css";

const client = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={client}>
    <ThemeProvider theme="dark" lang="ru" rootClassName={theme.theme ?? ""}>
      <MemoryRouter>
        <InvitationsPage />
      </MemoryRouter>
    </ThemeProvider>
  </QueryClientProvider>,
);
