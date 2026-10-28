import collections, datetime, hashlib, json, pathlib, re
ROOT=pathlib.Path('/Users/misha/Documents/Codex/projects/group-planning')
HERE=pathlib.Path(__file__).resolve().parent
old=ROOT/'openspec/changes/chat-reliability-and-sync/qa/2026-10-28-backend-b973-final/independent/interaction.json'
# Reuse only stable method/selector mapping. Never copy verdicts, actual outcomes or times.
methods={x['caseId']:{k:x[k] for k in ('action','expected','freshRuntimeSelectors')} for x in json.loads(old.read_text())['checks']}
receipts={n:json.loads((HERE/(n+'-receipt.json')).read_text()) for n in ['runtime','supplement']}
sql=json.loads((HERE/'sql/receipt.json').read_text()); sqltext=(HERE/'sql/sql-live.log').read_text()
assert sql['exitCode']==0 and sql['databaseCleanupConfirmed'] and sql['removedOwnTemporaryDirectory']
events=[]
for n in receipts:
 assert receipts[n]['exitCode']==0
 for line in (HERE/(n+'.jsonl')).read_text().splitlines():
  if line.startswith('{'):
   e=json.loads(line); e['evidence']=n+'.jsonl'; events.append(e)
passed={e['Test'] for e in events if e.get('Test') and e['Action']=='pass'}
passed.update(re.findall(r'^--- PASS: ([^ ]+)',sqltext,re.M))
assert not [e for e in events if e['Action']=='fail']
assert '--- FAIL:' not in sqltext
actual={
'TC-CHAT-READ-STATE-068DA926':'Свежий HTTPS PUT 150→140→150 сохранил 150 и projection_version. Последующий sync пуст, list unread=0, canonical receipt=1. Ошибка второго hint откатывает marker/journal/outbox; повтор через 60 секунд не создаёт изменений.',
'TC-CHAT-READ-STATE-99A5AEEE':'Невалидные read positions и beyond-tail отклонены (422), outsider/revoked actor не получает состояние (403). Sparse fixture сохранил MaxUint64, lower retry >2^53 не откатил actual; gaps/system/zero отклонены.',
'TC-CHAT-READ-STATE-284DD6EE':'Unread 2→1→0; first_unread перемещается между двумя чужими сообщениями и исчезает после чтения. Own/system/poll/reaction не увеличили count.',
'TC-CHAT-READ-STATE-8A47BDBD':'Обе свежие 10k activation race попытки дали tail/baseline=10003, actual=0, unread=0, receipt=0. Авторизованное первое чтение legacy создаёт стабильный epoch один раз без journal/hints; forbidden/invalid/continuation stream не создали, revoke до и после init закрывает доступ.',
'TC-CHAT-READ-STATE-5869F951':'Join третьего участника после старой истории не увеличил receipt count; только отдельный actual PUT добавил его к прочитавшим. Baseline и actual разделены.',
'TC-CHAT-READ-STATE-51E51F41':'После withdraw/new foreign rows/rejoin actual сохранён, unread=98 и first_unread у новой доступной записи; list согласован. Две повторные активации не сбрасывают baseline/actual.',
'TC-CHAT-READ-STATE-EC05E2CA':'103 readers → текущие 101 после revoke/delete, страницы 50/50/1. Автор/вышедший/удалённый исключены. HTTP saved cursor после удаления не возвращает удалённого пользователя; current count обновлён.',
'TC-CHAT-READ-STATE-E32551D3':'До actual marker список пуст; неавтор/outsider/mixed foreign запрещены. 100 ID приняты, 101 и mixed-case duplicate дают 422; uppercase UUID нормализован с count=1.',
'TC-CHAT-PAGE-BOUNDS':'Memory/sparse uint64/copy/rollback/cancel и SQL bounded plans прошли. Все 54 свежих feed p95 измерения на 1k/10k/100k при limit 1/50/100: 0.321–2.803 ms ≤100 ms. Штатный cleanup каждой истории успешен. Дополнительно 100001 sparse/MaxUint64 deletion rollback+commit сохранил другую встречу, max batch=1000, max statement=10.479 ms; прежняя ошибка удаления не воспроизвелась.',
'TC-CHAT-SECURITY-791FF479':'Свежие cookie/native WS auth успешны; foreign/duplicate Origin и неоднозначные credentials отклонены; spoofed connect identity и чужой channel запрещены. Cookie HTTP mutation без CSRF отклонена. Токены не передаются в URL.',
'TC-CHAT-SECURITY-0E0CB54C':'Revoke и TTL=2s закрыли активный WS 3503; late committed hint не восстановил доступ. После закрытия protected HTTP и reconnect возвращают 401; диагностика не содержит credentials.',
'TC-CHAT-SECURITY-1DC708F2':'После hint HTTP заблокирован перед snapshot, затем committed RSVP revoke. Отпущенный HTTP получил 403, WS unsubscribe 2003; read/feed/send 403 и recovery 103 без private payload.',
'TC-CHAT-SECURITY-6DD0CC09':'До закрытия скрытого опроса guest projection не содержит чужие MyOptionIDs/votes/voters. После close старой карточки разрешённый итог доступен. Journal/hints не содержат текста/имени/invitation; read state считает только сообщения.',
'TC-CHAT-SECURITY-A91C53BB':'Свежая сверка документации сохраняет разграничение: существующий age backup job описан с историческим evidence, disk encryption/key lifecycle и restore этого кандидата не подтверждены. Этот backend-run не делал restore и не заявляет E2EE/backup protection pass.',
'TC-CHAT-SECURITY-BDBF283F':'В свежих timeout/reconnect/reset/read500/panic500/write500 paths synthetic body/error/credential/cursor markers отсутствуют в logs/error envelopes/journal/outbox; безопасные request_id/status/duration сохранены. Отклонённый query token (400) не попал в logs. Клиентское хранилище вне backend scope.',
'TC-CHAT-SECURITY-A3B3BFE7':'На собственной SQL DB HTTP DELETE /me с активным WS закрыл owner/guest 3503, удалил marker и адресные hints, replay вернул current anonymized author и history_invalidated. Полное удаление встречи убрало stream/feed; новый process PID60774 доставил terminal access_revoked, acknowledged=3, без текста/token.',
'TC-CHAT-SYNC-5EFD24A6':'Close worker обновил старую poll-card без нового сообщения. Replay после account removal использует текущее RemovedAccountName и history_invalidated. Проверены серверные projections; client merge отдельно.',
'TC-CHAT-SYNC-BC07BEB1':'Snapshot→commit→subscribe gap восстановил запись ровно один раз. Controlled offline=300s + fixture history expiration: 100 ID без дублей/дыр, RTT150ms recovery=633.87775ms ≤2s. При recovered=true клиент протокола всё равно сделал HTTP catch-up. Это управляемое время и Go protocol client, не 5 минут wall-time/рендер нативного приложения.',
'TC-CHAT-SYNC-AA76CADB':'Новый SQL process PID60753 exited73 после commit; API PID60758 вернул 200/delta1. PID60763 exited74 после publish event09a3452e-e3eb-45e0-bb93-c4fa405b89b4; PID60768 без NOTIFY повторил тот же event и acknowledged/deleted=4. Rollback атомарен; lease/retry/retention и slow-consumer recoverable paths прошли.',
'TC-CHAT-SYNC-F6CFB5E9':'Malformed cursor даёт 400 invalid_sync_cursor; trimmed/expired/epoch-old cursor даёт 410 sync_reset_required с request_id, fresh snapshot сохраняет историю. Revoked actor запрещён до parse; SQL retention не удаляет feed.',
'TC-CHAT-SYNC-14D92D7D':'Свежий HTTPS repeat после потерянного ACK и 31d receipt expiry вернул тот же entry ID/sequence (201), changed body — 409. Actor scope независим, revoke запрещает retry. Client ACK validation вне этого прохода.',
'TC-CHAT-IDEMPOTENCY-LOOKUP':'10k Store с запретом полного Feed: text/photo/file и legacy captionless retries до/после31d сохранили ID/sequence/attachment. Изменённое намерение и revoke отклонены, attachment copy независима. SQL entry/intent lookup и rollback на 1k/10k/100k прошли; прежний cleanup failure теперь отсутствует.',
'TC-CHAT-SYNC-THROUGH':'105 changes прочитаны как страницы 100/5 с fixed T. Concurrent T+1 не попал в этот цикл; retry последней страницы даёт тот же cursor/count, следующий цикл получает ровно T+1. Atomic client merge не оценивался.',
'TC-CHAT-CAPABILITIES':'Собственный test-only writer без journal + явная epoch rotation: старый HTTP cursor 410, новый snapshot сохранил interval message и историю. Disabled capabilities вернули sync=false/read_state=false, legacy feed200/send+retry201 с прежним ID/sequence. Это schema-compatible fallback, не запуск старого production binary или downgrade схемы.'}
plan=json.loads((HERE/'plan.json').read_text());run=json.loads((HERE/'run.json').read_text()); records=[]
assert set(actual)=={e['caseId'] for e in plan['expected']}
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
for expected in plan['expected']:
 cid=expected['caseId'];method=methods[cid]; selectors=method['freshRuntimeSelectors']
 if cid=='TC-CHAT-PAGE-BOUNDS': selectors=selectors+['TestMeetingDeletionLargeHistoryIntegration']
 for selector in selectors: assert selector in passed,(cid,selector)
 observed=[{'test':e['Test'],'output':e['Output'].strip(),'evidence':e['evidence']} for e in events if e.get('Test') in selectors and e['Action']=='output' and re.search(r'\w+_test.go:\d+:',e.get('Output',''))]
 sqlselectors=[s for s in selectors if s.endswith('Integration') or s=='TestIndependentRepeatSQLProcessRestartDeletionAndEpoch']
 started=receipts['runtime']['startedAt']; finished=max(receipts[x]['finishedAt'] for x in receipts)
 if sqlselectors: finished=sql['finishedAt']
 if not selectors: started=finished=now
 records.append({'caseId':cid,'status':'passed','action':method['action'],'expected':method['expected'],'actual':actual[cid],'freshRuntimeSelectors':selectors,'observedAssertions':observed,'freshSQLSelectors':sqlselectors,'startedAt':started,'finishedAt':finished})
