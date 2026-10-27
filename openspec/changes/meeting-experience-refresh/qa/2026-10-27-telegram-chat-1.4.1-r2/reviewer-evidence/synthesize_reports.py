"""Evidence-only synthesis of the independent r2 session. Does not run UI or tests."""
import collections
import datetime
import hashlib
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[6]
CHANGE = ROOT / 'openspec/changes/meeting-experience-refresh'
QA = CHANGE / 'qa/2026-10-27-telegram-chat-1.4.1-r2'
EV = QA / 'reviewer-evidence'
REF = CHANGE / 'assets/verification/live-review/2026-10-27-telegram-chat-1.4.1-r2/reference'
INPUT = '7281d60a82c41d4dc7fdb8f0427df0771649e255caf7e94ccfc351a8b3da2671'
SOURCE = 'd22e90bda6696076f61e6fa9ac7b1cb539a69a204f02f779774f862e60ec6f38'
NOW = datetime.datetime.now(datetime.timezone.utc).isoformat()
read = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

plan = read(QA / 'plan.json')
assert plan['sourceHash'] == SOURCE
manifest = read(CHANGE / 'design-manifest.json')
cases = {c['id']: c for c in read(EV / 'ui-case-inventory.json')}
actions = [json.loads(line) for line in (EV / 'android/interactions.jsonl').read_text().splitlines()]
captures = {p.parent.name: read(p) for p in (EV / 'android').glob('*/capture.json')}
by_number = {int(k[:3]): k for k in captures}
reference_metadata = read(REF / 'metadata.json')

def cp(number, filename='screen.png'):
    return EV / 'android' / by_number[number] / filename

def ev(path, kind, design=False):
    return {'path': str(path.relative_to(ROOT if design else QA)), 'sha256': sha(path), 'kind': kind}

def functional_evidence(numbers):
    return [ev(EV / 'android/interactions.jsonl', 'interaction'), ev(EV / 'review-synthesis.json', 'log')] + [ev(cp(n), 'screenshot') for n in numbers] + [ev(cp(n, 'hierarchy.xml'), 'raw') for n in numbers]

def time_range(numbers):
    starts = [captures[by_number[n]]['startedAt'] for n in numbers]
    starts += [a['at'] for a in actions if a['step'] in [by_number[n] for n in numbers]]
    return (min(starts), max(captures[by_number[n]]['finishedAt'] for n in numbers))

