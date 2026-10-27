import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import YAML from 'yaml';
import {validate} from '../../../../../../scripts/testing/schema.mjs';
import {hashPlan} from '../../../../../../scripts/testing/plan.mjs';

const base=path.dirname(new URL(import.meta.url).pathname);
const runRoot=path.dirname(base);
const plan=JSON.parse(fs.readFileSync(path.join(runRoot,'plan.json')));
const command=JSON.parse(fs.readFileSync(path.join(base,'run03/command.json')));
const contract=JSON.parse(fs.readFileSync(path.join(base,'openapi-run03.json')));
const before=JSON.parse(fs.readFileSync(path.join(base,'before.json')));
const after=JSON.parse(fs.readFileSync(path.join(base,'after.json')));
const raw=fs.readFileSync(path.join(base,'run03/raw.jsonl'),'utf8').trim().split('\n').map(line=>JSON.parse(line));
const passing=new Set(raw.filter(e=>e.Action==='pass'&&e.Test).map(e=>e.Test));
const cases=['meeting-experience-api','user-profile','support-feedback'].flatMap(file=>YAML.parse(fs.readFileSync(`testing/cases/${file}.yaml`,'utf8')));
const hashFile=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const evidence=(file,kind)=>({path:path.relative(runRoot,path.join(base,file)),sha256:hashFile(path.join(base,file)),kind});
const definitions={
 'TC-API-PROFILE-PRIVACY':{
  tests:['TestIndependentPrivacy','TestIndependentProfileSynchronization/full_and_repeated_login'],
  actual:[
   'Собственный профиль прочитан по Cookie и после native PKCE/handoff exchange по Bearer: тела совпали; анонимно 401. Отдельный новый p9 возвращает null для всех отсутствующих необязательных полей.',
   'Второй текущий участник прочитал meeting/list/participants/feed/reactions. Рекурсивная проверка запретила login/first_name/last_name/birthday/sex/email/phone; чужое приглашение не содержит состав/медиа, приватная лента постороннему 403.',
   'Фактические JSON-ответы прошли OpenAPI. Минимальный прежний потребитель прочитал ID/kind=message/payload_version=1/payload.text, игнорируя новые свойства; прежний мобильный бинарник не запускался.'
  ]},
 'TC-API-RSVP-CUTOFF':{
  tests:['TestIndependentLegacyAndCutoff','TestIndependentUTCExactCutoff','TestIndependentConcurrentCutoffReschedule'],
  actual:[
   'На независимых TLS HTTP fixtures в UTC и Europe/Moscow запрос за секунду до starts_at−1h получил 200, ровно и после — 409; отвергнутый профиль не читает feed (403).',
   'Исходный подтверждённый ключ после границы снова дал CanAccessFeed=true; после not_going новая going-попытка вернула 409.',
   'Встреча starts_on без времени допускает going вечером той же даты. PATCH точного начала пересчитал границу: прежний формат going принят после допустимого переноса.',
   'Шесть пар RSVP/PATCH синхронно отпущены на HTTP-барьере. Сохранённые count/starts_at/revision и доступ feed проверены для обеих допустимых сериализаций; отвергнутому профилю также недоступен существующий photo URL в сценарии границы.'
  ]},
 'TC-API-RSVP-LEGACY':{
  tests:['TestIndependentLegacyAndCutoff/legacy_retry_move_date_only'],
  actual:[
   'До границы GET invitation дал can_join=true. После смены управляемых часов прежний PUT {answer,expected_revision} получил 409, без новых UI-полей.',
   'Повторный preview вернул can_join=false, join_disabled_reason=join_closed и точное join_closes_at; feed и photo/content отвергнутому профилю вернули 403.',
   'После PATCH starts_at тот же прежний формат запроса принят (200/CanAccessFeed=true), решение основано на текущем начале.'
  ]},
 'TC-API-PARTICIPANT-SUMMARY':{
  tests:['TestIndependentParticipantSummary'],
  actual:[
   'Созданы шесть текущих (включая организатора), maybe и not_going. GET meeting/list/calendar-filter сразу содержит participant_count=6 и публичное participant_preview.',
   'Участник выбран именно из preview; его not_going принят. Повторные meeting/list/calendar-filter содержат count=5 и исключают этот ID из preview.',
   'Профиль p2 действительно имеет avatar_url=null; приватные поля отсутствуют. Public invitation не раскрывает participants/participant_preview/media/memory_preview.'
  ]},
 'TC-API-REACTION-IDEMPOTENCY':{
  tests:['TestIndependentReactions'],
  actual:[
   'После успешного HTTP commit тело первого ответа отброшено; исходный запрос повторён, затем восемь параллельных одинаковых PUT. Второй профиль прочитал heart count=1.',
   'Тот же участник добавил fire, организатор heart: counts 2/1. Удаление собственного heart дало 1/1, чужая реакция сохранена.',
   'Реакция на message с фото принята; попытка реакции на системное событие получила 404, событие не превращено в голос/сообщение.',
   'После not_going GET/PUT reactions вернули 403; представление реакций другому участнику не содержит контактов.'
  ]},
 'TC-API-MEDIA-LIMITS':{
  tests:['TestIndependentMediaLimitsAndCleanup'],
  actual:[
   'GET limits: фото 10 MiB, файл 20 MiB, выбор 10. Резерв на допустимой границе принят и тот же ключ возвращает идентичное тело; граница+1, GIF и нулевой размер отвергнуты 422.',
   'Publish без bytes вернул 409; фиктивный PNG и несовпадающий фактический размер вернули 422. Корректные bytes затем приняты.',
   'У собственных orphan bytes выставлена контролируемая давность >1h; PruneMedia удалил их. Через 24h удалены все незавершённые резервы и pending bytes; единственный опубликованный файл и его HTTP чтение сохранены.',
   'Close временного файлового адаптера удалил исключительно его каталог. Новый независимый memory fixture имеет пустой список встреч. Сохранность после рестарта PostgreSQL этим не заявляется.'
  ]},
 'TC-API-MEDIA-PUBLICATION':{
  tests:['TestIndependentMediaPublicationAndAlbum','TestIndependentPublicationReplayAndAccessMatrix'],
  actual:[
   'PDF опубликован с trim-подписью; ответ отброшен после commit. Исходный ключ/тело возвращают прежний результат; feed второму участнику содержит ровно одно сообщение с подписью.',
   'Изменённая подпись со старым и с новым ключом получила 409. Перечитанный опубликованный payload сохранил исходную подпись.',
   'Отдельные фото чата и альбома опубликованы, соседняя неверная загрузка получила 422/409. Повторы успешных публикаций сохраняют ID/entry, в альбоме ровно одно явно выбранное фото. Caption для фото получил 422.',
   'Прежний потребитель прочитал kind=message/version=1/text; PDF имеет текст подписи, фото — Фото. Все записанные актуальные JSON-ответы провалидированы OpenAPI.'
  ]},
 'TC-API-MEDIA-ACCESS':{
  tests:['TestIndependentPublicationReplayAndAccessMatrix','TestIndependentMediaRevocationBarrier'],
  actual:[
   'Текущие owner/guest прочитали file/photo originals, thumbnail URL, metadata в meeting/feed/album. Постороннему 403, анонимно 401. Публичная обложка и приглашение доступны, приватных ID в preview нет; перенос private URL под invitation route вернул 404. Thumbnail в текущем контракте использует защищённый original route.',
   'Фактическая HTTP-загрузка остановлена на барьере MediaContent.Put. Через HTTP отозвано участие; после продолжения upload и publish вернули 403, metadata осталась pending.',
   'Отозванному профилю прежние read URL и сохранённые publish keys вернули 403. Текущий owner перечитал feed и past album: отвергнутого media ID нет.'
  ]},
 'TC-API-ALBUM-PAGINATION':{
  tests:['TestIndependentMediaPublicationAndAlbum','TestIndependentPublicationReplayAndAccessMatrix'],
  actual:[
   'Три независимые встречи переведены в past через ClaimTransition/CompleteTransition по управляемым календарным часам. Для пустой count=0/preview=[], chat доступен; наличие фото для перехода не требуется.',
   'Обычный участник добавил четыре фото. Две страницы limit=2 дают четыре разных ID, конец без next_cursor; повтор страницы сохраняет порядок. Текущие owner/guest читают подтверждённые originals.',
   'Отдельная встреча с одним фото имеет count=1/preview=1; полный альбом count=4/preview=3 и summary списка согласованы. Cursor другой встречи получил 422. Фото чата не появилось в альбоме автоматически.'
  ]},
 'TC-API-SUPPORT-ACCEPTANCE':{
  tests:['TestIndependentSupportAcceptanceAndRetry','TestIndependentTelegramMockTransport'],
  actual:[
   'Анонимное обращение без email/screenshot/diagnostics принято; тело первого ответа отброшено после 201. Исходный ключ/trim-тело снова возвращают один receipt; мок worker не обнаружил второй записи.',
   'Изменённый текст с прежним ключом — 409. Длины 9/3001 — 422, 10/3000 после trim — 201; ложный PNG и >5MiB — 422, настоящий PNG — 201, session_token как лишнее поле — 400. Шестое новое обращение — 429; повтор принятого ключа остаётся 201.',
   'В сформированном payload нет чата/cookie/token/URL; у первой принятой записи diagnostics/email/screenshot отсутствуют. Ответ содержит только receipt; GET по номеру — 404. Журналы и receipt проверены на текст, contact, screenshot, upstream error и синтетические секреты доставки.',
   'После временного mock failure запись и progress сохранены, ранний worker не работает, через минуту исходная запись доставляется. Повторного заполнения клиентом и нового receipt нет.'
  ]},
 'TC-SUPPORT-2B1C9FBF':{
  tests:['TestIndependentTelegramMockTransport','TestIndependentSupportAcceptanceAndRetry'],
  actual:[
   'Реальный Telegram adapter работает через закрытый RoundTripper. Синтетическое обращение принято по HTTP один раз; первый delivery возвращает временную ошибку, подтверждённый receipt уже выдан.',
   'Worker до срока не вызывает транспорт. Через управляемую минуту транспорт восстановлен; отправлено то же содержание с тем же Reference, после доставки очередь пуста. Дополнительно проверено сохранение подтверждённого progress при частичном отказе.',
   'Конфигурация назначения только синтетическая, в процессе нет реального сетевого transport. Receipt/логи не содержат destination, token, email или description; отдельная проверка screenshot-данных выполнена в support acceptance.'
  ]},
 'TC-PROFILE-4F3DAAFE':{
  tests:['TestIndependentProfileSynchronization/full_and_repeated_login'],
  actual:[
   'Тестовый OAuth callback использовал настоящий Yandex JSON decoder с закрытым transport. Собственный HTTP профиль точно совпал с полным provider document; client first_name во входном запросе отвергнут 400, новый минимальный профиль не получил демонстрационных полей.',
   'Второй вход того же subject с новым именем сохранил ID; новый и прежний Cookie client читают обновлённое имя/first_name. Прежняя действующая сессия не отозвана.'
  ]},
 'TC-PROFILE-3E5EFE8D':{
  tests:['TestIndependentProfileSynchronization/partial_birthday_unknown_sex'],
  actual:['Тестовый provider document содержит birthday=0000-12-23 и sex=null. После обмена HTTP profile сохранил строку 0000-12-23, sex/first_name=null, поля age нет. Год/пол/возраст не выведены из имени или аватара.']},
 'TC-PROFILE-F319B092':{
  tests:['TestIndependentProfileSynchronization/explicit_clear_missing_permissions'],
  actual:[
   'После полного входа повторный provider document содержит birthday:null, first_name пропущено. HTTP profile имеет тот же ID, birthday=null и сохранённое first_name.',
   'Следующий вход с отсутствующими контактами сохраняет прежние email/phone и уже очищенную дату. Документ provider не объявляет новые scopes, API также не добавляет утверждений о полученных правах; старая сессия действует.'
  ]},
 'TC-API-MEDIA-DURABILITY':{
  blocked:'Нет согласованного изолированного постоянного окружения для этапа 7.2, подтверждённых migration/GRANT/backup, квот и проверенного отката. Задание запрещает БД/Docker/deploy; memory/file fixture не удовлетворяет предусловию. Миграция, рестарт постоянного адаптера, восстановление backup и откат не выполнялись.',
  tests:[]},
 'TC-API-SUPPORT-DURABILITY':{
  blocked:'Нет постоянного support adapter/очереди, утверждённых сроков хранения/очистки и отдельного разрешённого тестового канала этапа 8.9. backend/docs/support.md прямо фиксирует memory queue и HTTP 503 в PostgreSQL-режиме. Реальная отправка запрещена заданием; рестарт постоянной очереди и retention не проверены.',
  tests:[]}
};

