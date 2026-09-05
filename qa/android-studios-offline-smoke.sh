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

open_fraction_studio_from_home() {
  tap_label "Open child navigation"
  tap_label "Open practice activities"
  tap_label "Open Learn About"
  tap_label "Learn about Fractions"
  tap_label "Make equal shares"
}

adb shell am force-stop "$PACKAGE"
launch_app studio-first-offline-launch
open_fraction_studio_from_home
assert_label "Part 1: empty"
tap_label "Part 1: empty"
assert_label "Part 1: Gold"
tap_label "Show me"
tap_label "Next step"
assert_disabled_studio_control "Next step"
assert_label "Make my own version"
capture_studio_screen studio-before-process-kill

# Native Back must close the studio, not discard work or leave a hidden modal.
adb shell input keyevent 4
assert_label "Back to Learn About topics"
tap_label "Make equal shares"
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

tap_label "Explore"
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