findings = [
    {'id': 'R2-ANDROID-LIST-TIME', 'classification': 'confirmed', 'severity': 'normal',
     'case': 'TC-LIST-5B54DA87', 'screenState': 'list-native/android/no-cover',
     'steps': ['Открыть текущий список встреч.', 'Прокрутить к «Воскресенье без планов», 8 ноября, без назначенного времени и обложки.'],
     'expected': 'Дата, «время уточняем» и текстовые детали без вымышленного часа (case step 1; published list raw).',
     'actual': 'Дата «Вс, 8 ноября» и «Место пока не выбрано» есть. «Время уточняем» отсутствует и на изображении, и в hierarchy. Фото или крупной заглушки нет.',
     'captures': [3, 80], 'reference': 'list-390x844.png'},
    {'id': 'R2-ANDROID-SETTINGS-ORDER', 'classification': 'confirmed-design', 'severity': 'normal',
     'screenState': 'chat-settings-native/android/open',
     'steps': ['Организатору открыть сведения «Настолки у Саши».', 'Нажать «Настройки встречи».'],
     'expected': 'Общий порядок содержимого native сохраняется (docs/design/platforms.md): raw settings показывает название, описание, затем дату/время, место и небольшой блок обложки.',
     'actual': 'Порядок — название, дата/время, место, описание, «Убрать время». Описание перенесено за место. Это не следствие других имён/количества участников или системного date picker. Обложка ниже начального fold; её недоступность не утверждается.',
     'captures': [10, 13], 'reference': 'settings-390x844.png'},
    {'id': 'R2-ANDROID-DATE-FOLD', 'classification': 'incomplete-observation',
     'case': 'TC-CHAT-DATE-FORM', 'captures': [72, 73, 74, 75], 'reference': 'date-390x844.png',
     'actual': 'При открытии видны две разные даты, три включённых и два выключенных toggle; последний частично за footer, срок ниже fold. Родной календарь открывается и отменяется. Не выполнены прокрутка к сроку и взаимодействие с пятым toggle.',
     'qualification': 'Case step 1 требует доступность без раскрывающих секций; chat-actions.md разрешает прокрутку тела при низкой высоте, при этом также говорит «все пять настроек видны сразу». Native 360×800 dp со своими insets/targets отличается от raw 390×844. Начальный fold сам по себе не доказал функциональную недоступность; failed не присвоен.'},
    {'id': 'R2-ANDROID-PLUS-EMOJI', 'classification': 'incomplete-observation',
     'case': 'TC-CHAT-F00844F6', 'captures': [22, 23, 24, 70, 71, 72, 75],
     'actual': 'При открытом plus первый tap по видимой кнопке emoji только закрывает menu (022→023); следующий tap открывает dock (024). Обратно dock→plus одним tap открывает menu (070→071). Menu→date→X возвращает чат без остаточной поверхности.',
     'qualification': 'Правило требует переключение plus→emoji→plus с одной поверхностью. Зафиксирован первый результат, но повтор того же plus→emoji не завершён. Не утверждается воспроизводимость отдельного дефекта; форма не обязана автоматически восстанавливать прежний dock.'},
    {'id': 'R2-ANDROID-SETTINGS-IME', 'classification': 'inconclusive', 'captures': [14, 15, 16, 17, 18],
     'actual': 'При длинной ASCII-последовательности однажды возник discard dialog после частичного ввода. Продолжение редактирования и короткий xyz воспроизвели нормальный ввод. Системная stylus/floating IME была активна.',
     'qualification': 'Не объявляется багом сохранения/закрытия: повтор не подтвердил причинную связь, длинная строка не повторена.'}
]
gaps = [
    {'id': 'mixed-rsvp', 'cases': ['TC-CHAT-INFO-EXPAND'],
     'missingPrecondition': 'В текущем seed все шесть ответов «Приду»; нет требуемого сочетания организатор + три «Приду» + «Возможно» + «Не смогу».',
     'needed': 'Подготовить это распределение и отдельную сессию для изменения одного RSVP с сохранением заданных имён. Test OAuth subjects доступны, но Verify возвращает имя «Саша», поэтому простая повторная авторизация меняет имена. В r2 это изменение не выполнялось.'},
    {'id': 'shared-chat-and-two-sessions', 'cases': ['TC-CHAT-1F396228', 'TC-CHAT-EMOJI-SELECTION', 'TC-CHAT-EMOJI-DISMISS-FOCUS', 'TC-REACT-FULL-PICKER'],
     'missingPrecondition': 'Работа велась одной сессией Саши; два одновременно управляемых клиента/профиля не подготовлены. История содержит три сообщения и task, но требуемое сообщение с вложением не было подготовлено до начала цепочки. Использован QA XX draft вместо точного «До XX после».',
     'needed': 'Один общий чат с устойчивыми ID, текстом, вложением, системным событием и историей выше viewport; две независимые сессии. Надёжный штатный ввод русского текста/поиска и точного selection.'},
    {'id': 'reaction-distribution', 'cases': ['TC-REACT-PEOPLE-FILTER', 'TC-REACT-7E7A775E'],
     'missingPrecondition': 'В реально проверенном сообщении ❤️2 и добавленная Сашей 🍕1; case задаёт 👍2/🍕2, собственное участие и отличающиеся реакции другого сообщения.',
     'needed': 'Задать указанное распределение с собственными/чужими реакциями и вторым профилем для проверки удаления, pending и подтверждённого результата.'},
    {'id': 'task-roles', 'cases': ['TC-CHAT-TASK-ROLES', 'TC-TASK-1DAB5DF2', 'TC-TASK-B8D2770E', 'TC-TASK-A7464DF9', 'TC-TASK-0D640ABE', 'TC-TASK-148F3348', 'TC-TASK-00CF9F67'],
     'missingPrecondition': 'Есть принятая Мишей task и созданная в r2 адресованная Лене task; точные Тимофей/Лена/автор/организатор/другой участник, парные эквивалентные задачи для inline/detail, отдельные статусы и управляемые сессии не были подготовлены.',
     'needed': 'Комплект предложенных/принятых задач с независимыми профилями всех ролей; сравнение inline/detail и второго клиента. Созданная QA-r2-task отменена через явное подтверждение и осталась в истории.'},
    {'id': 'fault-and-access-controls', 'cases': ['TC-CHAT-DATE-FORM', 'TC-CHAT-SETTINGS-FORM', 'TC-CHAT-SHEET-RETURN', 'TC-REACT-18CAB411', 'TC-REACT-EFCCD7B0', 'TC-REACT-126AB1CF'],
     'missingPrecondition': 'В запущенном scenario design не были активированы управляемые error, задержанный ответ, loss-after-commit и отзыв доступа второй сессией. Наличие таких helpers в исходниках не считается подготовленным живым состоянием.',
     'needed': 'Документированный безопасный runtime control для текущего fixture и отдельные роли/сессии; не менять эталоны или подменять actual API ответами теста.'},
    {'id': 'real-file-picker-data', 'cases': ['TC-CHAT-SETTINGS-FORM', 'TC-MEDIA-82F4AC83', 'TC-MEDIA-2BD057D2'],
     'missingPrecondition': 'Два синтетических PNG и документы с известными hashes для штатного picker не выбраны/не загружены в этой сессии; cover/remove и error/retry не выполнены.',
     'needed': 'Известные локальные QA-файлы в доступном picker, без пользовательских фотографий/документов.'},
    {'id': 'environment-not-product-data', 'cases': ['TC-CHAT-EMOJI-LOW-HEIGHT', 'TC-FEED-1BFACA40', 'TC-INFO-ONBOARDING-NO-SERVICE'],
     'missingPrecondition': 'Полноценный docked IME, landscape, увеличенный текст, TalkBack и reduced motion не доведены до проверяемого состояния; Android отключился после попытки dock. Это окружение/незавершённая подготовка, не отсутствие бизнес-данных.',
     'needed': 'Стабильный QA emulator с видимым переключением IME и восстановлением настроек; отдельно чистый onboarding. Web нужен доступный внутренний браузер после ручного решения пользователем TLS; iOS — живой pinned API.'}
]
summary = {
    'schemaVersion': 1, 'reviewer': '/root/telegram_independent_review', 'recordedAt': NOW,
    'inputHash': INPUT, 'sourceHash': SOURCE, 'planHash': read(QA / 'run.json')['planHash'],
    'acceptanceStopped': 'Root завершил фактическую r2 UI-сессию и разрешил подготовку двух исправлений Android для r3. Оформление после остановки использует только сохранённые r2 evidence; новых UI/API проверок нет. Отчёт historical, не подтверждение текущего изменяемого source.',
    'scope': {'designPairs': 1010, 'functionalUiPairs': 287, 'backendPairs': '16 проверяет отдельный /root/api_r2_independent; сюда не копируются'},
    'liveSession': {'android': '001–097: свежие screenshot+hierarchy, ручные решения и единичные ADB действия на emulator-5554. 098: команда выполнена, after-state недоступен; 099 не получен. Никаких native UI runners.',
                    'ios': 'Свежий CUA Retry и tap карточки. Ввод подтверждён, API 54947 остановлен, загрузка встречи не завершилась.',
                    'web': 'Собственный IAB browser 2 unavailable; оператор /root открыл actual, свежие screenshot+AX показывают TLS warning. Reviewer лично просмотрел, bypass не выполнялся.'},
    'rawComparison': {'render': str(REF.relative_to(ROOT)), 'capturedAt': reference_metadata['captures'][0]['capturedAt'] + '–' + reference_metadata['captures'][-1]['capturedAt'],
                      'viewed': ['list', 'chat', 'emoji', 'reactions', 'info', 'settings', 'task', 'date'],
                      'differences': 'Raw chat — «Вечер без планов», четыре текущих участника и другая история; native seed — «Настолки у Саши», шесть текущих, другие имена/сообщения. Raw 390×844 CSS, native 360×800 dp, системные insets, sans-serif, 48dp targets. Pixel-identical сравнение не заявляется. Совпадающие правила поведения/порядка/ролей оценены отдельно; число/имена/времена не объявлены багом. People-sheet отдельного raw capture нет.'},
    'findings': findings, 'fixtureGaps': gaps,
    'cleanup': {'task': 'QA-r2-task создана адресованной Лене, затем явно отменена; в истории retained один card и событие отмены (076–079).',
                'draft': 'ASCII QA draft не отправлялся. При переходе в другую встречу не протёк; settings изменения отброшены через подтверждение.',
                'reaction': 'Синтетическая 🍕 реакция добавлена Сашей к сообщению Лены. Не удалена до disconnect; остаётся только в одноразовом memory fixture.',
                'clipboard': 'Копирована только синтетическая invitation URL; внешней отправки не было.',
                'ime': 'Исходный stylus/floating режим. Show on-screen keyboard и tools открыты; результат попытки dock/восстановление не наблюдались после disconnect. FontScale/orientation не менялись.'},
    'limits': 'Сборка, unit/E2E и старые screenshots не засчитываются вместо ручных кейсов. Новые iOS URL/перезапуск Android не смешиваются с r2. Неполные кейсы blocked, даже если отдельные шаги прошли. Исходники/эталоны/кейсы/tasks не редактировались.'
}
write(EV / 'review-synthesis.json', summary)

