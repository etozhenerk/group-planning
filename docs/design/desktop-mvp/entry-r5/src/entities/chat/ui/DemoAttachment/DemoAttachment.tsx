import { MessageBubble, MessageRow, FileContent } from "@message/entities/chat";
import { Avatar } from "@/shared/ui/Avatar";
import message from "@prototype/entities/chat/ui/DemoMessage/DemoMessage.module.css";

export type DemoAttachmentProps = {
  name: string;
  photo: string;
  fileName: string;
  details: string;
  time: string;
  start?: boolean;
  end?: boolean;
};

export const DemoAttachment = ({
  name,
  photo,
  fileName,
  details,
  time,
  start = true,
  end = true,
}: DemoAttachmentProps) => (
  <MessageRow
    start={start}
    end={end}
    avatar={<Avatar name={name} src={photo} size="mobile-chat" />}
  >
    <MessageBubble
      author={name}
      media
      file
      start={start}
      end={end}
      metadata={
        <span className={message.meta}>
          <time>{time}</time>
        </span>
      }
    >
      <FileContent name={fileName} details={details} />
    </MessageBubble>
  </MessageRow>
);
