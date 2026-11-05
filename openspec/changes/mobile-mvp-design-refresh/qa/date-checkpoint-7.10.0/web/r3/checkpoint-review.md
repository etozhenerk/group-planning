# Date web7.10 r3 — только validation delta

Четыре целевых наблюдения прошли, findings нет:

- Desktop1100 empty Date: видимый alert «Выберите дату и укажите время встречи.».
- Desktop1100 empty Time: видимый прежний native required popup «Please fill out this field.», valueMissing=true, focus Time. Язык этого сообщения принадлежит browser fixture.
- Desktop1100 past: видимый alert «Выберите время окончания позже текущего.».
- Mobile390 empty Date: один inline hint, aria-invalid/error association/focus Date; footer alerts0, footer содержит только «Создать опрос».

POST0 во всех случаях. Proof:4 actual PNG и `targeted-probes-final.json`, errors=[]. Первый QA helper уточнён с button до menuitem в ActionMenu; исходный нулевой журнал сохранён, это не ошибка продукта. D1/D2/прочие flows не повторялись.

Frozen source `43d9735f31fc41108841e733ffaccb6249f7553cff91cd6b0ce84a777d82afe5`, artifact `077bfb8b456d3d36e7885a85337e9816779babd37582057cf1cfcd5c3ebd8192`,8907. Source before/after=candidate;261 disk/38 live assets совпали (`artifact-binding.json`). SHA — `evidence-sha256.json`. App/manifests/tasks/Git не менялись. Это checkpoint, не финальный gate; source освобождён.