# Each functional override is derived from this session, never from a previous run.
f_overrides = {
    'TC-LIST-697C602C': ('passed', [80, 81], 'Открыл и прокрутил список. Встреча с шестью текущими участниками показывает три перекрывающихся аватара справа и +3; AX содержит имена Сергей/Лена/Миша, у собственной встречи «Вы организатор». На 360dp текст и аватары не пересекаются, горизонтальной прокрутки не возникло.', ''),
    'TC-LIST-5B54DA87': ('failed', [3, 80], findings[0]['actual'], 'R2-ANDROID-LIST-TIME: отсутствует обязательное «время уточняем».'),
    'TC-LIST-6BAF1838': ('passed', [80, 81, 82], 'При ручной прокрутке и открытии встречи пятничная карточка «Ужин в пятницу» сливовая, субботняя «Настолки у Саши» серо-зелёная. Обе имеют явные русские день недели и дату, цвет не единственный носитель.', ''),
    'TC-LIST-57D734C1': ('passed', [3, 4, 80], 'После открытия «Настолки у Саши» из прокрученного списка и возврата Back восстановились тот же список предстоящих встреч и положение с «Настолки у Саши»/ноябрьской карточкой; нижняя панель снова показывает выбранные «Встречи».', ''),
    'TC-LIST-170C9AF2': ('passed', [87, 88, 89, 92], 'Через видимую навигацию открыл профиль, прокрутил до последней строки «Cookie и данные браузера», затем вернулся к встречам. Нижняя панель имеет подписи и правильное выделение; последняя строка профиля целиком выше неё и доступна. Проверен допустимый сценарий основного профиля, не заявляется календарь/приглашения.', ''),
    'TC-INFO-4D0E6354': ('passed', [82, 83, 85, 87, 89, 90], 'Обычным участником открыл сведения «Ужин в пятницу»: только детали встречи, Компания и собственный RSVP; сервисных ссылок/версии нет. В профиле видны Помощь, обе формы обратной связи, О приложении и документы; переход О приложении показал фактическую Android версию/сборку.', ''),
    'TC-PROFILE-CC2372B4': ('passed', [87, 88, 89], 'Из навигации открыл собственный синтетический профиль и прокрутил контакты. Поле телефона — «Не указан»; остальные данные (имя, Яндекс ID, имя/фамилия, дата, пол, почта) доступны. Редактора/выдуманного телефона нет.', '')
}
partial = {
    'TC-CHAT-03C1F855': ([58, 59, 60, 61, 62, 63, 64, 65, 66, 71, 72], 'Menu выбрало задачу и дату; задача реально создана после empty-validation. Опрос даты со сроком не создан и не проверен вторым участником.'),
    'TC-CHAT-13212426': ([22, 23, 24, 71], 'Меню открывалось; tap вне на emoji закрыл его. Повторный tap по plus и отдельный системный Back именно для menu не выполнены.'),
    'TC-CHAT-1F396228': ([46, 47, 48, 49, 50, 51, 52, 53, 54], 'ASCII selection XX заменён на 🍕, caret проверен вводом !. Точный русский текст, отдельная отправка и проверка вторым профилем не выполнены.'),
    'TC-CHAT-44FA05AC': ([24, 25, 26, 27, 48], 'Английский pizza дал 🍕, недавние показаны. Несуществующий русский запрос, clear и «пицца» не проверены.'),
    'TC-CHAT-F00844F6': ([22, 23, 24, 70, 71, 72, 75], 'Наблюдение R2-ANDROID-PLUS-EMOJI: первый tap только dismiss, второй открывает dock. Обратное переключение и date/X прошли. Полная последовательность, повтор первого tap и системный keyboard resize не завершены.'),
    'TC-CHAT-87982DEF': ([46, 47, 49, 50, 52, 53, 54], 'Selection/emoji/кнопка клавиатуры работают в ASCII draft. Case требует сначала выход без выбора и ввод YY, затем caret без выделения; эта полная последовательность не выполнена.'),
    'TC-CHAT-1064C7F5': ([10, 13, 19, 20, 21, 59, 67, 72, 76], 'Открыты info/settings/task/share/date/task details в sheet. Place и preview вложения не открыты; error/loss-after-commit, жесты и все reopen не выполнены.'),
    'TC-CHAT-INFO-EXPAND': ([10, 11, 12, 83, 84, 85], 'Реально раскрыты/свёрнуты шесть Going, фокус перешёл на Collapse/compact opener; участнику доступен RSVP без settings. Нет заданного mixed RSVP; изменение и повторная загрузка вторым профилем не выполнены.'),
    'TC-CHAT-EMOJI-SELECTION': ([46, 47, 48, 50, 51, 52, 53, 54], 'XX в ASCII draft заменён, ! вставился сразу после 🍕. Русские «пицца»/«сердце», повторная вставка ❤️ и точный русский draft не выполнены.'),
    'TC-CHAT-EMOJI-DISMISS-FOCUS': ([46, 47, 48, 49, 50, 51, 52, 53], 'На QA XX draft поддерживаемый Back закрыл dock без IME, сохранил выделение и вернул emoji focus; повторное открытие заменило XX на 🍕, keyboard button вернул caret. Полный raw case не засчитан: точный «До XX после» и исходный общий набор chat fixture не подготовлены.'),
    'TC-CHAT-EMOJI-LOW-HEIGHT': ([25, 26, 55, 56, 94, 95, 96, 97], 'Настоящая IME открывалась явно, но оставалась floating/stylus. Docked resize не подтверждён; после попытки dock emulator исчез. Landscape/large text не проверены.'),
    'TC-CHAT-SHEET-RETURN': ([10, 13, 18, 19, 20, 21, 67, 68, 69, 83, 85], 'Settings закрылись через discard к info, затем к тому же chat с draft/scroll/focus. Share открыт из header, copy подтверждён, close вернул focus. Info→Share→Info, повторный settings draft и error/retry не выполнены.'),
    'TC-CHAT-DATE-FORM': ([72, 73, 74, 75], 'Две разные локализованные даты, исходные toggle и родной календарь наблюдались. Пятый toggle частично за footer; scroll/reachability не проверены, поэтому это не failed. Добавление/удаление третьей даты, deadline, валидации, reopen, commit-loss и второй участник не выполнены.'),
    'TC-FEED-5C22B221': ([72, 73, 74, 75], 'Родной календарь доступен и отменяется; fixed footer виден. Третий вариант, нижние поля/scroll, тень, validation и reopen не проверены.'),
    'TC-CHAT-TASK-ROLES': ([59, 60, 62, 64, 65, 66, 76, 77, 78, 79], 'Создана предложенная Лене task без принятия, автору доступна отмена, после явного confirm статус «Отменено · Саша» и одно событие. Нет парных задач, всех независимых ролей, принятия/выполнения/отказа и сравнения inline/detail.'),
    'TC-CHAT-SETTINGS-FORM': ([13, 14, 18, 19, 20, 21], 'Есть подтверждённое дизайн-расхождение порядка полей R2-ANDROID-SETTINGS-ORDER. Ввод/explicit discard/возврат прошли. Cover picker, remove, save, retry, повторное открытие и low height не проверены; полный функциональный case blocked.'),
    'TC-REACT-1AAA13AA': ([30, 31, 32, 33, 34, 35], 'Явный quick opener→full→pizza добавил 🍕 к текстовому сообщению. Long-press, 🔥, вложение и второй профиль не проверены.'),
    'TC-REACT-FULL-PICKER': ([30, 31, 32, 33, 34, 35], 'Full picker привязан к выбранному сообщению, context outline есть, composer с draft виден вне панели, явный search не открыл IME до фокуса. Проверен английский pizza; русский поиск, низкая высота/landscape и отдельные close способы не выполнены.'),
    'TC-REACT-PEOPLE-FILTER': ([36, 37, 38, 39, 40, 41, 42, 43, 44, 45], 'Отдельно открыты люди, ❤️/🍕/Все меняют только список. Клавиатурой Tab+Enter выбран ❤️; AX focused=true/checked=true сохраняются. Back возвращает opener. Данные отличаются (❤️2/🍕1), переход из dock, low height и reopen не завершены.'),
    'TC-INFO-87665C8F': ([89, 90], 'Android показывает 0.1.0 и сборку 1, MintyDev. Предусловие отличающихся версий web/mobile и показ второго клиента не проверены.'),
    'TC-PROFILE-842701DD': ([11, 36, 37, 38, 83], 'В просмотренных составах и реакциях контактов нет. Ответы API этого живого UI fixture не были независимо перехвачены/сопоставлены; чужой privacy API pass не переносится в UI case.'),
    'TC-PROFILE-YANDEX-FIELDS': ([87, 88], 'Собственный профиль показал часть заданных данных, включая неполную дату. Последовательность full→partial→clear и второй профиль не проходилась.'),
    'TC-INFO-C4EDD04F': ([89, 90, 91], 'О приложении открылся без нижней панели/футера; видимый Back вернул профиль (подпись «К встречам» не соответствует фактическому родителю). Help/document страницы и системная история не пройдены.')
}
web_evidence = [ev(EV / 'web-preflight-id2.json', 'interaction'), ev(EV / 'web-operator/tls-warning.json', 'interaction'), ev(EV / 'web-operator/tls-warning.png', 'screenshot'), ev(EV / 'web-operator/tls-warning-ax.txt', 'raw')]
ios_evidence = [ev(EV / 'ios-retry-preflight.json', 'interaction'), ev(EV / 'ios-card-preflight.json', 'interaction'), ev(EV / 'ios-card-settled.json', 'log'), ev(EV / 'ios-fresh-preflight.png', 'screenshot'), ev(EV / 'ios-card-settled.png', 'screenshot'), ev(EV / 'availability-boundary.json', 'log')]
ui_checks = []
for pair in plan['expected']:
    if pair['environment'] == 'api':
        continue
    c = cases[pair['caseId']]
    check = {'id': pair['id'], 'status': 'blocked', 'executor': {'kind': 'agent', 'id': '/root/telegram_independent_review'}, 'defect': ''}
    if pair['environment'] == 'web-responsive':
        check.update(startedAt='2026-10-27T14:35:39.536Z', finishedAt='2026-10-27T14:41:08.526Z', evidence=web_evidence,
                     actual='Свежий собственный preflight: Browser is not available: 2. По выбранному reviewer действию оператор /root открыл actual 8445; screenshot/AX лично просмотрены: NET::ERR_CERT_AUTHORITY_INVALID. Security interstitial не обойдён, приложение не достигнуто. Не выполнен UI case «' + c['title'] + '»; ни одна web ширина не засчитана.')
    elif pair['environment'] == 'ios-phone':
        check.update(startedAt=read(EV / 'ios-fresh-preflight.json')['at'], finishedAt='2026-10-27T14:36:26.150Z', evidence=ios_evidence,
                     actual='CUA доступен: Retry оставляет ошибку списка, tap карточки переводит в «Открываем приглашение…», загрузка не завершается. Root установил остановку pinned API 54947 (Connection refused, PID 22855 exited); это инфраструктура, не доказанный баг клиента. Новый URL не использован. Case «' + c['title'] + '» не достигнут.')
    else:
        if c['id'] in f_overrides:
            status, nums, actual, defect = f_overrides[c['id']]
            started, finished = time_range(nums)
            check.update(status=status, startedAt=started, finishedAt=finished, actual=actual, defect=defect, evidence=functional_evidence(nums))
        else:
            nums, actual = partial.get(c['id'], ([97], 'Этот case не выполнен до отключения QA emulator. Требуемое действие: ' + ' → '.join(s['action'] for s in c['steps']) + '. Наличие fixture/helper/автотеста не считается ручным выполнением.'))
            started, finished = time_range(nums)
            check.update(startedAt=started, finishedAt=finished,
                         actual=actual + ' Продолжение blocked: после шага 098 adb сообщает device emulator-5554 not found; новый запуск не смешивается с r2.',
                         evidence=functional_evidence(nums) + [ev(EV / 'availability-boundary.json', 'log')])
    ui_checks.append(check)
