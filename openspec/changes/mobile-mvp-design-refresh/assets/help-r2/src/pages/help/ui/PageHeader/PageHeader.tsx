import { useNavigate } from "react-router";
import { PageBack } from "@nav/PageBack";
import styles from "@h/ui/PageHeader/PageHeader.module.css";
export type PageHeaderProps = {
  title: string;
  form?: boolean;
  backLabel?: string;
};
export const PageHeader = ({
  title,
  form = false,
  backLabel,
}: PageHeaderProps) => {
  const navigate = useNavigate();
  return (
    <header className={styles.header}>
      <PageBack
        label={backLabel ?? (form ? "К помощи" : "К профилю")}
        onClick={() => navigate(-1)}
      />
      <h1>{title}</h1>
      {form && (
        <p>
          <span className={styles.required}>*</span> — обязательное поле
        </p>
      )}
    </header>
  );
};
