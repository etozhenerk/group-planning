import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "@gravity-ui/uikit";
import { settings } from "@gravity-ui/date-utils";
import { PrototypeApp } from "@proto/app/ui/PrototypeApp";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@gravity-ui/uikit/styles/styles.css";
import "@/app/styles/design-tokens.css";
import "@/app/styles/tokens.css";
import "@/app/styles/base.css";
import theme from "@/app/ui/App/App.module.css";
document.documentElement.dataset.inputModality = "pointer";
document.addEventListener(
  "pointerdown",
  () => {
    document.documentElement.dataset.inputModality = "pointer";
  },
  true,
);
document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Tab")
      document.documentElement.dataset.inputModality = "keyboard";
  },
  true,
);
await settings.loadLocale("ru");
createRoot(document.getElementById("meetings-list")!).render(
  <ThemeProvider theme="dark" lang="ru" rootClassName={theme.theme ?? ""}>
    <MemoryRouter
      initialEntries={
        new URLSearchParams(location.search).get("state")?.startsWith("form") ||
        [
          "success",
          "sending",
          "validation",
          "attachment",
          "file-error",
        ].includes(new URLSearchParams(location.search).get("state") ?? "")
          ? ["/profile", "/help", "/support"]
          : ["/profile", "/help"]
      }
    >
      <QueryClientProvider client={new QueryClient()}>
        <PrototypeApp />
      </QueryClientProvider>
    </MemoryRouter>
  </ThemeProvider>,
);
