import { useCallback, useRef, useState } from 'react';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import { FeedRecord } from '@/widgets/conversation/ui/FeedRecord';
import { ConversationComposer } from '@/widgets/conversation/ui/ConversationComposer';
import { entries, session } from '@spike/model';
import styles from '@spike/Spike/Spike.module.css';
export const Spike = () => {
  const [data, setData] = useState(entries);
  const boundary = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const rangeExtractor = useCallback((range: Parameters<typeof defaultRangeExtractor>[0]) => [...new Set([...defaultRangeExtractor(range), ...(focused === null ? [] : [focused])])].sort((a, b) => a - b), [focused]);
  const virtual = useVirtualizer({ count: data.length, getScrollElement: () => boundary.current, estimateSize: () => 120, getItemKey: (index) => `alice:${data[index]!.clientRequestId}`, anchorTo: 'end', followOnAppend: false, scrollEndThreshold: -1, overscan: 10, rangeExtractor });
  virtual.shouldAdjustScrollPositionOnItemSizeChange = (item, _delta, instance) => item.end <= (instance.scrollOffset ?? 0);
  const surface = { boundary, mobile: false, panel: null, setPanel: () => undefined };
  return <div className={styles.container}>
    <div className={styles.scroller} ref={boundary} data-testid="virtual-scroller" onFocusCapture={(event) => { const index = event.target.closest('[data-index]')?.getAttribute('data-index'); if (index) { setFocused(Number(index)); } }}>
      <div className={styles.list} style={{ height: virtual.getTotalSize() }}>
        {virtual.getVirtualItems().map((item) => <div key={item.key} data-index={item.index} ref={virtual.measureElement} className={styles.row} style={{ transform: `translateY(${item.start}px)` }}><FeedRecord entry={data[item.index]!} session={session} reactions={[]} surface={surface} /></div>)}
      </div>
    </div>
    <button id="prepend" onClick={() => setData((previous) => [...Array.from({length: 50}, (_, index) => ({...entries[0]!, id: `older-${index}`, clientRequestId: `older-${index}`, text: `Older ${index}`})), ...previous].slice(0, 500))}>Prepend</button>
    <button id="resize" onClick={() => setData((previous) => previous.map((entry, index) => index === (virtual.range?.startIndex ?? 1) - 1 ? {...entry, text: entry.text + 'Late card resize. '.repeat(20)} : entry))}>Resize</button>
    <ConversationComposer id="meeting" session={session} surface={surface} />
  </div>;
};
