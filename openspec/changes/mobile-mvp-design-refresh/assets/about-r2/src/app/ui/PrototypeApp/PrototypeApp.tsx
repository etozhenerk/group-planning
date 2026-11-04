import { Routes, Route } from "react-router";
import { ProfilePage } from "@profile";
import { HelpPage, FeedbackPage, useHelpPreview } from "@help";
import { AboutPage, DocumentPage, useAboutPreview } from "@proto/pages/about";
export const PrototypeApp = () => {
  const help = useHelpPreview(),
    about = useAboutPreview();
  return (
    <Routes>
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/help" element={<HelpPage model={help} />} />
      <Route path="/support" element={<FeedbackPage model={help} />} />
      <Route path="/about" element={<AboutPage model={about} />} />
      <Route
        path="/privacy"
        element={<DocumentPage kind="privacy" model={about} />}
      />
      <Route
        path="/cookies"
        element={<DocumentPage kind="cookies" model={about} />}
      />
    </Routes>
  );
};
