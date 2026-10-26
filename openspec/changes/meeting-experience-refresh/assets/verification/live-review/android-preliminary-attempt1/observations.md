# Предварительные наблюдения Android

Источник — сохранённые изображения implementer experience9-attempt1. Reviewer
лично просмотрел пять PNG из inventory.json, но не запускал этот native сценарий.
Source hash этого прогона не предоставлен. Финальный pass по ним не выставляется.
Capture metadata честно сохранена: Android 16/API36, 720×1600px, 360×800dp,
density2, Europe/Moscow, **en-US**; large text fontScale≈1.8. Locale отличается
от целевой ru-RU и требует реального исправления окружения перед повтором.

- Три large-text кадра date/place/task: видны полный заголовок и крестик;
  после прокрутки CTA целиком внутри экрана. Это положительное визуальное
  наблюдение, не подтверждение всех жестов и native действий.
- `sheet-meeting-information-no-service-links.png`: нет названия встречи,
  крестика и действия «Пригласить друзей»; фон background вместо surface.
  Тест снимает сразу после открытия, без scroll. InvitationConversation.kt
  задаёт `showTitle=false`, `containerColor=Palette.background` и не добавляет
  close/share. Raw `meeting-details.html` сохраняет название/приглашение;
  `chat-actions.md` задаёт surface и видимый X. Latest UX убирает только
  сервисные ссылки из этой панели. Замечание передано root.
- `design-action-place-keyboard.png`: видна узкая floating IME toolbar слева,
  полноценной клавиатуры с буквами нет. Это старый ExperienceUiTests capture,
  не новый sheet-ime сценарий. Не принимается как keyboard pass. Новый runner
  должен проверять реальные IME bounds/keys и сохранить их в actual image.

Шрифты sidecar измеряют платформенный default на представительной строке через
TextRunShaper (Roboto-Regular.ttf, NotoColorEmoji), а не каждый glyph снимка.
Эта граница достоверности сохранена; имя семейства не выдумано из CSS/токенов.
