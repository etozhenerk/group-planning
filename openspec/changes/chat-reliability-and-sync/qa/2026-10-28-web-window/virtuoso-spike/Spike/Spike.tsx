import { useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { FeedRecord } from '@/widgets/conversation/ui/FeedRecord';
import { entries, session } from '@spike/model';
import styles from '@spike/Spike/Spike.module.css';
export const Spike = () => {
  const boundary = useRef<HTMLDivElement>(null);
  return <div className={styles.container}>
    <Virtuoso style={{ height: '100%' }} data={entries} computeItemKey={(_, entry) => `${entry.actor.id}:${entry.clientRequestId}`} increaseViewportBy={{ top: 1000, bottom: 1000 }} itemContent={(_, entry) => <FeedRecord entry={entry} session={session} reactions={[]} surface={{ boundary, mobile: false, panel: null, setPanel: () => undefined }} />} />
  </div>;
};
