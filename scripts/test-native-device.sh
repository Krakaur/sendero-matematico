#!/usr/bin/env bash
set -euo pipefail
mkdir -p native-evidence
adb shell getprop > native-evidence/device.txt
adb shell pm list packages | tr -d '\r' | sed 's/^package://' | grep -E 'webview|chrome' > native-evidence/browser-packages.txt || true
while read -r package; do
  adb shell pm disable-user --user 0 "$package"
done < native-evidence/browser-packages.txt
adb shell pm list packages -d > native-evidence/disabled-packages.txt
adb shell dumpsys webviewupdate > native-evidence/webview-status.txt
set +e
gradle -p native-android --no-daemon connectedDebugAndroidTest
result=$?
adb shell dumpsys meminfo org.krakaur.sendero.nativo > native-evidence/memory.txt
adb pull /sdcard/Android/data/org.krakaur.sendero.nativo/files/ native-evidence/screenshots || true
adb logcat -d -s AndroidRuntime > native-evidence/crashes.txt
exit "$result"
