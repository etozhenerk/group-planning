export type CoverEditorLabelProps = {
  compact: boolean;
  creation: boolean;
  hasPhoto: boolean;
  className?: string;
};

export const CoverEditorLabel = ({
  compact,
  creation,
  hasPhoto,
  className,
}: CoverEditorLabelProps) => (
  <span className={className}>
    Обложка
    <small>
      {compact && !creation
        ? hasPhoto
          ? 'Фото встречи'
          : 'Не добавлена'
        : 'необязательно'}
    </small>
  </span>
);
