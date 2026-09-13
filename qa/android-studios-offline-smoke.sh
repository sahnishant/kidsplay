#!/usr/bin/env bash
# Sourced after the existing Stories proof. Reuse its booted offline emulator,
# package, launch/tap/assert helpers and diagnostic directory; no second harness.
set -euo pipefail
for helper in launch_app tap_label assert_label; do declare -F "$helper" >/dev/null; done
: "${OUT_DIR:?Shared Android proof output is required}"
: "${PACKAGE:?Shared Android package is required}"

capture_studio_screen() {
  local path="$OUT_DIR/$1.png"
  adb exec-out screencap -p > "$path"
  # Check a real PNG and useful dimensions, not a content-dependent byte count.
  python3 - "$path" <<'PY'
import struct, sys
with open(sys.argv[1], 'rb') as stream:
    header = stream.read(24)
assert header[:8] == b'\x89PNG\r\n\x1a\n', 'Android screenshot is not PNG'
width, height = struct.unpack('>II', header[16:24])
assert min(width, height) >= 320, (width, height)
PY
}

assert_disabled_studio_control() {
  local needle="$1"
  for _ in $(seq 1 10); do
    adb shell uiautomator dump --compressed /sdcard/kidsplay-studio-ui.xml >/dev/null 2>&1 || true
    if adb pull /sdcard/kidsplay-studio-ui.xml "$OUT_DIR/studio-ui.xml" >/dev/null 2>&1 && NEEDLE="$needle" XML_PATH="$OUT_DIR/studio-ui.xml" python3 - <<'PY'
import os, xml.etree.ElementTree as ET
root = ET.parse(os.environ['XML_PATH']).getroot()
needle = os.environ['NEEDLE'].casefold()
for node in root.iter('node'):
    label = ' '.join((node.attrib.get('text',''), node.attrib.get('content-desc',''))).casefold()
    if needle in label and node.attrib.get('enabled') == 'false':
        raise SystemExit(0)
raise SystemExit(1)
PY
    then return 0; fi
    sleep 1
  done
  echo "Expected disabled studio control: $needle" >&2
  return 1
}

has_studio_label_once() {
  local needle="$1"
  local xml="$OUT_DIR/studio-nav-ui.xml"
  local remote="/sdcard/kidsplay-studio-nav-ui.xml"
  adb shell uiautomator dump --compressed "$remote" >/dev/null 2>&1 || return 1
  adb pull "$remote" "$xml" >/dev/null 2>&1 || return 1
  NEEDLE="$needle" XML_PATH="$xml" python3 - <<'PY'
import os, re, xml.etree.ElementTree as ET
root = ET.parse(os.environ['XML_PATH']).getroot()
needle = os.environ['NEEDLE'].casefold()
for node in root.iter('node'):
    label = ' '.join((node.attrib.get('text',''), node.attrib.get('content-desc',''))).casefold()
    if needle not in label or node.attrib.get('enabled') == 'false':
        continue
    match = re.fullmatch(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.attrib.get('bounds',''))
    if not match:
        continue
    x1, y1, x2, y2 = map(int, match.groups())
    if x2 - x1 >= 24 and y2 - y1 >= 24:
        raise SystemExit(0)
raise SystemExit(1)
PY
}

