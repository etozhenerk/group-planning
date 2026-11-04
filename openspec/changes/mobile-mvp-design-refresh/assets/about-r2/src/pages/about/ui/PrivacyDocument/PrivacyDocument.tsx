import { Link } from "react-router";
import { privacyOperatorFields, privacySections } from "@a/model/privacy";
import styles from "@a/ui/PrivacyDocument/PrivacyDocument.module.css";
export const PrivacyDocument = () => (
  <article className={styles.copy}>
    {privacySections.map((section) => (
      <section id={"privacy-" + section.key} key={section.key}>
        <h2 tabIndex={-1}>{section.title}</h2>
        {section.key === "operator" && (
          <dl className={styles.fields}>
            {privacyOperatorFields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {section.paragraphs.map((p, i) => (
          <p key={i}>{p.text}</p>
        ))}
        {section.key === "retention" && (
          <Link to="/cookies">Cookie и данные браузера</Link>
        )}
      </section>
    ))}
  </article>
);
