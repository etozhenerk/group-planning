import { ChevronDown, LockKeyhole } from "lucide-react";
import type { ProfileModel } from "@p/model/useProfilePreview";
import styles from "@p/ui/AccountAccess/AccountAccess.module.css";
export type AccountAccessProps = { model: ProfileModel };
export const AccountAccess = ({ model }: AccountAccessProps) => (
  <button
    ref={model.trigger}
    type="button"
    className={styles.access}
    onClick={() => model.setOpen(true)}
    aria-haspopup="dialog"
    aria-expanded={model.open}
  >
    <LockKeyhole size={22} strokeWidth={1.6} />
    <span>
      <strong>Данные аккаунта</strong>
      <small>Личные данные и контакты · только вам</small>
    </span>
    <ChevronDown size={18} strokeWidth={1.6} />
  </button>
);
