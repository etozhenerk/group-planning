import { RequiredMark } from '@/shared/ui/RequiredMark';
import { FieldError } from '@/shared/ui/FieldError';
import type { usePlaceForm } from '@/features/place-poll/model/usePlaceForm';

export type PlaceManualFieldsProps = {
  form: ReturnType<typeof usePlaceForm>;
  fieldClassName: string | undefined;
  placeId: string;
  reasonId: string;
};

export const PlaceManualFields = ({
  form,
  fieldClassName,
  placeId,
  reasonId,
}: PlaceManualFieldsProps) => (
  <>
    <div className={fieldClassName}>
      <label htmlFor={placeId}>
        Новое место <RequiredMark />
      </label>
      <textarea
        id={placeId}
        value={form.place}
        onChange={(e) => form.setPlace(e.target.value)}
        disabled={form.locked}
        required
        rows={2}
        maxLength={500}
        placeholder="Название и адрес"
        aria-invalid={!!form.errors.place}
        aria-describedby={form.errors.place ? `${placeId}-error` : undefined}
      />
      <FieldError id={`${placeId}-error`} error={form.errors.place ?? ''} decorated />
    </div>
    <div className={fieldClassName}>
      <label htmlFor={reasonId}>Почему здесь</label>
      <textarea
        id={reasonId}
        value={form.explanation}
        onChange={(e) => form.setExplanation(e.target.value)}
        disabled={form.locked}
        rows={3}
        maxLength={2000}
        placeholder="Что вам нравится в этом месте"
        aria-invalid={!!form.errors.explanation}
        aria-describedby={form.errors.explanation ? `${reasonId}-error` : undefined}
      />
      <FieldError
        id={`${reasonId}-error`}
        error={form.errors.explanation ?? ''}
        decorated
      />
    </div>
  </>
);
