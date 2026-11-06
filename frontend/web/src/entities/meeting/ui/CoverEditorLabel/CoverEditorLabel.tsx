export type CoverEditorLabelProps = {
  compact: boolean;
  optionalHint: boolean;
  className?: string;
};

export const CoverEditorLabel = ({
  compact,
  optionalHint,
  className,
}: CoverEditorLabelProps) => (
  <span className={className}>
    Обложка
    {(!compact || optionalHint) && (
      <>
        {' '}
        <small>необязательно</small>
      </>
    )}
  </span>
);
