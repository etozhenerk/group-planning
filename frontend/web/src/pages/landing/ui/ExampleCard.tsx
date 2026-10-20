import { useExample } from '@/pages/landing/model/useExample';

export type ExampleCardProps = {
  title: string;
  description: string;
  before: string;
  after?: string;
  labels?: [string, string];
  coming?: boolean;
  alt: string;
};

export const ExampleCard = ({
  title,
  description,
  before,
  after,
  labels,
  coming = false,
  alt,
}: ExampleCardProps) => {
  const state = useExample();

  return (
    <article className="example-card">
      <div className="row">
        <h2>{title}</h2>
        {coming && <span className="coming">Следующий этап</span>}
      </div>
      <p>{description}</p>
      <div className="example-preview">
        {after && labels && (
          <div className="example-switch" role="group" aria-label={`Примеры: ${title}`}>
            <button type="button" aria-pressed={!state.after} onClick={state.before}>
              {labels[0]}
            </button>
            <button type="button" aria-pressed={state.after} onClick={state.next}>
              {labels[1]}
            </button>
          </div>
        )}
        <img src={state.after && after ? after : before} alt={alt} loading="lazy" />
      </div>
    </article>
  );
};
