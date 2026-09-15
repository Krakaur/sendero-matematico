#!/usr/bin/env bash
set -euo pipefail
mkdir -p native-evidence
adb shell getprop > native-evidence/device.txt
adb shell pm list packages | tr -d '\r' | sed 's/^package://' | grep -E 'webview|chrome' > native-evidence/browser-packages.txt || true
while read -r package; do
  adb shell pm disable-user --user 0 "$package" </dev/null
done < native-evidence/browser-packages.txt
adb shell pm list packages -d | tr -d '\r' > native-evidence/disabled-packages.txt
adb shell dumpsys webviewupdate > native-evidence/webview-status.txt
# adb shell must not consume the loop's package list through stdin.
# Require every discovered browser/provider package to actually remain disabled.
while read -r package; do
  grep -Fxq "package:$package" native-evidence/disabled-packages.txt
done < native-evidence/browser-packages.txt
set +e
gradle -p native-android --no-daemon connectedDebugAndroidTest
result=$?
adb shell dumpsys meminfo org.krakaur.sendero.nativo > native-evidence/memory.txt
adb pull /sdcard/Android/data/org.krakaur.sendero.nativo/files/ native-evidence/screenshots || true
for evidence in $(adb shell ls /data/local/tmp/sendero-\*.png | tr -d '\r'); do
  adb pull "$evidence" native-evidence/ || true
done
adb logcat -d -s AndroidRuntime > native-evidence/crashes.txt
adb logcat -d > native-evidence/logcat.txt
if [ "$result" -eq 0 ]; then
  adb uninstall org.krakaur.sendero.nativo || true
  adb install dist-candidate/native-artifacts/Sendero-Nativo-0.3.0.apk
  adb shell am start -W -n org.krakaur.sendero.nativo/.MainActivity > native-evidence/release-launch.txt
  sleep 2
  adb shell uiautomator dump /data/local/tmp/sendero-release.xml
  adb pull /data/local/tmp/sendero-release.xml native-evidence/
  grep -q 'Cada explorador' native-evidence/sendero-release.xml || result=1
  adb shell dumpsys meminfo org.krakaur.sendero.nativo > native-evidence/release-memory.txt
fi
exit "$result"
