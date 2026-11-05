import { ChatIcon } from '@/shared/ui/ChatIcon';
import { designTokens } from '@/shared/config/design-tokens';

export type SendMessageSubmitProps = {
  mobile: boolean;
  disabled: boolean;
  className: string;
};

export const SendMessageSubmit = ({
  mobile,
  disabled,
  className,
}: SendMessageSubmitProps) => (
  <button
    type="submit"
    className={className}
    aria-label="Отправить сообщение"
    disabled={disabled}
  >
    <ChatIcon
      name={mobile ? 'sendUp' : 'send'}
      aria-hidden="true"
      size={
        mobile
          ? designTokens.componentMobileChatSendIconSize
          : designTokens.componentMobileChatIconSize
      }
    />
  </button>
);
