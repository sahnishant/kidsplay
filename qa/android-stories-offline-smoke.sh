#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-android-stories-smoke}"
APK_PATH="${2:-android/app/build/outputs/apk/debug/app-debug.apk}"
PACKAGE="com.kidsplay.app"
AVD_NAME="${KIDSPLAY_ANDROID_AVD:-kidsplay-stories-ci}"
mkdir -p "$OUT_DIR"
test -f "$APK_PATH"

emulator -avd "$AVD_NAME" -no-window -no-audio -no-snapshot -no-boot-anim -no-metrics -gpu swiftshader_indirect >"$OUT_DIR/emulator.log" 2>&1 &
emulator_pid=$!
trap 'kill "$emulator_pid" 2>/dev/null || true' EXIT

for _ in $(seq 1 90); do
  adb get-state 2>/dev/null | grep -qx device && break
  kill -0 "$emulator_pid" 2>/dev/null || { cat "$OUT_DIR/emulator.log"; exit 1; }
  sleep 2
done
adb get-state | grep -qx device

booted=""
for _ in $(seq 1 72); do
  booted="$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')"
  [ "$booted" = "1" ] && break
  kill -0 "$emulator_pid" 2>/dev/null || { cat "$OUT_DIR/emulator.log"; exit 1; }
  sleep 5
done
test "$booted" = "1"

adb shell settings put global window_animation_scale 0 || true
adb shell settings put global transition_animation_scale 0 || true
adb shell settings put global animator_duration_scale 0 || true
adb shell wm size 360x640
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 0
adb install -r "$APK_PATH"

# Make the offline boundary explicit. Wi-Fi and mobile data are disabled in
# addition to Android's airplane-mode setting, and the proof records the state.
adb shell settings put global airplane_mode_on 1
adb shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state true >/dev/null 2>&1 || true
adb shell svc wifi disable || true
adb shell svc data disable || true
test "$(adb shell settings get global airplane_mode_on | tr -d '\r')" = "1"
{
  echo "airplane_mode=$(adb shell settings get global airplane_mode_on | tr -d '\r')"
  echo "wm_size=$(adb shell wm size | tr -d '\r')"
} > "$OUT_DIR/offline-state.txt"

tap_label() {
  local needle="$1"
  local xml="$OUT_DIR/ui.xml"
  local remote="/sdcard/kidsplay-ui.xml"
  for _ in $(seq 1 20); do
    adb shell uiautomator dump --compressed "$remote" >/dev/null 2>&1 || true
    if adb pull "$remote" "$xml" >/dev/null 2>&1; then
      coords="$(NEEDLE="$needle" XML_PATH="$xml" python3 - <<'PY'
import os, re, xml.etree.ElementTree as ET
root = ET.parse(os.environ['XML_PATH']).getroot()
needle = os.environ['NEEDLE'].casefold()
for node in root.iter('node'):
    hay = ' '.join((node.attrib.get('text',''), node.attrib.get('content-desc',''))).casefold()
    if needle not in hay:
        continue
    m = re.fullmatch(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds',''))
    if not m:
        continue
    x1,y1,x2,y2 = map(int, m.groups())
    print((x1+x2)//2, (y1+y2)//2)
    break
PY
)"
      if [ -n "$coords" ]; then
        read -r x y <<< "$coords"
        adb shell input tap "$x" "$y"
        sleep 1
        return 0
      fi
    fi
    sleep 1
  done
  echo "Could not find tappable accessibility node containing: $needle" >&2
  cat "$xml" >&2 2>/dev/null || true
  return 1
}

assert_label() {
  local needle="$1"
  local xml="$OUT_DIR/ui.xml"
  local remote="/sdcard/kidsplay-ui.xml"
  for _ in $(seq 1 20); do
    adb shell uiautomator dump --compressed "$remote" >/dev/null 2>&1 || true
    if adb pull "$remote" "$xml" >/dev/null 2>&1 && NEEDLE="$needle" XML_PATH="$xml" python3 - <<'PY'
import os, xml.etree.ElementTree as ET
root = ET.parse(os.environ['XML_PATH']).getroot()
needle = os.environ['NEEDLE'].casefold()
for node in root.iter('node'):
    hay = ' '.join((node.attrib.get('text',''), node.attrib.get('content-desc',''))).casefold()
    if needle in hay:
        raise SystemExit(0)
raise SystemExit(1)
PY
    then
      return 0
    fi
    sleep 1
  done
  echo "Accessibility tree did not contain: $needle" >&2
  cat "$xml" >&2 2>/dev/null || true
  return 1
}

resolve_launcher_component() {
  for _ in $(seq 1 15); do
    component="$(adb shell cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER "$PACKAGE" 2>/dev/null | tr -d '\r' | tail -n 1)"
    [[ "$component" == "$PACKAGE"/* ]] && { printf '%s\n' "$component"; return 0; }
    sleep 1
  done
  return 1
}

launch_app() {
  local label="$1"
  local component
  component="$(resolve_launcher_component)"
  adb shell am start -W -n "$component" | tee "$OUT_DIR/${label}-launch.txt"
  for _ in $(seq 1 20); do
    pid="$(adb shell pidof "$PACKAGE" 2>/dev/null | tr -d '\r')"
    [ -n "$pid" ] && { echo "$pid" > "$OUT_DIR/${label}-pid.txt"; return 0; }
    sleep 1
  done
  return 1
}

capture_screen() {
  local label="$1"
  adb exec-out screencap -p > "$OUT_DIR/${label}.png"
  bytes="$(wc -c < "$OUT_DIR/${label}.png" | tr -d ' ')"
  test "$bytes" -ge 30000
}

adb shell am force-stop "$PACKAGE"
launch_app first-offline-launch
assert_label "Open Stories"
tap_label "Open Stories"
assert_label "Open The Moonlit Leaf"
tap_label "Open The Moonlit Leaf"
assert_label "page 1 of 9"

for _ in $(seq 1 5); do tap_label "Next"; done
assert_label "page 6 of 9"
tap_label "Add to favourites"
assert_label "Remove from favourites"
tap_label "Read to me"
# Repeat exercises the same #175/#197 interruption path under airplane mode.
tap_label "Repeat page"
assert_label "page 6 of 9"
capture_screen story-page-before-process-kill

first_pid="$(cat "$OUT_DIR/first-offline-launch-pid.txt")"
adb shell am force-stop "$PACKAGE"
sleep 1
launch_app offline-process-relaunch
second_pid="$(cat "$OUT_DIR/offline-process-relaunch-pid.txt")"
{
  echo "first_pid=$first_pid"
  echo "second_pid=$second_pid"
} > "$OUT_DIR/process-relaunch.txt"

# App relaunch returns to Home; opening Stories must consume the serialized
# story-reading store and restore the exact child-facing beat automatically.
assert_label "Open Stories"
tap_label "Open Stories"
assert_label "The Moonlit Leaf, page 6 of 9"
assert_label "Remove from favourites"
tap_label "Repeat page"
assert_label "page 6 of 9"
capture_screen story-page-after-process-relaunch

# Reconfirm the network boundary after the full child journey.
test "$(adb shell settings get global airplane_mode_on | tr -d '\r')" = "1"
adb shell dumpsys package "$PACKAGE" > "$OUT_DIR/package.txt"
adb shell dumpsys activity activities > "$OUT_DIR/activities.txt"
grep -q "$PACKAGE" "$OUT_DIR/activities.txt"
echo "Packaged Stories airplane-mode process-relaunch proof passed."
