import { PublicHeader } from "@invite/widgets/public-header";
import { SignInAction } from "@invite/features/sign-in";
import { ResponsePanel } from "@invite/features/respond";
import { useInvitationDemo } from "@invite/pages/invite/model/useInvitationDemo";
import { InvitationContent } from "@invite/pages/invite/ui/InvitationContent";
import { ClosedNotice } from "@invite/pages/invite/ui/ClosedNotice";
import { DeclinedScreen } from "@invite/pages/invite/ui/DeclinedScreen";
import { InvitationState } from "@invite/pages/invite/ui/InvitationState";
import { InvitationSkeleton } from "@invite/pages/invite/ui/InvitationSkeleton";
import { PreviewControls } from "@invite/pages/invite/ui/PreviewControls";
import styles from "@invite/pages/invite/ui/InvitationPage/InvitationPage.module.css";

export const InvitationPage = () => {
  const model = useInvitationDemo();
  const actions = model.isClosed ? null : !model.signedIn ? (
    <SignInAction
      pending={model.authPending}
      error={model.authError}
      cancelled={model.scenario === "auth-cancelled"}
      onStart={model.signIn}
    />
  ) : model.scenario === "organizer" ? null : (
    <ResponsePanel
      answer={model.answer}
      pending={model.pending}
      error={model.responseError}
      uncertain={model.uncertain}
      last={model.last}
      onReply={model.respond}
    />
  );
  return (
    <>
      <div className={styles.viewport} key={model.scenario}>
        <PublicHeader signedIn={model.signedIn} onSignOut={model.signOut} />
        {model.scenario === "declined" ? (
          <DeclinedScreen title={model.title} />
        ) : model.scenario === "loading" ? (
          <InvitationSkeleton />
        ) : ["unavailable", "load-error"].includes(model.scenario) ? (
          <InvitationState
            unavailable={model.scenario === "unavailable"}
            retry={() => model.changeState("guest")}
          />
        ) : (
          <InvitationContent
            title={model.title}
            organizer={model.organizer}
            photo={model.organizerPhoto}
            scenario={model.scenario}
            closedNotice={
              model.isClosed ? <ClosedNotice last={model.last} /> : null
            }
            actions={actions}
          />
        )}
      </div>
      <PreviewControls state={model.scenario} onChange={model.changeState} />
    </>
  );
};
