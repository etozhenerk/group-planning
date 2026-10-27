# Устранение копирования memory snapshot

Кандидат: `b973b3f7b69392fe808a4b98975b51af7e76f1c7`.
База: `831934f7e2735c87071c6f2ef42437fc1767423b`.

Нагрузочное наблюдение root (`hot-run02`, memory.Store, 100 клиентов) показало
остановку hint delivery, 302 dispatcher errors и 537 MB heap. Это не SQL evidence.

## Причина и проверка

Каждый memory.Store.View копировал весь state под общим gate. Meeting hint вызывает
проверку доступа каждого подключённого участника; personal hints добавляют отдельные
проверки. При росте history/outbox эти копии исчерпывают общий 2s dispatcher deadline.
Update, lease, повтор и ACK сохраняют данные, но доставка отстаёт и backlog усиливает
стоимость каждого чтения. Производственная SQL-реализация не выполняет этот clone.

Изолированный Go1.27.2 probe на одном CPU, 2347 feed entries, 100 чтений Meeting:

| Pending hints | Прежний View | Allocated bytes | Новый View | Allocated bytes |
| --- | --- | --- | --- | --- |
| 0 | 21.316 ms, 100/100 | 54,943,184 | 0.051 ms, 100/100 | 5,584 |
| 50,000 | 1036.798 ms, 100/100 | 1,364,409,616 | 0.013 ms, 100/100 | 5,552 |
| 250,000 | 2117.688 ms, 23/100; deadline | 1,834,867,408 | 0.021 ms, 100/100 | 5,552 |

Чтение теперь держит pointer на неизменяемый committed state. Update продолжает
создавать private clone и публикует его только после успешного callback/context check.
Read methods возвращают detached значения. Дедлайны, batch, SQL и Publisher не менялись.

## Аудит Reader и регрессии

Проверены все Reader/Writer методы memory.transaction и вложенные DTO:

- Meeting StartsAt/PastAt; Feed payload/attachments; DatePoll options, ballots и
  nested OptionIDs, FinalEligible/Leaders/ClosedAt; PlacePoll ballots/eligible/ClosedAt;
  Task.Assignee; Cover.Data; ChatHint LeaseUntil/DispatchedAt копируются всеми
  соответствующими single/bulk Reader accessors.
- Остальные DTO состоят из значений; slices результатов создаются заново.
- Все Writer methods проверяют tx.check(true), включая вызов через type assertion.
- Состояние, опубликованное Update, более не мутируется: следующая запись работает
  с clone; старый read snapshot сохраняется до завершения callback, retained tx закрыт.

Новые regression мутируют вложенные карты/срезы/указатели семи семейств одновременно
с commit и проверяют старый snapshot, новый snapshot и запрет Writer assertion.
Allocation guard на 10k history + 10k hints проходит на кандидате; контрольный запуск
на прежнем View намеренно падает: 20,119 allocations при максимуме 20.

Targeted и полный `go test -race -count=1 ./...`, format/gofmt, vet, build прошли.
`git diff --check` прошёл. Полный 100-connection capacity повтор и независимая
приёмка точного кандидата остаются отдельной работой root. Микроизмерения не дают
release pass и не доказывают SQL/production capacity.

Raw: baseline.log, immutable-view.log, immutable-view-race.log,
old-view-regression.log; probe — backend/internal/storage/memory/capacity_clone_probe_test.go.
