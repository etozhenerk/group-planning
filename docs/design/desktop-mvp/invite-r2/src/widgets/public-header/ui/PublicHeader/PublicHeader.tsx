import { useRef, useState } from "react";
import { Popup } from "@gravity-ui/uikit";
import { LogOut } from "lucide-react";
import { Brand } from "@invite/shared/ui/Brand";
import styles from "@invite/widgets/public-header/ui/PublicHeader/PublicHeader.module.css";

export type PublicHeaderProps = { signedIn: boolean; onSignOut: () => void };
export const PublicHeader = ({ signedIn, onSignOut }: PublicHeaderProps) => {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  return (
    <header className={styles.header}>
      <Brand />
      <nav aria-label="Навигация приглашения" className={styles.nav}>
        <a
          href={
            signedIn
              ? "../desktop-list-r2/preview.html"
              : "../desktop-entry-r5/preview.html"
          }
        >
          {signedIn ? "Мои встречи" : "О somewhere"}
        </a>
        {signedIn && (
          <>
            <button
              type="button"
              ref={anchor}
              className={styles.avatar}
              aria-label="Аккаунт: Миша"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <img src="./avatars/misha.jpg" alt="" />
            </button>
            <Popup
              open={open}
              anchorRef={anchor}
              onOpenChange={setOpen}
              placement="bottom-end"
              returnFocus={anchor}
            >
              <div className={styles.menu}>
                <strong>Миша</strong>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSignOut();
                  }}
                >
                  <LogOut size={16} strokeWidth={1.7} />
                  Выйти
                </button>
              </div>
            </Popup>
          </>
        )}
      </nav>
    </header>
  );
};