open_fraction_studio_from_home() {
  # A native PID and an accessibility node can appear slightly before the
  # hydrated WebView is ready to run a Svelte click handler after force-stop.
  # Require the real compact menu to visibly open and retry the human tap if
  # the first early tap was ignored; never inject DOM or application state.
  assert_label "Open child navigation" || {
    # Preserve the failed launch instead of dismissing a system ANR or retrying
    # the app. Diagnostics are bounded and cannot turn this failure into a pass.
    timeout 15s adb logcat -b main -b system -b events -d -t 2000 > "$OUT_DIR/studio-startup-logcat.txt" 2>&1 || true
    timeout 15s adb shell dumpsys activity lastanr > "$OUT_DIR/studio-startup-last-anr.txt" 2>&1 || true
    timeout 15s adb shell dumpsys input > "$OUT_DIR/studio-startup-input.txt" 2>&1 || true
    echo "Studio Home readiness failed; startup diagnostics retained." >&2
    return 1
  }

  local menu_open=""
  for _ in $(seq 1 6); do
    if has_studio_label_once "Open practice activities"; then
      menu_open="1"
      break
    fi
    tap_label "Open child navigation"
    sleep 1
    if has_studio_label_once "Open practice activities"; then
      menu_open="1"
      break
    fi
    sleep 1
  done
  if [ "$menu_open" != "1" ]; then
    echo "Compact child navigation did not open after bounded real taps." >&2
    return 1
  fi

  tap_label "Open practice activities" 1

  # Play is a nested CSS scroll pane, which Android WebView does not expose as
  # a native scrollable accessibility node. Hardware-key focus traversal is a
  # real child input path and makes the browser scroll a focused off-screen
  # button into view. Verify visible bounds after every bounded key press.
  local learn_about_visible=""
  for _ in $(seq 1 12); do
    if has_studio_label_once "Open Learn About"; then
      learn_about_visible="1"
      break
    fi
    adb shell input keyevent 61 # KEYCODE_TAB
    sleep 1
  done
  # Some Android WebView builds map directional navigation more reliably than
  # Tab. Keep a second bounded hardware-key path, still with no DOM/state injection.
  if [ "$learn_about_visible" != "1" ]; then
    for _ in $(seq 1 10); do
      if has_studio_label_once "Open Learn About"; then
        learn_about_visible="1"
        break
      fi
      adb shell input keyevent 20 # KEYCODE_DPAD_DOWN
      sleep 1
    done
  fi
  if [ "$learn_about_visible" != "1" ]; then
    echo "Learn About did not become visibly tappable after bounded keyboard navigation." >&2
    return 1
  fi

  tap_label "Open Learn About"
  tap_label "Learn about Fractions" 1
  tap_label "Make equal shares" 1
}

adb shell am force-stop "$PACKAGE"
launch_app studio-first-offline-launch
open_fraction_studio_from_home
assert_label "Part 1: empty"
tap_label "Part 1: empty" 1
assert_label "Part 1: Gold"
tap_label "Show me" 1
tap_label "Next step" 1
assert_disabled_studio_control "Next step"
assert_label "Make my own version"
capture_studio_screen studio-before-process-kill

# Native Back must close the studio, not discard work or leave a hidden modal.
adb shell input keyevent 4
assert_label "Back to Learn About topics"
tap_label "Make equal shares" 1
assert_label "Make my own version"

studio_first_pid="$(cat "$OUT_DIR/studio-first-offline-launch-pid.txt")"
adb shell am force-stop "$PACKAGE"
sleep 1
launch_app studio-offline-process-relaunch
studio_second_pid="$(cat "$OUT_DIR/studio-offline-process-relaunch-pid.txt")"
test -n "$studio_first_pid"
test -n "$studio_second_pid"
test "$studio_first_pid" != "$studio_second_pid"
open_fraction_studio_from_home
# This button only exists in the saved fraction demonstration mode.
assert_label "Make my own version"
assert_label "Teal"
assert_disabled_studio_control "Next step"
capture_studio_screen studio-after-process-relaunch

tap_label "Explore" 1
assert_label "Part 1: Gold"
assert_label "Part 2: empty"
capture_studio_screen studio-restored-design

# Rotation must preserve the visible studio and the work after rotating back.
adb shell settings put system user_rotation 1
sleep 1
assert_label "Make equal shares"
capture_studio_screen studio-landscape
adb shell settings put system user_rotation 0
sleep 1
assert_label "Part 1: Gold"
assert_label "Part 2: empty"
test "$(adb shell settings get global airplane_mode_on | tr -d '\r')" = "1"
{
  echo "result=passed"
  echo "first_pid=$studio_first_pid"
  echo "second_pid=$studio_second_pid"
  echo "airplane_mode=1"
  echo "restored_activity=studio.fractions.equal-shares"
  echo "restored_mode=watch"
  echo "restored_step=last_category_next_disabled"
  echo "restored_design=part1_gold_part2_empty"
  echo "rotation=landscape_then_portrait"
  echo "native_back=closed_studio"
  echo "checkout=$(git rev-parse HEAD)"
} > "$OUT_DIR/studio-process-relaunch.txt"
echo "Packaged studio airplane-mode process-relaunch proof passed."
