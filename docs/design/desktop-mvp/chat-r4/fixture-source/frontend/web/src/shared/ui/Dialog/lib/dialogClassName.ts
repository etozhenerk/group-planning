import styles from '@/shared/ui/Dialog/Dialog.module.css';

export const dialogClassName = (layout: {
  contained: boolean;
  inline: boolean;
  tablet: boolean;
  desktopPage: boolean;
  chatAction: boolean;
}) =>
  [
    styles.dialog,
    layout.contained ? styles.contained : '',
    layout.inline ? styles.page : '',
    layout.tablet ? styles.tablet : '',
    layout.desktopPage ? styles.action : '',
    layout.chatAction ? styles['chat-action'] : '',
  ]
    .filter(Boolean)
    .join(' ');
