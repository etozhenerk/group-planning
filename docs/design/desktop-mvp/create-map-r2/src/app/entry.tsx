import { settings } from "@gravity-ui/date-utils";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@gravity-ui/uikit";
import { CreationPage } from "@future/pages/creation";
import "@gravity-ui/uikit/styles/styles.css";
import "@/app/styles/design-tokens.css";
import "@/app/styles/tokens.css";
import "@/app/styles/base.css";
import theme from "@/app/ui/App/App.module.css";

await settings.loadLocale("ru");

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme="dark" lang="ru" rootClassName={theme.theme ?? ""}>
    <CreationPage />
  </ThemeProvider>,
);
