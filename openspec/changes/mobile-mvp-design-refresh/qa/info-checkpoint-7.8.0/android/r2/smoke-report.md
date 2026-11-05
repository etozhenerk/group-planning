# Android Info DS7.8 r2: targeted facts/company/canonical

Вердикт: **needs-fixes** — один оставшийся typography gap. Функциональный targeted smoke **OK1test9.561с**, включая требуемую цепочку в одной Activity/session. Это не финальная приёмка; общие flows/owner/share/settings/матрицы/gates не повторялись.

Exact frozen APK SHA256 `d0d65281b0b46f88d56a5384979572e9347c5c8aa627e14f7e4d82082daf092d`, source `1d0ab00f089fce7c74291867b1f472b666b3616df942ca9529f09d08ca6bb0d9`. Байты подтверждены до/после (`review-binding.json`, `installed-after.json`). Только5554/API36,360×800dp и320×640dp/font1, один собственный существующий memory fixture. Реальные API-предусловия:7 ответов,5Going, три visible chips и+2.

**[P2] «Все ответы» осталось Material TextButton14/20, а опубликовано12/18.** Actual TextLayout:14sp, lineHeight20sp, weight500; [actual360](actual/company360.png), [320](actual/company320.png), точные значения `actual/result.json.allResponses`. Нормализованный принятый raw имеет12px/18px/400 (`reference/company-style.json`, [reference](reference/company360.png)); контракт docs/design/components/mobile-mvp.md «Компания7.8» явно закрепляет12/18. `InvitationParticipants.kt:88` не задаёт тексту fontSize/lineHeight, наследуя Material defaults. Нативный target48 сохраняется отдельно и не требует увеличивать опубликованную typography. Других наблюдаемых замечаний этого targeted объёма нет.

Исправления подтверждены:

- Facts при коротком месте заполняет body: x40–680px при720px экране, вместо прежнего shrink. [Actual](actual/facts360.png), `facts360px` в result.
- Компания: heading16sp/600, chips36dp, correct compact layout/avatars fallback, count5 и+2, «Все ответы·7», реальный expand/collapse. Chip bounds: y1186–1258px=36dp, промежуток4px соответствует effective gap6−overlap4. Состав и закреплённый member-footer доступны на320normal. Typography ссылки отмечена выше.
- **В той же сессии:** info→изменить→подтверждённый Going→чат с удалённой info; повторно открыть info→изменить→Maybe→выбранные «Приглашения»/реальная карточка, private chat/info отсутствуют. [Going](actual/going-chat.png), [Maybe](actual/maybe-invitations.png). Activity не пересоздавалась между ответами, precondition/role не сбрасывались. Действия и timestamps — `actual/result.json`, driver — `InfoTarget78.kt`, журнал — `smoke.log`.

Actual screenshots/capture metadata/semantics свежие; raw refs/URL/time/computed style в reference/. Исторические pass не переносились, pixel regression не заявляется. Фотоаватары/cover/error states/large/RM и остальные routes здесь не принимались. VoiceOver/TalkBack/карты не запускались.

Cleanup restored=true: wm/font/settings восстановлены, own fixture/reverse/remote/private config удалены, QA-процесс остановлен (`cleanup.json`); root fixtures не затронуты.5554 свободен. Код/manifests/tasks/Git не менялись.
