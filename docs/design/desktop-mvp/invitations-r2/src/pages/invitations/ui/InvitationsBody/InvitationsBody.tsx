import { RotateCw } from "lucide-react";
import { SkeletonRows } from "@/shared/ui/SkeletonRows";
import type { SavedInvitation } from "@/entities/meeting";
import { InvitationCard } from "@inv/entities/invitation";
import { portrait } from "@inv/pages/invitations/model/data";
import { InvitationsState } from "@inv/pages/invitations/ui/InvitationsState/InvitationsState";
import styles from "@inv/pages/invitations/ui/InvitationsBody/InvitationsBody.module.css";

export type InvitationsBodyProps = {
  state: string;
  items: SavedInvitation[];
  onOpen: (item: SavedInvitation) => void;
  retry: () => void;
  hasMore: boolean;
  more: () => void;
};

export const InvitationsBody = ({
  state,
  items,
  onOpen,
  retry,
  hasMore,
  more,
}: InvitationsBodyProps) => {
  if (state === "loading") {
    return (
      <div className={styles.loading}>
        <SkeletonRows label="Загрузка приглашений" variant="cards" count={4} />
      </div>
    );
  }
  if (state === "error") {
    return <InvitationsState error onRetry={retry} />;
  }
  const groups = new Map<string, SavedInvitation[]>();
  for (const item of items) {
    const month =
      item.preview.startsOn?.slice(0, 7) ??
      item.preview.startsAt?.slice(0, 7) ??
      "undated";
    groups.set(month, [...(groups.get(month) ?? []), item]);
  }
  return (
    <>
      {state === "refresh-error" && (
        <div className={styles.refresh} role="alert">
          <span>Не удалось обновить приглашения</span>
          <button type="button" onClick={retry}>
            <RotateCw size={16} />
            Повторить
          </button>
        </div>
      )}
      {items.length ? (
        [...groups].map(([month, items]) => (
          <section className={styles.group} key={month}>
            <h2 className={styles.month}>
              {month === "undated"
                ? "Без даты"
                : new Intl.DateTimeFormat("ru-RU", { month: "long" })
                    .format(new Date(month + "-15T12:00:00Z"))
                    .replace(/^./, (letter) => letter.toUpperCase())}
              {month !== "undated" && <span>{month.slice(0, 4)}</span>}
            </h2>
            <div className={styles.cards}>
              {items.map((item) => (
                <InvitationCard
                  key={item.preview.meetingId}
                  item={item}
                  photo={portrait(item.preview.organizer?.id ?? "")}
                  onOpen={() => onOpen(item)}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <InvitationsState onRetry={retry} />
      )}{" "}
      {hasMore && (
        <div className={styles.more}>
          <button type="button" onClick={more}>
            Показать ещё
          </button>
        </div>
      )}
    </>
  );
};
