import { saveReply, canonicalId } from '@rsvp/model/replies';
import type { Answer, ReplyContext } from '@rsvp/model/types';

// Навигация только из подтверждённого локального ответа макета; не API клиента.
export const desktopDestination = (answer:Answer,context:ReplyContext) => {
  const meeting=encodeURIComponent(canonicalId(context.id));
  if(answer==='going'){ return `/desktop-chat-r4/preview.html?from=rsvp&meeting=${meeting}&title=${encodeURIComponent(context.title)}`; }
  if(answer==='maybe'){ return '/desktop-invitations-r2/preview.html?from=rsvp'; }
  return `/desktop-invite-r2/preview.html?state=declined&from=rsvp&meeting=${meeting}&title=${encodeURIComponent(context.title)}`;
};
export const navigateAfterReply = (answer:Answer,context:ReplyContext) => {
  saveReply(answer,context);
  const url=new URL(desktopDestination(answer,context),location.origin);
  if(answer==='going'){url.searchParams.set('response','confirmed');}
  location.replace(url.href);
};
