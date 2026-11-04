import {
  PlacePicker,
  PlaceField,
  usePlacePicker,
} from "@future/features/select-place";
import { Sidebar } from "@future/widgets/navigation";
import {
  CreationForm,
  DiscardDialog,
  useCreation,
} from "@future/features/create-meeting";
import { PageHeader } from "@future/pages/creation/ui/PageHeader";
import { PreviewControls } from "@future/pages/creation/ui/PreviewControls";
import styles from "@future/pages/creation/ui/CreationPage/CreationPage.module.css";

export const CreationPage = () => {
  const model = useCreation();
  const picker = usePlacePicker();
  return (
    <>
      <div className={styles.frame}>
        <Sidebar onNavigate={model.navigate} />
        <main className={styles.main}>
          <PageHeader
            onBack={() => model.navigate("../desktop-list-r2/preview.html")}
          />
          <CreationForm
            key={model.scenario}
            model={model}
            placeField={
              <PlaceField
                value={model.value.place}
                disabled={model.locked}
                selected={!!picker.selected}
                onOpen={picker.show}
                onChange={(place) => {
                  picker.clear();
                  model.change({ ...model.value, place });
                }}
              />
            }
          />
        </main>
      </div>
      <DiscardDialog
        open={!!model.destination}
        stay={model.stay}
        leave={model.leave}
      />
      <PlacePicker
        model={picker}
        confirm={() =>
          model.change({ ...model.value, place: picker.confirm() })
        }
      />
      <PreviewControls
        state={model.scenario}
        onChange={model.changeState}
        mapState={picker.mode}
        onMapState={picker.changeMode}
      />
    </>
  );
};
