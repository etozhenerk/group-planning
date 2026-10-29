# P2-WEB-COMPOSER-GROW

Многострочный composer не увеличивается по содержимому и скрывает часть черновика.
Воспроизведение: открыть QA встречу; ввести «Черновик независимой проверки\nвторая строка»; проверить1280×720,390×844,320×740; коротко нажать вне поля. Повтор: «Строка один», Shift+Enter, «Строка два».

Фактически: высота textarea46.5px desktop /44px mobile; scrollHeight69/87/109px. При390px видны первые две визуальные строки, вторая логическая строка скрыта; при320px видно ещё меньше. Текст/selection не теряются, внутреннюю прокрутку допускает textarea. Raw с тем же текстом расширяет поле (desktop65px) и показывает больше draft. Computed fieldSizing=fixed; UI zoom1.

Evidence: actual/desktop-focused.png, actual/desktop-multiline-typed.png, actual/mobile-390-focused.png, actual/mobile-320-focused.png; reference/desktop-focused.png, reference/mobile-390.png, reference/mobile-320.png; interactions.json.

Область: существующая композиция, а не доказанная регрессия outside-focus. Проверено git diff --exit-code для SendMessage.tsx и SendMessage.module.css:0 против HEAD678cff24a1d97833cc80ac2a8171f213ea695103. Ревьюер не менял продукт и не расширял scope исправлений. Визуальный pass по focused/mobile состояниям не выставлен.
