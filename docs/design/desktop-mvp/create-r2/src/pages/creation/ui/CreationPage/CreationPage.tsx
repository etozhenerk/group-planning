import { Sidebar } from "@create/widgets/navigation";
import {
  CreationForm,
  DiscardDialog,
  useCreation,
} from "@create/features/create-meeting";
import { PageHeader } from "@create/pages/creation/ui/PageHeader";
import { PreviewControls } from "@create/pages/creation/ui/PreviewControls";
import styles from "@create/pages/creation/ui/CreationPage/CreationPage.module.css";

export const CreationPage = () => {
  const model = useCreation();
  return (
    <>
      <div className={styles.frame}>
        <Sidebar onNavigate={model.navigate} />
        <main className={styles.main}>
          <PageHeader
            onBack={() => model.navigate("../desktop-list-r2/preview.html")}
          />
          <CreationForm key={model.scenario} model={model} />
        </main>
      </div>
      <DiscardDialog
        open={!!model.destination}
        stay={model.stay}
        leave={model.leave}
      />
      <PreviewControls state={model.scenario} onChange={model.changeState} />
    </>
  );
};
