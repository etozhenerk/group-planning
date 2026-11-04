import { Routes, Route } from "react-router";
import { ProfilePage } from "@profile";
import { ServicePage } from "@/pages/service";
import { HelpPage, FeedbackPage, useHelpPreview } from "@proto/pages/help";
export const PrototypeApp = () => {
  const model = useHelpPreview();
  return (
    <Routes>
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/help" element={<HelpPage model={model} />} />
      <Route path="/support" element={<FeedbackPage model={model} />} />
      {["about", "privacy", "cookies"].map((path) => (
        <Route key={path} path={"/" + path} element={<ServicePage />} />
      ))}
    </Routes>
  );
};
