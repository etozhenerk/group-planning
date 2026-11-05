# Create web 7.6.0 r2 — targeted C2/C3/C4

Остался один конкретный дефект C3 на320: Date выходит за свою колонку и почти соприкасается с полем времени. C2 и C4 исправлены в проверенном объёме. Это ограниченный checkpoint frozen-кандидата, не финальная приёмка manifest/задачи.

Кандидат: `candidate.json`, source `e7e96c7755688255123120bf7891bdcd997e272d1f68648621c767879c38d89f`, artifact `6b26035218962a3b8937c74a84a07d0630e9acd5b7fc486f78fbcbfcf54044d5`, стенд8894. Source до/после одинаковый и совпадает с кандидатом. Привязка261 disk files и40 live assets совпала; HTML допускает backend metadata transforms (`artifact-binding.json`).

## Единственный остаточный finding

**C3 · P2 · Date на320 переполняет колонку.** В empty и validation кнопка Date имеет x20,width145.28,right165.28; input времени начинается x168 — между кнопкой и внутренним input только2.72px, рамки практически соприкасаются. В approved reference Date width133.28,right153.28, до того же input14.72px. На390 width168 соответствует колонке, дефекта нет. Исправить сжатие значения/иконки внутри доступной ширины, сохранив принятый размер текста и minimum-height. Evidence: `empty-320-{actual,reference}.png`, `validation-320-{actual,reference}.png`, координаты `targeted-probes.json`.

## Подтверждённые исправления

- C2: на320/390 обложка86×86, card padding14, surface/border и расположение действий соответствуют ref; подпись «необязательно». Реальный PNG прошёл существующий worker, появился preview; «Убрать фото» удаляет preview. Brand визуально скрыт на мобильном Create. В probe `brand=true` означает наличие скрытого desktop brand в DOM, а не его видимость; actual screenshots подтверждают отсутствие brand-ряда. Заголовок/легенда и approved placeholder «Ужин в пятницу» перенесены. Разница6px по вертикальной позиции whole-screen header не считается новым существенным дефектом: platform/environment inset не копируется из декоративного Phone.
- C3: исходный validation-сдвиг устранён на320/390 — Date50px и Time48px имеют одинаковый вертикальный центр. Date font16/border/radius13 перенесены. Остался только описанный выше narrow-width overflow.
- C4: Chromium390×430 после resize и прокрутки формы вниз: popup x22,y24,w346,h398,bottom422 в пределах viewport430. «Готово» изначально находится в прокручиваемой части; после внутренней прокрутки y366..410, доступно для настоящего click. Выбрано06.11.2026, popup закрыт, дата отражена в форме, focus возвращён Date. WebKit390×430: те же bounds и доступное «Готово», click закрывает popup.
- Desktop1100: actual form и inputs совпали с historical8878; form x359,y189.09,w604,h658.25,padding26. Desktop placeholder сохранён историческим.

Driver: `targeted.mjs`, 12 наблюдений, ошибок нет; `targeted-probes.json`/`targeted.stdout.raw`. Fresh actual/ref PNG и их SHA — `evidence-sha256.json`. Fixture sign-in использован только для подготовки сессии, OAuth не проверялся. LostACK/dirty/create/RSVP, прежние suites, матрицы и gates не повторялись. Встречи не создавались. App/manifests/tasks/Git не изменялись; `git diff --check` чистый. Архивов и новых упаковок нет.
