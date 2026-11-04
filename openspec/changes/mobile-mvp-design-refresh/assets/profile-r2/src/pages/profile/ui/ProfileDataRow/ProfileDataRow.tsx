import styles from "@p/ui/ProfileDataRow/ProfileDataRow.module.css";
export type ProfileDataRowProps = { label: string; value: string | null };
export const ProfileDataRow = ({ label, value }: ProfileDataRowProps) => (
  <div className={styles.row}>
    <dt>{label}</dt>
    <dd data-missing={!value}>{value ?? "Не указано"}</dd>
  </div>
);
