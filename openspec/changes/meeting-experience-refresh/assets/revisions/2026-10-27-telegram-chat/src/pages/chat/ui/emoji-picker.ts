import {
  categories,
  emojiName,
  filterEmoji,
} from "@prototype/pages/chat/model/emoji";
import { type PrototypeState } from "@prototype/pages/chat/model/model";
import { escapeHtml, icon, iconButton } from "@prototype/shared/lib/dom";

export const emojiResults = (
  state: PrototypeState,
  reaction = false,
): string => {
  const category = reaction
    ? (state.reaction?.category ?? "recent")
    : state.emojiCategory;
  const query = reaction ? (state.reaction?.query ?? "") : state.emojiQuery;
  const values = filterEmoji(category, query, state.recent);
  const selected =
    state.messages.find((message) => message.id === state.reaction?.messageId)
      ?.reactions ?? {};

  if (!values.length) {
    return `<div class="emoji-empty">${icon("search")}<strong>Эмодзи не найдены</strong><span>Попробуйте другое слово</span><button type="button" data-action="clear-emoji-search" data-mode="${reaction ? "reaction" : "composer"}">Очистить поиск</button></div>`;
  }

  return `<div class="emoji-category-label">${query ? "Результаты поиска" : categories.find((item) => item.id === category)?.label}</div><div class="emoji-grid">${values.map((emoji) => `<button type="button" class="emoji-choice ${reaction && selected[emoji.value]?.includes(state.user) ? "is-selected" : ""}" data-action="${reaction ? "pick-reaction" : "insert-emoji"}" data-emoji="${emoji.value}" aria-label="${reaction ? (selected[emoji.value]?.includes(state.user) ? "Снять реакцию" : "Поставить реакцию") : "Вставить"}: ${escapeHtml(emoji.name)}" ${reaction ? `aria-pressed="${Boolean(selected[emoji.value]?.includes(state.user))}"` : ""}>${emoji.value}</button>`).join("")}</div>`;
};

export const emojiPicker = (
  state: PrototypeState,
  reaction = false,
): string => {
  const category = reaction
    ? (state.reaction?.category ?? "recent")
    : state.emojiCategory;
  const query = reaction ? (state.reaction?.query ?? "") : state.emojiQuery;
  const mode = reaction ? "reaction" : "composer";

  return `<div class="emoji-toolbar"><label class="emoji-search">${icon("search")}<input type="search" placeholder="Поиск эмодзи" aria-label="Поиск эмодзи по русскому названию" data-emoji-search="${mode}" value="${escapeHtml(query)}" autocomplete="off"></label>${reaction ? iconButton("close-reaction", "Закрыть реакции", "close") : iconButton("emoji-backspace", "Удалить символ перед курсором сообщения", "backspace")}</div>
    <div class="emoji-categories" role="group" aria-label="Категории эмодзи">${categories.map((item) => `<button type="button" data-action="emoji-category" data-category="${item.id}" data-mode="${mode}" aria-label="${item.label}" aria-pressed="${item.id === category && !query}" class="${item.id === category && !query ? "active" : ""}">${item.icon}</button>`).join("")}</div>
    <div class="emoji-results" data-emoji-results="${mode}">${emojiResults(state, reaction)}</div>`;
};

export const reactionPicker = (state: PrototypeState): string => {
  if (!state.reaction) {
    return "";
  }

  const message = state.messages.find(
    (item) => item.id === state.reaction?.messageId,
  );

  return `<section class="reaction-picker ${state.reaction.expanded ? "expanded" : ""}" role="dialog" aria-label="Реакции на выбранное сообщение">
    ${state.reaction.expanded ? `<div class="reaction-context"><span>Реакция на сообщение</span><p>${escapeHtml(message?.text ?? "")}</p></div>${emojiPicker(state, true)}` : `<div class="quick-reactions">${["❤️", "👍", "😂", "🔥", "🎉"].map((emoji) => `<button type="button" class="emoji-choice ${message?.reactions[emoji]?.includes(state.user) ? "is-selected" : ""}" data-action="pick-reaction" data-emoji="${emoji}" aria-label="${message?.reactions[emoji]?.includes(state.user) ? "Снять" : "Поставить"} реакцию: ${emojiName(emoji)}" aria-pressed="${Boolean(message?.reactions[emoji]?.includes(state.user))}">${emoji}</button>`).join("")}${iconButton("expand-reaction", "Ещё реакции", "down")}</div>`}
  </section>`;
};
