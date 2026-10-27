import type { ConversationSurface } from '@/widgets/conversation/model/useConversationSurface';

export const useEntrySurface = (surface: ConversationSurface, id: string) => ({
  active: surface.panel === `reaction:${id}`,
  change: (open: boolean) =>
    surface.setPanel((current) =>
      open ? `reaction:${id}` : current === `reaction:${id}` ? null : current,
    ),
  readers: {
    open: surface.panel === `readers:${id}`,
    show: () => surface.setPanel(`readers:${id}`),
    close: () =>
      surface.setPanel((current) => (current === `readers:${id}` ? null : current)),
  },
  people: {
    open: surface.panel === `people:${id}`,
    show: () => surface.setPanel(`people:${id}`),
    close: () =>
      surface.setPanel((current) => (current === `people:${id}` ? null : current)),
  },
});
