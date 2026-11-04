import type { Meeting } from "@/entities/meeting";
import type { Session } from "@/entities/session";
import { MapPin, Map } from "lucide-react";
import { PlacePicker } from "@preview/ui/PlacePicker";
import { ButtonSpinner } from "@/shared/ui/ButtonSpinner";
import { usePlaceForm } from "@preview/usePlaceDraft";
import { useChatModel } from "@preview/ChatContext";
import { DeadlineFields } from "@preview/ui/DeadlineFields";
import { FieldHint } from "@preview/ui/FieldHint";
import { FormFeedback } from "@preview/ui/FormFeedback";
import { ExitGuard } from "@preview/ui/ExitGuard";
import styles from "@preview/ui/PlaceForm/PlaceForm.module.css";
export type PlaceFormProps = {
  meeting: Meeting;
  session: Session;
  done: () => void;
};
export const PlaceForm = ({ meeting, session, done }: PlaceFormProps) => {
  const f = usePlaceForm(meeting, session, done),
    m = useChatModel();
  if (m.mapOpen)
    return (
      <PlacePicker
        selected={f.location}
        choose={f.chooseLocation}
        cancel={() => m.setMapOpen(false)}
        mode={m.scenario}
      />
    );
  if (m.formGuard) return <ExitGuard stay={f.stay} leave={f.leave} />;
  return (
    <form noValidate className={styles.form} onSubmit={f.submit}>
      <div className={styles.body} data-testid="place-form-scroll">
        <div className={styles.current}>
          <MapPin size={18} />
          <div>
            <span>Сейчас встречаемся здесь</span>
            <p>{meeting.place}</p>
          </div>
        </div>
        <p className={styles.legend}>
          <b aria-hidden="true">*</b> Обязательные поля
        </p>
        <div className={styles.field}>
          <label htmlFor="new-place">
            Новое место <b aria-hidden="true">*</b>
          </label>
          {f.location ? (
            <div className={styles.selected}>
              <MapPin size={20} />
              <div>
                <strong>{f.location.name}</strong>
                <span>{f.location.address}</span>
                <button
                  type="button"
                  disabled={f.locked}
                  onClick={() => m.setMapOpen(true)}
                >
                  Изменить место
                </button>
              </div>
            </div>
          ) : (
            <textarea
              id="new-place"
              value={f.place}
              onChange={(event) => f.setPlace(event.target.value)}
              disabled={f.locked}
              required
              rows={2}
              maxLength={500}
              placeholder="Название и адрес"
              aria-invalid={!!f.errors.place}
              aria-describedby="place-hint"
            />
          )}
          {!f.location && (
            <button
              className={styles.mapButton}
              type="button"
              disabled={f.locked}
              onClick={() => m.setMapOpen(true)}
            >
              <Map size={18} />
              Выбрать на карте
            </button>
          )}
          {f.location && (
            <button
              className={styles.manual}
              type="button"
              disabled={f.locked}
              onClick={f.clearLocation}
            >
              Ввести адрес вручную
            </button>
          )}
          <div id="place-hint">
            {f.errors.place && <FieldHint text={f.errors.place} />}
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="place-reason">Почему здесь</label>
          <textarea
            id="place-reason"
            value={f.explanation}
            onChange={(event) => f.setExplanation(event.target.value)}
            disabled={f.locked}
            rows={3}
            maxLength={2000}
            placeholder="Что вам нравится в этом месте"
            aria-describedby="reason-hint"
            aria-invalid={!!f.errors.explanation}
          />
          <div id="reason-hint">
            {f.errors.explanation && <FieldHint text={f.errors.explanation} />}
          </div>
        </div>
        <DeadlineFields
          value={f.deadline}
          change={f.setDeadline}
          zone={meeting.timezone}
          choice={f.choice}
          choose={f.setChoice}
          errors={f.errors}
          disabled={f.locked}
        />
        <p className={styles.note}>
          Место изменится после окончания опроса, если большинство проголосует
          за.
        </p>
      </div>
      <div className={styles.footer} data-testid="place-form-footer">
        <FormFeedback problem={f.problem} />
        <button type="submit" disabled={f.pending} aria-busy={f.pending}>
          {f.pending ? (
            <ButtonSpinner />
          ) : f.uncertain ? (
            "Повторить отправку"
          ) : f.problem === "error" ? (
            "Попробовать снова"
          ) : (
            "Предложить место"
          )}
        </button>
      </div>
    </form>
  );
};
