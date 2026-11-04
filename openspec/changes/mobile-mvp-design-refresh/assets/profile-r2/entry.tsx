import { createRoot } from "react-dom/client";
import { ProfileStudy } from "@proto/app/ui/ProfileStudy/ProfileStudy";
createRoot(document.getElementById("somewhere-meetings-list")!).render(
  <ProfileStudy />,
);