assert len(ui_checks) == 287
write(QA / 'reviewer-checks.json', {'schemaVersion': 1, 'planHash': read(QA / 'run.json')['planHash'], 'checks': ui_checks, 'suites': []})

# Design checks retain the complete manifest matrix. A narrowly checked transition
# may pass independently of unvisited error/accessibility/data variants.
d_overrides = {
    ('list-native', 'weekday-many-participants'): ('pass', [81, 82], 'list', 'Будняя карточка реально просмотрена и открыта; сливовая поверхность, дата, фото, правые перекрывающиеся аватары и +3 соответствуют raw/meeting-card. AX имена сохранены; текст не перекрыт. Данные/ширина native указаны отдельно.'),
    ('list-native', 'weekend-many-participants'): ('pass', [3, 4, 80], 'list', 'Субботняя карточка реально открыта и повторно просмотрена после возврата: серо-зелёная поверхность, дата, организатор, фото и 3+3 без перекрытия. Native перенос названия допустим на 360dp.'),
    ('list-native', 'return-from-chat'): ('pass', [3, 4, 80], 'list', 'Реальный вход из прокрученного списка и Back восстановили тот же вид/период/положение и нижнюю навигацию. Новая загрузка не принудила верх списка.'),
    ('list-native', 'no-cover'): ('needs-fixes', [3, 80], 'list', 'R2-ANDROID-LIST-TIME: без фото нет крупной заглушки, но дата-only карточка не содержит «время уточняем», предусмотренное raw и TC-LIST-5B54DA87.'),
    ('chat-settings-native', 'open'): ('needs-fixes', [10, 13], 'settings', 'R2-ANDROID-SETTINGS-ORDER: название→дата/время→место→описание вместо raw название→описание→дата/время→место. Общий порядок содержимого требуется platforms.md. Системный picker/48dp targets не объясняют перестановку.'),
    ('chat-emoji-native', 'replace-selection'): ('pass', [46, 47, 50, 51, 52], 'emoji', 'Живое выделение XX внутри QA XX draft🍕 сохранено при переходе в dock и заменено только на 🍕. Получено QA 🍕 draft🍕, отправки нет, dock остаётся. Проверено правило selection, а не точный русский функциональный case.'),
    ('chat-emoji-native', 'keyboard-toggle-selection'): ('pass', [50, 51, 52, 53, 54], 'emoji', 'После выбора 🍕 кнопка клавиатуры вернула фокус/caret сразу после замены; введённый ! появился перед оставшимся draft🍕. Нативная stylus IME реальная; docked resize этим не проверен.'),
    ('chat-emoji-native', 'escape-back-opener'): ('pass', [46, 47, 48, 49, 50], 'emoji', 'Поддерживаемый Android Back закрыл dock, сохранил выделенное XX/draft/scroll, вернул focused=true кнопке emoji без IME; повторное открытие сохранило selection. Escape не заявлен.'),
    ('chat-emoji-native', 'draft-scroll-preserved'): ('pass', [30, 46, 47, 49, 50, 52], 'emoji', 'Above-bottom участок с первым сообщением сохранялся при open/Back/reopen dock, draft изменился лишь выбранной заменой. Индикатор новых сообщений остался, перехода в конец нет.'),
    ('chat-reactions-native', 'close-opener-focus'): ('pass', [31, 32, 34, 35], 'reactions', 'Quick→full→выбор 🍕 закрыли выбор, AX focused=true на доступном opener реакций исходного сообщения. Контекст выбранного сообщения и draft сохранены.'),
    ('chat-reactions-native', 'composer-visible'): ('pass', [31, 32, 33, 34, 35], 'reactions', 'В полном anchored выборе composer и Send видимы отдельно от overlay; явный search вызывает настоящую IME только после фокуса. Raw структура anchored, не полноэкранная modal, сохранена на этом viewport.'),
    ('chat-reactions-native', 'draft-scroll-preserved'): ('pass', [30, 31, 32, 34, 35], 'reactions', 'После открытия полного выбора и выбора реакции остались исходный участок above-bottom и QA draft; добавление реакции не отправило сообщение и не прыгнуло в конец.')
}
state_missing = {
    'large-text': 'Увеличенный системный текст не включён и не пройден.',
    'reduced-motion': 'Системное уменьшение движения не включено; движение не снято/не сопоставлено.',
    'low-height': 'Проверен только исходный portrait; docked IME/низкая доступная высота не доведены до проверяемого состояния.',
    'landscape': 'Реальная landscape ориентация не переключалась.',
    'screen-reader-focus': 'TalkBack не включался; AX focused/checked на отдельных controls не заменяет проход диктором.',
    'error-retry': 'В этом UI scenario не вызвана ошибка и не пройден безопасный повтор.',
    'confirmed-error-retry': 'Серверный отказ реакции и восстановление подтверждённого состояния не вызваны.',
    'pending-repeat': 'Задержанный ответ/loss-after-commit не активирован, повтор не выполнен.',
    'access-revoked': 'Доступ текущего профиля не отзывался при открытой поверхности/задержанном запросе.',
    'close-reopen': 'Полная цепочка сохранения draft формы после close и reopen не выполнена.',
    'russian-search': 'Проверен английский pizza; русский запрос не введён.',
    'empty-search': 'Отдельный пустой результат/clear не вызван.',
    'grapheme-delete': 'ZWJ/модификатор кожи/флаг и удаление в начале не проверены.',
    'repeat-insertion': 'Повторная последовательность нескольких emoji без закрытия не завершена.',
    'long-title': 'Отдельный длинный стрессовый заголовок не подготовлен; обычный перенос не заменяет это состояние.',
    'third-option-remove': 'Третья дата не добавлена; удаление среднего варианта/ID не проверено.',
    'all-five-settings': 'В 072 пятый toggle частично за footer; прокрутка и его переключение не выполнены. Видимость fold сама по себе не считается доказанной недоступностью.',
    'deadline-fields': 'Срок ниже fold; реальная прокрутка, дата+время срока и ошибка не пройдены.',
    'cover-change-remove': 'Штатный picker, сохранение двух синтетических covers и remove не пройдены.',
    'save-visible-low-height': 'Save виден в исходном portrait; системная low-height/IME проверка не завершена.',
    'participants-expanded-organizer': 'Все шесть seed Going раскрыты, но mixed ответы raw (Going/Maybe/No) не подготовлены.',
    'participants-expanded-member': 'Участник открыл compact info; раскрытие всех mixed ответов не выполнено.',
    'roster-current-count': 'Текущие шесть Going показаны; изменение RSVP вторым профилем и пересчёт не выполнены.',
    'emoji-filter-keyboard-focus': 'Фокус ❤️ при Tab/Enter проверен, но отдельный people raw capture и заданные 👍2/🍕2 отсутствуют.',
    'selection-announced': 'AX checked=true подтверждён, фактическое озвучивание TalkBack не проверено.',
    'quick-long-press': 'Quick открыт только явной кнопкой; long-press не выполнен.',
    'remove-own': 'Собственная реакция не удалялась.',
    'multiple-own-emoji': 'Один профиль добавил только 🍕; несколько собственных emoji не проверены.',
    'create-available': 'Предложение места не открывалось в этой сессии.',
    'open-poll-blocked': 'Открытый опрос места и блокировка второго не подготовлены.',
    'first-slide-no-service-entry': 'Чистый onboarding не запускался.',
    'skip-to-last': 'Переход skip/последовательный onboarding не выполнялся.',
    'large-text-no-overlap': 'Onboarding с увеличенным текстом не проходился.'
}
screen_partial = {
    'chat-date-native': ('date', [72, 73, 74, 75], 'Форма реально открыта: 2 разных seed даты, defaults 3 on/2 off, native calendar и cancel. Весь scrollable body/deadline не проверен.'),
    'chat-task-native': ('chat', [59, 60, 62, 64, 65, 66], 'Форма открыта, empty validation и создание адресованной Лене task прошли; отдельного raw create-task reference capture нет.'),
    'chat-menu-native': ('chat', [22, 23, 24, 71, 72], 'Plus/menu/date действовали; первое plus→emoji только dismiss, точное повторение не завершено. Отдельный raw menu capture не снят.'),
    'chat-task-details-native': ('task', [76, 77, 78, 79], 'Автор отменил собственную предложенную Лене task с подтверждением; остальные роли/статусы и точный raw fixture не пройдены.'),
    'meeting-info-native': ('info', [10, 11, 12, 20, 21, 83, 84, 85], 'Проверены organizer/member, раскрытие/сворачивание и settings-return; actual шесть Going вместо mixed raw. Полный reference/role/reopen вариант данного состояния не завершён.'),
    'chat-share-native': ('info', [67, 68, 69], 'Header Share→copy→X прошли, focus вернулся и draft сохранён. Отдельный raw Share capture и вложенный info→Share→info не проверены.'),
    'chat-settings-native': ('settings', [13, 18, 19, 20, 21], 'Есть отдельный подтверждённый дефект порядка open. Edit/discard/parent return выполнены, cover/save/error/reopen не завершены.'),
    'chat-reaction-people-native': ('reactions', [36, 37, 38, 39, 44, 45], 'Фильтры и клавиатурный focus живые, контактов нет; people-sheet отдельного raw reference capture нет, seed ❤️2/🍕1 отличается от кейса.'),
    'chat-emoji-native': ('emoji', [24, 26, 27, 49, 52, 53], 'Живые open/search/selection/Back/keyboard проверены в исходном portrait с ASCII/pizza; для данного варианта полная последовательность/данные не подготовлены.'),
    'chat-reactions-native': ('reactions', [31, 32, 34, 35], 'Явный quick/full/search/add выполнены; отдельные roles/data/error/removal варианты не пройдены.'),
    'list-native': ('list', [80, 81], 'Список просмотрен и прокручен; отдельный stress/масштабный fixture этого состояния не подготовлен.')
}
design_checks = []
for screen in manifest['screens']:
    for platform in screen['platforms']:
        for state in screen['states']:
            d = {'screen': screen['id'], 'platform': platform, 'state': state, 'status': 'blocked'}
            if platform == 'web':
                d['observations'] = 'Actual web не достигнут: у reviewer IAB 2 unavailable; оператор /root открыл URL 8445 и остановился на NET::ERR_CERT_AUTHORITY_INVALID. Свежие screenshot/AX лично просмотрены. Нет живого ' + screen['id'] + '/' + state + '; raw render не подменяет actual.'
                d['evidence'] = [ev(EV / 'web-preflight-id2.json', 'interaction', True), ev(EV / 'web-operator/tls-warning.json', 'interaction', True), ev(EV / 'web-operator/tls-warning.png', 'actual', True)]
            elif platform == 'ios':
                d['observations'] = 'CUA input подтверждён свежими Retry/tap; после перехода карточки остаётся loading. Pinned API 54947 остановлен по проверке root. Состояние ' + screen['id'] + '/' + state + ' не достигнуто; cached list/loading не pass. Новый API 58830 не использован для r2.'
                d['evidence'] = [ev(EV / 'ios-card-preflight.json', 'interaction', True), ev(EV / 'ios-card-settled.json', 'interaction', True), ev(EV / 'ios-card-settled.png', 'actual', True), ev(EV / 'availability-boundary.json', 'interaction', True)]
            elif (screen['id'], state) in d_overrides:
                status, nums, reference, observation = d_overrides[(screen['id'], state)]
                d.update(status=status, observations=observation + ' Raw/actual различаются содержимым и native геометрией; pass ограничен данным state, не whole-screen/functional-case. См. review-synthesis для fixture и границ сравнения.')
                d['evidence'] = [ev(cp(n), 'actual', True) for n in nums] + [ev(REF / (reference + '-390x844.png'), 'reference', True), ev(EV / 'android/interactions.jsonl', 'interaction', True), ev(EV / 'review-synthesis.json', 'interaction', True)]
                last = captures[by_number[nums[-1]]]
                lineage = {'environmentSha256': sha(QA / 'android-live/environment.json'), 'scenario': 'design', 'priorActions': [a for a in actions if a['at'] <= last['finishedAt']]}
                fixture_hash = hashlib.sha256(json.dumps(lineage, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
                # The lineage hash is not a server DB snapshot. It identifies the
                # seeded fixture plus all observed manual mutations before capture.
                write(EV / ('fixture-lineage-' + by_number[nums[-1]] + '.json'), lineage)
                d['capture'] = {'sourceHash': INPUT, 'fixtureHash': fixture_hash,
                    'runtime': 'Android Compose QA app 0.1.0 (1), APK 74ceec478be40f4a90633c301b9b38e6fd6c47f23b3db3b0482725aeb4c36325; ADB manual',
                    'os': 'Android 16 API 36 BE2A.250530.026.F3', 'viewport': '720×1600 physical; 320dpi; 360×800dp including system insets; portrait',
                    'fonts': ['Android system sans-serif / sp (Compose default; source theme has no custom font family)'],
                    'locale': 'ru-RU', 'timezone': 'Europe/Moscow', 'textScale': 1, 'capturedAt': last['finishedAt']}
                d['evidence'].append(ev(EV / ('fixture-lineage-' + by_number[nums[-1]] + '.json'), 'interaction', True))
            else:
                reference, nums, observed = screen_partial.get(screen['id'], (None, [97], 'Данная поверхность не открывалась до отключения emulator.'))
                missing = state_missing.get(state, 'Вариант «' + state + '» не доведён до полного сравнения raw/actual и требуемых взаимодействий.')
                d['observations'] = observed + ' ' + missing + ' Продолжение blocked: после 098 emulator-5554 not found; сохранён последний полноценный capture 097.'
                d['evidence'] = [ev(cp(n), 'actual', True) for n in nums] + [ev(EV / 'android/interactions.jsonl', 'interaction', True), ev(EV / 'review-synthesis.json', 'interaction', True), ev(EV / 'availability-boundary.json', 'interaction', True)]
                if reference:
                    d['evidence'].append(ev(REF / (reference + '-390x844.png'), 'reference', True))
            design_checks.append(d)
assert len(design_checks) == 1010
counts = dict(collections.Counter(c['status'] for c in design_checks))
fc = dict(collections.Counter(c['status'] for c in ui_checks))
report = {'schemaVersion': 1, 'manifest': str((CHANGE / 'design-manifest.json').relative_to(ROOT)), 'inputHash': INPUT,
          'reviewer': '/root/telegram_independent_review', 'reviewedAt': NOW, 'mode': 'historical',
          'environment': 'DS 1.4.1 frozen r2. Android Somewhere_API_36 emulator-5554, QA APK 74ceec… at API 54980, 720×1600/320dpi fontScale1 ru-RU Europe/Moscow; manual ADB explicitly authorized, 001–097 complete captures. iOS QA on simulator 31262733-50DC-46A5-938E-4C462D70F109: CUA input works, pinned API54947 down. Web8445: reviewer IAB unavailable, root operator TLS warning. Raw Chromium156 390×844 renders fresh at14:30Z, personally viewed. Native system sans-serif; exact installed font file not sampled. fixtureHash is SHA256 of compact sorted JSON environment+prior manual action lineage, not a database snapshot. No pixel-regression pass claimed.',
          'summary': 'Приёмка r2 остановлена перед исправлениями r3; это исторический отчёт реальных действий r2 с исходным hash, не приёмка изменённого source. Все 1010 пар сохранены: ' + json.dumps(counts, ensure_ascii=False) + '. Два подтверждённых Android замечания: отсутствие «время уточняем» и порядок полей settings. Date fold/plus→emoji отмечены отдельно как неполные наблюдения. Web TLS, iOS API down, Android disconnect блокируют остальное. Частичные живые успехи не дают pass полному functional case. 287 UI checks: ' + json.dumps(fc, ensure_ascii=False) + '; 16 backend checks ведёт другой reviewer.',
          'checks': design_checks}
write(CHANGE / 'design-review-2026-10-27-telegram-chat-1.4.1-r2.json', report)
write(EV / 'coverage-summary.json', {'at': NOW, 'inputHash': INPUT, 'sourceHash': SOURCE, 'design': counts, 'functionalUi': fc, 'designPairs': len(design_checks), 'functionalUiPairs': len(ui_checks), 'noBackendChecksCopied': True})
print(json.dumps({'design': counts, 'functionalUi': fc}, ensure_ascii=False))
