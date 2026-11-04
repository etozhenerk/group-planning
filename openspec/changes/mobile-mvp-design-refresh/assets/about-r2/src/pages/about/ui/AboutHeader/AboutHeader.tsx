import { useNavigate } from "react-router";
import { PageBack } from "@nav/PageBack";
import styles from "@a/ui/AboutHeader/AboutHeader.module.css";
export const AboutHeader = () => {
  const navigate = useNavigate();
  return (
    <header className={styles.header}>
      <PageBack label="К профилю" onClick={() => navigate(-1)} />
      <h1>О приложении</h1>
    </header>
  );
};
