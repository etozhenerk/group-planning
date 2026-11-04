import { Routes, Route } from "react-router";
import { ProfilePage } from "@proto/pages/profile";
import { ServicePage } from "@/pages/service";
import { SupportPage } from "@/pages/support";
export const PrototypeApp = () => (
  <Routes>
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/support" element={<SupportPage />} />
    {["help", "about", "privacy", "cookies"].map((path) => (
      <Route key={path} path={"/" + path} element={<ServicePage />} />
    ))}
  </Routes>
);
