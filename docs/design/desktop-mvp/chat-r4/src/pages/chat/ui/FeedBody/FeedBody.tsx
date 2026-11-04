import { Fragment } from "react";
import { FeedEntryRecord } from "@/widgets/conversation/ui/FeedEntryRecord";
import { UnreadDivider } from "@/widgets/conversation/ui/UnreadDivider";
import { SkeletonConversation } from "@/shared/ui/SkeletonConversation";
import type { ConversationSurface } from "@/widgets/conversation/model/useConversationSurface";
import { useChatModel } from "@preview/ChatContext";
import { user } from "@preview/data";
import styles from "@desktop/pages/chat/ui/FeedBody/FeedBody.module.css";

export type FeedBodyProps = { surface: ConversationSurface };

export const FeedBody = ({ surface }: FeedBodyProps) => {
  const model = useChatModel();
  if (model.scenario === "loading") return <SkeletonConversation />;
  if (
    model.scenario === "error" ||
    model.scenario === "denied" ||
    model.entries.length === 0
  ) {
    const error = model.scenario === "error",
      denied = model.scenario === "denied";
    return (
      <section className={styles.state}>
        <h2>
          {error
            ? "Чат не загрузился"
            : denied
              ? "Переписка закрыта"
              : "Кто начнёт?"}
        </h2>
        <p>
          {error
            ? "Не удалось получить сообщения. Попробуйте ещё раз."
            : denied
              ? "Для доступа к чату нужен ответ «Приду»."
              : "Можно обсудить планы или просто поздороваться."}
        </p>
        {error && (
          <button type="button" onClick={() => model.setScenario("ready")}>
            Повторить загрузку
          </button>
        )}
        {denied && (
          <a href="../invite-r3/frame.html?state=ready">Открыть приглашение</a>
        )}
      </section>
    );
  }
  return (
    <>
      <div className={styles.day}>4 ноября</div>
      <ul className={styles.messages}>
        {model.entries.map((entry) => (
          <Fragment key={entry.id}>
            {model.scenario === "unread" && entry.id === "msg-2" && (
              <UnreadDivider />
            )}
            <FeedEntryRecord
              entry={entry}
              session={user}
              reactions={model.reactions[entry.id] ?? []}
              surface={surface}
              read={{
                enabled: entry.id === "own-1" || entry.id === "own-unread",
                count:
                  entry.id === "own-1"
                    ? model.scenario === "not-read"
                      ? "0"
                      : "3"
                    : entry.id === "own-unread"
                      ? "0"
                      : undefined,
                version: "1",
              }}
            />
          </Fragment>
        ))}
      </ul>
    </>
  );
};
