import { useCreation } from "@create/features/create-meeting/model/useCreation";
import { useStickyActions } from "@create/features/create-meeting/model/useStickyActions";
import { MeetingDetails } from "@create/features/create-meeting/ui/MeetingDetails";
import { CoverPicker } from "@create/features/create-meeting/ui/CoverPicker";
import { FormActions } from "@create/features/create-meeting/ui/FormActions";
import styles from "@create/features/create-meeting/ui/CreationForm/CreationForm.module.css";

export type CreationFormProps = { model: ReturnType<typeof useCreation> };
export const CreationForm = ({ model }: CreationFormProps) => {
  const layout = useStickyActions();
  return (
    <div className={styles.scroll} ref={layout.scroll}>
      <form
        noValidate
        onSubmit={model.submit}
        className={styles.form}
        ref={(node) => {
          model.formRef.current = node;
          layout.content.current = node;
        }}
        aria-label="Создание встречи"
      >
        <div className={styles.content}>
          <div className={styles.details}>
            <MeetingDetails
              value={model.value}
              onChange={model.change}
              errors={model.errors}
              disabled={model.locked}
            />
          </div>
          <div className={styles.cover}>
            <CoverPicker
              value={model.value.cover}
              onChange={(cover) => model.change({ ...model.value, cover })}
              disabled={model.locked}
              onBusy={model.setPreparing}
            />
          </div>
        </div>
        <FormActions
          sticky={layout.sticky}
          problem={model.problem}
          pending={model.pending}
          preparing={model.preparing}
        />
      </form>
    </div>
  );
};
