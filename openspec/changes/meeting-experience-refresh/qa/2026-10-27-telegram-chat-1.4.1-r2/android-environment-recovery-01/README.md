# Восстановление Android QA после r2

Это инженерное восстановление окружения, не повторная приёмка. Старые r2 evidence и APK не менялись.

Восстановлен существующий Somewhere_API_36 / emulator-5554. Cold boot выполнен без загрузки/сохранения snapshot и без очистки userdata. Загрузка завершена, установленный QA APK прочитан обратно и совпадает с saved run03: `74ceec478be40f4a90633c301b9b38e6fd6c47f23b3db3b0482725aeb4c36325`. Установок, запуска приложения и действий UI при восстановлении не было. Fixture PID22948 оставлен.

Исходная причина исчезновения прежнего эмулятора не установлена. Его stdout заканчивается загрузкой snapshot в16:30:40, записи завершения нет; найденный qemu crash-report датирован24октября и не доказывает причину этой остановки. Полная копия прежнего лога сохранена в игнорируемом cache с hash в preflight.json.

Первая попытка временного launcher зависла до запуска VM в `HostSystem::getCurrentDirectory → getcwd → open`, что подтверждает sampled stack. Причина блокировки системного вызова неизвестна. Остановлен только этот временный job, рабочий каталог изменён с Documents-репозитория на каталог emulator SDK; вторая попытка загрузилась. Обе попытки, stack и stdout/stderr сохранены в cache.

## Launcher и завершение

- Label: `dev.somewhere.qa.android-recovery-20261027`.
- Plist: `.cache/qa/2026-10-27-telegram-chat-1.4.1-r2/android-recovery-01/emulator.plist`.
- Проверяющий launcher: `.cache/qa/2026-10-27-telegram-chat-1.4.1-r2/android-recovery-01/launch-emulator.sh`.
- Только текущая GUI-сессия: plist не установлен в Library/LaunchAgents; после нового входа автоматического запуска нет. `KeepAlive=false`; без бесконечных перезапусков.
- Процесс живёт под launchd, PPID1; завершение tool/turn его не останавливает.

После отдельного сигнала об окончании работы выгрузить только этот job:

```sh
launchctl bootout gui/501/dev.somewhere.qa.android-recovery-20261027
```

Фактические PID, устройство, build, геометрия и SHA — в environment.json. Pixel_10a/5556 и обычное приложение не затронуты. Новые исправления приложения и следующий цикл приёмки учитываются отдельно.