if(command.exitCode!==0 || !after.unchanged) throw Error('Failed run or changed source');
const review={schemaVersion:1,reviewer:'/root/api_r2_independent',planHash:hashPlan(plan),sourceHash:after.sourceHash,backendSourceHash:after.backendSourceHash,startedAt:command.startedAt,finishedAt:command.finishedAt,scope:'16 backend/API manual case pairs; fresh isolated HTTP/Store run, with independent executable interactions',actualJSONResponsesExamined:contract.actualResponseCount,actualJSONResponsesValidated:contract.results.filter(r=>r.schema).length,expectedUndocumented404:contract.results.filter(r=>!r.schema).length,topLevelTests:raw.filter(e=>e.Action==='pass'&&e.Test&&!e.Test.includes('/')).length,cases:[]};
const checks=[];
for(const expected of plan.expected.filter(e=>e.environment==='api')){
 const def=definitions[expected.caseId];
 const source=cases.find(c=>c.id===expected.caseId);
 if(!def||!source)throw Error(`No review for ${expected.caseId}`);
 for(const test of def.tests)if(!passing.has(test))throw Error(`No current pass: ${test}`);
 if(!def.blocked && def.actual.length!==source.steps.length)throw Error(`Step coverage mismatch: ${source.id}`);
 const files=fs.readdirSync(path.join(base,'run03')).filter(file=>file.startsWith('TestIndependent')&&file.endsWith('.json')&&def.tests.some(test=>file===test.replaceAll('/','_')+'.json'||file.startsWith(test.replaceAll('/','_')+'_')));
 const entry={id:expected.id,status:def.blocked?'blocked':'passed',source:source.source,tests:def.tests,preconditions:def.blocked?def.blocked:'Выполнены в изолированном TLS HTTP fixture; управляемые часы, синтетические профили, реальные handlers/services/store. Каждый fixture закрыт t.Cleanup, собственный временный файловый каталог удалён.',steps:source.steps.map((step,i)=>({...step,actual:def.blocked?'Не выполнялось: '+def.blocked:def.actual[i]})),cleanup:def.blocked?'Тестовые постоянные данные не создавались.':'Все собственные httptest servers закрыты. Memory fixture отброшен; файловый адаптер и его каталог закрыты/удалены. Live fixtures, UI и чужие данные не затронуты.',evidenceFiles:files};
 review.cases.push(entry);
 const proof=[evidence('run03/command.json','log'),evidence('run03/raw.jsonl','log'),evidence('openapi-run03.json','log'),...files.map(file=>evidence('run03/'+file,'interaction'))];
 checks.push({id:expected.id,status:entry.status,executor:{kind:'agent',id:'/root/api_r2_independent'},startedAt:command.startedAt,finishedAt:command.finishedAt,actual:def.blocked??def.actual.join(' '),defect:'',evidence:proof});
}
fs.writeFileSync(path.join(base,'case-review.json'),JSON.stringify(review,null,2)+'\n');
for(const check of checks)check.evidence.push(evidence('case-review.json','interaction'),evidence('before.json','log'),evidence('after.json','log'));
const result={schemaVersion:1,planHash:hashPlan(plan),checks,suites:[]};
validate('run',result);
fs.writeFileSync(path.join(runRoot,'backend-reviewer-checks.json'),JSON.stringify(result,null,2)+'\n');
const lines=['# Независимая функциональная проверка API · r2','','Результат: **14 passed, 2 blocked, 0 failed** из 16 backend-пар текущего плана. Это независимые ручные API-пары с воспроизводимыми executable HTTP-действиями, не повышение automation статуса.','',`План: \`${hashPlan(plan)}\`. Общий source hash до/после: \`${after.sourceHash}\`. Backend: \`${after.backendSourceHash}\`. Commit: \`${before.commit}\`; рабочее дерево содержит согласованные незакоммиченные изменения; исходники проверяющий не менял.`, '',`Среда: ${before.go}, macOS ${before.os}; отдельные TLS loopback fixtures с memory.Store, явными UTC-часами и синтетическими профилями. URL динамические, действуют только во время httptest; никакие live UI fixtures не затронуты.`, '',`Свежий run03: ${command.startedAt}–${command.finishedAt}, exit 0. GOMAXPROCS=2, -p 1, -race, -count=1: ${review.topLevelTests} групп; ${contract.results.filter(r=>r.schema).length} фактических JSON-ответов проверены по текущему OpenAPI, ещё ${contract.results.filter(r=>!r.schema).length} закрытых/несуществующих маршрута дали ожидаемые 404. Полный backend suite родителя не повторялся.`, '', '## Результаты','', '| Case | Статус |', '| --- | --- |', ...checks.map(c=>`| ${c.id.split('/')[0]} | ${c.status} |`), '', '## Ограничения','',definitions['TC-API-MEDIA-DURABILITY'].blocked,'',definitions['TC-API-SUPPORT-DURABILITY'].blocked,'','Реальный Яндекс OAuth, старые мобильные бинарники, постоянная БД/очередь, backup/restore, облако и реальные уведомления этим прогоном не проверены. Fake-provider использует настоящий декодер Yandex; Telegram adapter использует закрытый mock transport. Эти границы предусмотрены raw backend-кейсами.','','## Доказательства и история запуска','','[Проверки для объединения](backend-reviewer-checks.json) имеют SHA256 evidence. [Разбор каждого action/expected/actual](backend-reviewer-evidence/case-review.json) связывает все шаги с текущими tests/HTTP transcripts. Go JSONL и snapshots verifier сохранены в backend-reviewer-evidence/run03; контракт — openapi-run03.json/log.','','run01 сохранил отказ sandbox на loopback bind до первого HTTP-действия. Тот же runner с разрешённым loopback прошёл run02. После добавления явного чтения feed/album для отвергнутой публикации выполнен свежий run03; прежние результаты и snapshots сохранены. Из двух публичных cover-response evidence удалены только тела с синтетическим invitation capability URL после контрактной проверки, оригинальные SHA256 остались (privacy-filter.json).','','Продукт, кейсы, эталоны, tasks, manifest и общий run.json не редактировались. Overlay создаёт виртуальные test-файлы и не меняет hashed input tree. Все собственные данные очищены; secret/private config из .cache не читались. Финальные npm run agent:check, git diff --check, проверка схемы checks и сверка всех SHA256 evidence прошли.',''];
fs.writeFileSync(path.join(runRoot,'backend-reviewer-report.md'),lines.join('\n'));
console.log(JSON.stringify({planHash:result.planHash,checks:checks.length,passed:checks.filter(c=>c.status==='passed').length,blocked:checks.filter(c=>c.status==='blocked').length,actualJSONResponsesValidated:contract.actualResponseCount,sourceUnchanged:after.unchanged},null,2));