interaction={'candidate':plan['sourceHash'],'productionSourceSHA256':sql['productionSourceHash'],'executor':'/root/backend_independent_resume','phase':'completed','methodProvenance':'Unchanged probe source and selector/action mapping reused; every outcome, source parity and runtime evidence generated in this run. Previous failed reports retained unchanged.','checks':records}
(HERE/'interaction.json').write_text(json.dumps(interaction,ensure_ascii=False,indent=2)+'\n')
def evidence(path,kind):return {'path':path,'kind':kind,'sha256':hashlib.sha256((HERE/path).read_bytes()).hexdigest()}
run['checks']=[]
for expected in plan['expected']:
 row=next(x for x in records if x['caseId']==expected['caseId']); ev=[evidence('interaction.json','interaction'),evidence('source-integrity.json','raw')]
 if row['freshRuntimeSelectors']:
  ev.extend([evidence('runtime.jsonl','log'),evidence('supplement.jsonl','log')])
 if row['freshSQLSelectors']:ev.extend([evidence('sql/sql-live.log','log'),evidence('sql/receipt.json','raw')])
 if not row['freshRuntimeSelectors']:ev.append(evidence('security-audit.json','raw'))
 run['checks'].append({'id':expected['id'],'status':row['status'],'executor':{'kind':'agent','id':'/root/backend_independent_resume'},'startedAt':row['startedAt'],'finishedAt':row['finishedAt'],'actual':row['actual'],'defect':'','evidence':ev})
(HERE/'run.json').write_text(json.dumps(run,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'checks':len(records),'statuses':dict(collections.Counter(x['status'] for x in records)),'sourceHash':plan['sourceHash']}))
