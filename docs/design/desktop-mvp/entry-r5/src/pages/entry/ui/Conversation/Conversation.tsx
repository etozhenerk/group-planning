import { Smile, Plus, ArrowUp } from "lucide-react";
import { DemoMessage, DemoAttachment } from "@prototype/entities/chat";
import styles from "@prototype/pages/entry/ui/Conversation/Conversation.module.css";

export const Conversation = () => (
  <section
    id="conversation"
    className={styles.section}
    aria-labelledby="chat-title"
  >
    <div className={styles.story}>
      <h2 id="chat-title">
        У каждой встречи
        <br />
        свой разговор.
      </h2>
      <p>
        После ответа «Приду» открывается общий чат. Переписка, фото и файлы
        остаются внутри встречи. Можно поставить реакцию или посмотреть, кто
        прочитал сообщение.
      </p>
    </div>
    <div
      className={styles.chat}
      role="img"
      aria-label="Чат Настолки у Саши: сообщение Лены, реакция, файл Правила игры.pdf от Лены и ответ Миши с подтверждением прочтения."
    >
      <div inert aria-hidden="true">
        <div className={styles.chatHead}>
          <img src="./boardgame.png" alt="" />
          <div>
            <strong>Настолки у Саши</strong>
            <span>7 ноября · 19:00 · 6 участников</span>
          </div>
        </div>
        <div className={styles.messages}>
          <ul>
            <DemoMessage
              name="Лена"
              photo="./avatars/lena.jpg"
              text="У меня новая игра. Беру?"
              time="18:42"
              reaction="👍"
              end={false}
            />
            <DemoAttachment
              name="Лена"
              photo="./avatars/lena.jpg"
              fileName="Правила игры.pdf"
              details="PDF · 2,4 МБ"
              time="18:42"
              start={false}
            />
            <DemoMessage
              own
              name="Миша"
              photo="./avatars/misha.jpg"
              text="Бери, пиццу закажу я"
              time="18:43"
            />
          </ul>
        </div>
        <div className={styles.composer}>
          <Plus size={20} />
          <span>
            Сообщение…
            <Smile size={21} />
          </span>
          <i>
            <ArrowUp size={20} />
          </i>
        </div>
      </div>
    </div>
  </section>
);
