import { LoginDialog, useEntrySignIn } from "@prototype/features/demo-signin";
import { PageHeader } from "@prototype/pages/entry/ui/PageHeader/PageHeader";
import { Hero } from "@prototype/pages/entry/ui/Hero/Hero";
import { MeetingsStory } from "@prototype/pages/entry/ui/MeetingsStory/MeetingsStory";
import { Conversation } from "@prototype/pages/entry/ui/Conversation/Conversation";
import { PollStory } from "@prototype/pages/entry/ui/PollStory/PollStory";
import { Planning } from "@prototype/pages/entry/ui/Planning/Planning";
import { PhotoStory } from "@prototype/pages/entry/ui/PhotoStory/PhotoStory";
import { EntryFooter } from "@prototype/pages/entry/ui/EntryFooter/EntryFooter";
import { PreviewControls } from "@prototype/pages/entry/ui/PreviewControls/PreviewControls";
import styles from "@prototype/pages/entry/ui/EntryPage/EntryPage.module.css";

export const EntryPage = () => {
  const signin = useEntrySignIn();
  return (
    <>
      <div className={styles.page} id="top">
        <a className={styles.skip} href="#main">
          К содержимому
        </a>
        <PageHeader onSignIn={signin.show} />
        <main id="main">
          <Hero onSignIn={signin.show} />
          <MeetingsStory />
          <Conversation />
          <PollStory />
          <Planning />
          <PhotoStory />
        </main>
        <EntryFooter onSignIn={signin.show} />
      </div>
      <LoginDialog
        open={signin.open}
        state={signin.state}
        onClose={signin.close}
        onStart={signin.start}
      />
      <PreviewControls
        value={
          signin.open
            ? signin.state === "ready"
              ? "login"
              : signin.state
            : "ready"
        }
        onChange={signin.preview}
      />
    </>
  );
};
