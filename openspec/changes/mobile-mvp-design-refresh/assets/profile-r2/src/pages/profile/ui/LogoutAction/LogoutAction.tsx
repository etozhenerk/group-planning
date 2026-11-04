import { LogOut, TriangleAlert } from "lucide-react";
import { ButtonSpinner } from "@/shared/ui/ButtonSpinner";
import type { ProfileModel } from "@p/model/useProfilePreview";
import styles from "@p/ui/LogoutAction/LogoutAction.module.css";
export type LogoutActionProps = { model: ProfileModel };
export const LogoutAction = ({ model: m }: LogoutActionProps) => (
  <div className={styles.logout}>
    {m.logoutError && (
      <p className={styles.error} role="alert">
        <TriangleAlert size={18} />
        <span>Не удалось выйти. Попробуйте ещё раз.</span>
      </p>
    )}
    <button
      type="button"
      disabled={m.busy}
      aria-busy={m.busy}
      onClick={m.signOut}
    >
      {m.busy ? <ButtonSpinner /> : <LogOut size={20} strokeWidth={1.6} />}
      <span>{m.busy ? "Выходим…" : "Выйти из аккаунта"}</span>
    </button>
  </div>
);
