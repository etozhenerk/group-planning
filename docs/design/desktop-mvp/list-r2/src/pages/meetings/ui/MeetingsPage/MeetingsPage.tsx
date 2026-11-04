import { Sidebar } from "@list/widgets/navigation/ui/Sidebar/Sidebar";
import { Header } from "@list/pages/meetings/ui/Header/Header";
import { PageBody } from "@list/pages/meetings/ui/PageBody/PageBody";
import { PreviewControls } from "@list/pages/meetings/ui/PreviewControls/PreviewControls";
import { useMeetingsPreview } from "@list/pages/meetings/model/useMeetingsPreview";
import styles from "@list/pages/meetings/ui/MeetingsPage/MeetingsPage.module.css";

export const MeetingsPage = () => {
  const m = useMeetingsPreview();
  return (
    <>
      <div className={styles.frame}>
        <Sidebar />
        <main className={styles.main}>
          <Header
            period={m.period}
            view={m.view}
            counts={m.counts}
            unknown={["loading", "error"].includes(m.state)}
            empty={m.state === "empty"}
            onPeriod={m.updatePeriod}
            onView={m.updateView}
          />
          <div ref={m.body} className={styles.body}>
            <PageBody model={m} />
          </div>
        </main>
      </div>
      <PreviewControls value={m.state} onChange={m.updateState} />
    </>
  );
};
