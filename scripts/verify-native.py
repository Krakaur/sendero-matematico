import json, pathlib, zipfile
folder = pathlib.Path('native-artifacts')
apk = next(folder.glob('*.apk'))
with zipfile.ZipFile(apk) as z:
    names = z.namelist()
    assert not any(n.startswith(('assets/', 'lib/')) for n in names), 'Unexpected runtime or web assets'
    for name in names:
        if name.endswith('.dex'):
            assert b'Landroid/webkit/WebView;' not in z.read(name), 'WebView reference'
assert apk.stat().st_size < 1024 * 1024, 'APK exceeds 1 MiB budget'
permissions = (folder / 'permissions.txt').read_text()
assert 'uses-permission' not in permissions, permissions
metadata = (folder / 'metadata.txt').read_text()
assert "sdkVersion:'34'" in metadata and "targetSdkVersion:'36'" in metadata
assert 'maxSdkVersion' not in metadata
(folder / 'verification.json').write_text(json.dumps({'apkBytes': apk.stat().st_size, 'webViewReference': False, 'webAssets': False, 'nativeLibraries': False, 'requestedPermissions': [], 'minSdk': 34, 'targetSdk': 36}, indent=2))
print((folder / 'verification.json').read_text())
