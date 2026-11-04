import { Sidebar } from "@inv/widgets/navigation/ui/Sidebar/Sidebar";
import { ReplyDialog } from "@inv/features/answer-invitation";
import { portrait } from "@inv/pages/invitations/model/data";
import { useInvitationsDemo } from "@inv/pages/invitations/model/useInvitationsDemo";
import { InvitationsHeader } from "@inv/pages/invitations/ui/InvitationsHeader/InvitationsHeader";
import { InvitationsBody } from "@inv/pages/invitations/ui/InvitationsBody/InvitationsBody";
import { PreviewControls } from "@inv/pages/invitations/ui/PreviewControls/PreviewControls";
import styles from "@inv/pages/invitations/ui/InvitationsPage/InvitationsPage.module.css";

export const InvitationsPage = () => {
  const model = useInvitationsDemo();
  return (
    <>
      <div className={styles.frame}>
        <Sidebar />
        <main className={styles.main}>
          <InvitationsHeader
            count={model.items.length}
            unknown={["loading", "error"].includes(model.state)}
          />
          <div className={styles.body}>
            <InvitationsBody
              state={model.state}
              items={model.items}
              onOpen={model.open}
              retry={() => model.changeState("ready")}
              hasMore={model.hasMore}
              more={model.more}
            />
          </div>
        </main>
      </div>
      <ReplyDialog
        item={model.selected}
        photo={portrait(model.selected?.preview.organizer?.id ?? "")}
        pending={model.pending}
        error={model.error}
        onClose={model.close}
        onReply={model.reply}
      />
      <PreviewControls state={model.state} onChange={model.changeState} />
    </>
  );
};
