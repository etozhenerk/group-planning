import { Navigation } from "@/widgets/navigation";
import { session } from "@p/model/sessionFixture";
import { useProfilePreview } from "@p/model/useProfilePreview";
import { ProfileIdentity } from "@p/ui/ProfileIdentity";
import { AccountAccess } from "@p/ui/AccountAccess";
import { ProfileMenu } from "@p/ui/ProfileMenu";
import { ProfileData } from "@p/ui/ProfileData";
import { ProfileStatus } from "@p/ui/ProfileStatus";
import { LogoutAction } from "@p/ui/LogoutAction";
import { SignedOut } from "@p/ui/SignedOut";
import styles from "@p/ui/ProfilePage/ProfilePage.module.css";
export const ProfilePage = () => {
  const m = useProfilePreview();
  if (m.mode === "signedout")
    return <SignedOut again={() => m.setMode("ready")} />;
  return (
    <>
      <main id="main" className={styles.page}>
        <h1>Профиль</h1>
        {m.mode === "loading" || m.mode === "error" ? (
          <ProfileStatus model={m} />
        ) : (
          <>
            <ProfileIdentity profile={m.profile} />
            <AccountAccess model={m} />
          </>
        )}
        <ProfileMenu />
        <LogoutAction model={m} />
      </main>
      <Navigation session={session} />
      <ProfileData model={m} />
    </>
  );
};
