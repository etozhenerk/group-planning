import type { ReactNode } from "react";
import { useCreation } from "@future/features/create-meeting/model/useCreation";
import { useStickyActions } from "@future/features/create-meeting/model/useStickyActions";
import { MeetingDetails } from "@future/features/create-meeting/ui/MeetingDetails";
import { CoverPicker } from "@future/features/create-meeting/ui/CoverPicker";
import { FormActions } from "@future/features/create-meeting/ui/FormActions";
import styles from "@future/features/create-meeting/ui/CreationForm/CreationForm.module.css";

export type CreationFormProps = {
  model: ReturnType<typeof useCreation>;
  placeField?: ReactNode;
};
export const CreationForm = ({ model, placeField }: CreationFormProps) => {
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
              placeField={placeField}
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
