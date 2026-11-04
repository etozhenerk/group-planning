import { Link } from "react-router";
import {
  CircleHelp,
  MessageCircleWarning,
  Info,
  ChevronRight,
} from "lucide-react";
import styles from "@p/ui/ProfileMenu/ProfileMenu.module.css";
export const ProfileMenu = () => (
  <nav className={styles.menu} aria-label="Помощь и приложение">
    <Link to="/help" state={{ returnTo: "/profile" }}>
      <CircleHelp size={22} strokeWidth={1.6} />
      <span>Помощь</span>
      <ChevronRight size={18} strokeWidth={1.6} />
    </Link>
    <Link to="/support?screen=profile" state={{ returnTo: "/profile" }}>
      <MessageCircleWarning size={22} strokeWidth={1.6} />
      <span>Сообщить о проблеме</span>
      <ChevronRight size={18} strokeWidth={1.6} />
    </Link>
    <Link to="/about" state={{ returnTo: "/profile" }}>
      <Info size={22} strokeWidth={1.6} />
      <span>О приложении</span>
      <ChevronRight size={18} strokeWidth={1.6} />
    </Link>
    <div className={styles.documents}>
      <Link to="/privacy" state={{ returnTo: "/profile" }}>
        Конфиденциальность
      </Link>
      <Link to="/cookies" state={{ returnTo: "/profile" }}>
        Cookie
      </Link>
    </div>
  </nav>
);
