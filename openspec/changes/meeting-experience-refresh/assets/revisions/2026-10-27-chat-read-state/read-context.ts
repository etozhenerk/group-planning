import { createState } from "@prototype/pages/chat/model/model";
import { reactionPicker } from "@prototype/pages/chat/ui/emoji-picker";
import { renderMessages } from "@prototype/pages/chat/ui/conversation";

export const installReadContext = (openReaders: (target: HTMLElement) => void, initiallyOpen: boolean): void => {
  const state = createState();
  const bubble = document.querySelector<HTMLElement>('[data-bubble="m2"]')!;
  const host = document.querySelector<HTMLElement>('#reaction-host')!;
  const conversation = document.querySelector<HTMLElement>('#conversation')!;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let exit: ReturnType<typeof setTimeout> | undefined;
  let start = { x: 0, y: 0 };
  let held = false;
  const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
  const position = () => {
    const rect = bubble.getBoundingClientRect();
    const bounds = conversation.getBoundingClientRect();
    host.style.setProperty('--reaction-space', `${Math.max(160, bounds.height - 24)}px`);
    host.style.left = `${Math.max(bounds.left + 8, Math.min(rect.left, bounds.right - host.offsetWidth - 8))}px`;
    const above = rect.top - host.offsetHeight - 8;
    host.style.top = `${Math.max(bounds.top + 4, Math.min(above >= bounds.top + 4 ? above : rect.bottom + 8, bounds.bottom - host.offsetHeight - 8))}px`;
  };
  const close = (next?: () => void) => {
    clearTimeout(exit);
    host.classList.add('is-closing');
    host.inert = true;
    bubble.classList.remove('reaction-target');
    exit = setTimeout(() => {
      host.hidden = true;
      host.inert = false;
      host.classList.remove('is-closing');
      bubble.focus({ preventScroll: true });
      next?.();
    }, reduced() ? 0 : 150);
  };
  const render = () => {
    host.innerHTML = reactionPicker(state);
    const picker = host.querySelector<HTMLElement>('.reaction-picker')!;
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'read-context-action';
    action.textContent = 'Кто прочитал';
    action.setAttribute('aria-haspopup', 'dialog');
    action.addEventListener('click', () => close(() => openReaders(bubble)));
    picker.append(action);
    position();
  };
  const show = () => {
    clearTimeout(exit);
    state.reaction = { messageId: 'm2', expanded: false, category: 'recent', query: '' };
    host.classList.remove('is-closing');
    host.inert = false;
    host.hidden = false;
    bubble.classList.add('reaction-target');
    render();
    host.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  };
  host.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
    if (!button || !state.reaction) return;
    if (button.dataset.action === 'expand-reaction') {
      state.reaction.expanded = true;render();return;
    }
    if (button.dataset.action === 'close-reaction') { close();return; }
    if (button.dataset.action === 'emoji-category') {
      state.reaction.category = button.dataset.category ?? 'recent';state.reaction.query = '';render();return;
    }
    if (button.dataset.action === 'pick-reaction' && button.dataset.emoji) {
      const message = state.messages[1]!;
      const emoji = button.dataset.emoji;
      const people = message.reactions[emoji] ?? [];
      message.reactions[emoji] = people.includes(state.user) ? people.filter(person => person !== state.user) : [...people, state.user];
      const copy = document.createElement('div');copy.innerHTML = renderMessages(state);
      document.querySelector('[data-message="m2"] .message-bottom')?.replaceWith(copy.querySelector('[data-message="m2"] .message-bottom')!);
      close();
    }
  });
  host.addEventListener('input', event => {
    const input = event.target as HTMLInputElement;
    if (!input.matches('[data-emoji-search]') || !state.reaction) return;
    state.reaction.query = input.value;render();
    const next = host.querySelector<HTMLInputElement>('[data-emoji-search]');next?.focus();
  });
  bubble.setAttribute('aria-label', `${bubble.textContent}. Действия сообщения`);
  bubble.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    held = false;start = { x: event.clientX, y: event.clientY };
    timer = setTimeout(() => { held = true;show(); }, 450);
  });
  document.addEventListener('pointermove', event => { if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) clearTimeout(timer); });
  for (const name of ['pointerup', 'pointercancel']) document.addEventListener(name, () => clearTimeout(timer));
  bubble.addEventListener('contextmenu', event => { event.preventDefault();clearTimeout(timer);show(); });
  bubble.addEventListener('click', event => { if (held) { event.preventDefault();held = false; } });
  bubble.addEventListener('keydown', event => {
    if (['Enter', ' ', 'ContextMenu'].includes(event.key) || (event.shiftKey && event.key === 'F10')) { event.preventDefault();show(); }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !host.hidden) { event.preventDefault();close(); } });
  document.addEventListener('pointerdown', event => { if (!host.hidden && !host.contains(event.target as Node) && !bubble.contains(event.target as Node)) close(); });
  window.addEventListener('resize', () => { if (!host.hidden) position(); });
  if (initiallyOpen) requestAnimationFrame(show);
};
