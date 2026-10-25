# Локальный каталог эмодзи

`emoji-ru.json` — JSON-массив из 3944 fully-qualified эмодзи Unicode 17.0.
Поля: `emoji`, русское `name`, массив поисковых `keywords`, стабильный
английский `category`, русское `category_name`. Порядок соответствует Unicode.
Контакты и пользовательские данные не входят в каталог. Все русские названия
есть в CLDR 48; английское имя дополнительно включено в поиск.

Источники сохранены в `sources/`, версия закреплена:

- [Unicode Emoji 17.0](https://unicode.org/Public/17.0.0/emoji/emoji-test.txt)
- [CLDR 48: ru](https://raw.githubusercontent.com/unicode-org/cldr/release-48/common/annotations/ru.xml)
- [CLDR 48: derived ru](https://raw.githubusercontent.com/unicode-org/cldr/release-48/common/annotationsDerived/ru.xml)

Лицензия Unicode-3.0 — в `LICENSE`. Воспроизведение без сети:
`python3 contracts/emoji/generate.py`. Генератор также обновляет копию
`backend/internal/meetings/emoji.json` для `go:embed`; её нельзя редактировать
отдельно. Клиенты включают общий JSON в ресурсы своей сборки, без запроса сети.
