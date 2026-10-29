# Независимый web-проход · keyboard outside · 29.10.2026

Ревьюер: /root/web_keyboard_review; исполнитель продукта — другой агент.
Область: TC-CHAT-OUTSIDE-KEYBOARD, screen chat-keyboard-outside-web, design 5.0.0.
Raw-источники: последний раздел chat-actions.md, UX 5.0.0, сценарий «Нажатие вне сообщения и продолжение действия», testing/cases/chat-composition.yaml.

Порядок: общий freeze → design context → отдельная синтетическая встреча через UI → desktop1280×720 →390×844 →320×740 → контроль bundle/context → отчёт.
Только CUA управляет UI; read-only DOM используется для activeElement, selection, viewport и геометрии. Browser capabilities viewport временно меняют размер; в конце reset.

На каждой ширине проверяются фон, история, шапка, первый click Send/плюс/emoji, draft/selection, форма и другое поле, поиск emoji, explicit refocus и scroll. Desktop отдельно Tab/Enter/Escape и context menu. Длительный mouse press проверяется отдельно; он не доказывает touch long press. Настоящая mobile OS IME остаётся недоступной.

Независимый проход не подменяет общие qa:ready/design:ready. Формальный feature-plan/run агрегирует root после получения фактического окружения. Предоставленные автором web:check и 6 targeted E2E — вспомогательные результаты с отдельным происхождением.
