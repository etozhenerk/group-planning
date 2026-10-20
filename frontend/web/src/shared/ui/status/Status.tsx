export type StatusProps = {
  title: string;
  text?: string;
  error?: boolean;
  action?: () => void;
  actionLabel?: string;
};

export const Status = ({
  title,
  text,
  error = false,
  action,
  actionLabel = 'Попробовать снова',
}: StatusProps) => {
  return (
    <section className="state" role={error ? 'alert' : 'status'}>
      <h2>{title}</h2>
      {text && <p className="muted">{text}</p>}
      {action && (
        <button type="button" className="primary" onClick={action}>
          {actionLabel}
        </button>
      )}
    </section>
  );
};
