#!/bin/sh
# simulator.sh owns the selected QA device; preserve its keyboard preference.
somewhere_keyboard_original=
somewhere_keyboard_restore=0

somewhere_read_software_keyboard() {
    if ! somewhere_keyboard_domain=$(xcrun simctl spawn "$somewhere_simulator" defaults export \
        com.apple.keyboard.preferences -); then
        printf 'Cannot inspect simulator keyboard preferences.\n' >&2
        return 1
    fi
    printf '%s' "$somewhere_keyboard_domain" | python3 -c '
import plistlib, sys
try:
    value = plistlib.loads(sys.stdin.buffer.read())
    if not isinstance(value, dict):
        raise ValueError("Invalid preferences domain")
    if "AutomaticMinimizationEnabled" not in value:
        print("absent")
    elif type(value["AutomaticMinimizationEnabled"]) is bool:
        print(int(value["AutomaticMinimizationEnabled"]))
    else:
        raise ValueError("Unexpected keyboard preference type")
except Exception:
    print("Cannot parse simulator keyboard preference.", file=sys.stderr)
    sys.exit(1)
'
}

somewhere_prepare_software_keyboard() {
    if ! somewhere_keyboard_original=$(somewhere_read_software_keyboard); then return 1; fi
    printf 'QA_KEYBOARD_AUTOMATIC_MINIMIZATION_BEFORE=%s\n' "$somewhere_keyboard_original"
    somewhere_keyboard_restore=1
    if ! xcrun simctl spawn "$somewhere_simulator" defaults write \
        com.apple.keyboard.preferences AutomaticMinimizationEnabled -bool false; then return 1; fi
    if ! somewhere_keyboard_current=$(somewhere_read_software_keyboard); then return 1; fi
    if [ "$somewhere_keyboard_current" != 0 ]; then
        printf 'Simulator software keyboard profile was not applied.\n' >&2
        return 1
    fi
    printf 'QA_KEYBOARD_AUTOMATIC_MINIMIZATION_ACTIVE=0\n'
}

somewhere_restore_software_keyboard() {
    if [ "$somewhere_keyboard_restore" != 1 ]; then return 0; fi
    if [ "$somewhere_keyboard_original" = absent ]; then
        if ! xcrun simctl spawn "$somewhere_simulator" defaults delete \
            com.apple.keyboard.preferences AutomaticMinimizationEnabled; then return 1; fi
    else
        somewhere_keyboard_boolean=false
        if [ "$somewhere_keyboard_original" = 1 ]; then somewhere_keyboard_boolean=true; fi
        if ! xcrun simctl spawn "$somewhere_simulator" defaults write \
            com.apple.keyboard.preferences AutomaticMinimizationEnabled -bool "$somewhere_keyboard_boolean"; then return 1; fi
    fi
    if ! somewhere_keyboard_current=$(somewhere_read_software_keyboard); then return 1; fi
    if [ "$somewhere_keyboard_current" != "$somewhere_keyboard_original" ]; then
        printf 'Simulator keyboard preference was not restored.\n' >&2
        return 1
    fi
    printf 'QA_KEYBOARD_AUTOMATIC_MINIMIZATION_RESTORED=%s\n' "$somewhere_keyboard_original"
    somewhere_keyboard_restore=0
}
