# Help web R5 — consumed receipt / unsent draft

Запрошенный flow390 прошёл без findings: профиль→форма «Проблема»/«Профиль»→реальный201 `SW-8FCFA33F0534`→browserBack вprofile→Help→«Написать в поддержку». Открылась новая чистая форма с preset «Вопрос»/«Другой экран», description/email/file пусты.

Незавершённый текст после browserBack вHelp и повторного входа восстановился полностью с темойQuestion. POST остался ровно1; черновик не отправлялся.

Source before=after `fda0075451ee5efb28fef053ee7e757ed968c8a87f90f56106cd8a244fc17a7f`; artifact `2f4d563f00e5f84afbaa78ec751cf1f6ffe3c901f6099c56091ee62cd202c44d`. Binding stable: 268disk/39live entries; свежий designcontext совпал. Screenshot/interaction log сохранены; реальный endpoint в собственном memoryfixture сnilDelivery.

Первый QAselector искал radio.value, но уконтрола нетvalueattr(defaulton); исправлен толькоQAчтениемlabel. Originalнаблюдение сохранено. Это не productfinding. LostACK/email/desktop/styles/FAQ не повторялись; finalgates не заявлены. Source released, product/tests/tokens/tasks/Git не менялись.
