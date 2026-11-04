import type { Answer, ReplyContext, ReplyRecord } from '@rsvp/model/types';

const key = 'somewhere-design-rsvp-routing';
export const canonicalId = (id: string) => ['dinner','preview-dinner','demo-dinner'].includes(id) ? 'chat-dinner' : id === 'boardgame' ? 'board' : id;
export const readReplies = (): Record<string,ReplyRecord> => {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(key) ?? '{}');
    if (!parsed || typeof parsed !== 'object') { return {}; }
    return Object.fromEntries(Object.entries(parsed).filter((pair):pair is [string,ReplyRecord]=>{
      const item: unknown=pair[1];
      return !!item && typeof item==='object' && 'id' in item && typeof item.id==='string' && 'title' in item && typeof item.title==='string' && 'answer' in item && ['going','maybe','not_going'].includes(String(item.answer));
    }));
  } catch { return {}; }
};
export const readReply = (id: string) => readReplies()[canonicalId(id)];
export const readCurrentReply = () => readReply(sessionStorage.getItem(key+'-current') ?? 'chat-dinner');
export const clearReplies = () => {sessionStorage.removeItem(key);sessionStorage.removeItem(key+'-current');};
export const saveReply = (answer: Answer, context: ReplyContext) => {
  const record={...context,id:canonicalId(context.id),answer};
  sessionStorage.setItem(key+'-current',record.id);
  sessionStorage.setItem(key,JSON.stringify({...readReplies(),[record.id]:record}));
  return record;
};
