"""Fail the package build if offline assets, permissions, or size diverge."""
import hashlib
import json
from pathlib import Path
import zipfile

out = Path('android-artifacts')
apk = next(out.glob('*.apk'))
manifest = []
with zipfile.ZipFile(apk) as archive:
    assert not any(p.startswith('lib/') for p in archive.namelist()), 'Unexpected native libraries'
    for source in sorted(Path('web').iterdir()):
        if not source.is_file():
            continue
        packed = archive.read('assets/' + source.name)
        assert packed == source.read_bytes(), f'Asset mismatch: {source}'
        manifest.append({'path': str(source), 'bytes': len(packed), 'sha256': hashlib.sha256(packed).hexdigest()})
assert apk.stat().st_size < 5_000_000, 'APK exceeds 5 MB budget'
permissions = (out / 'apk-permissions.txt').read_text()
assert 'uses-permission:' not in permissions, permissions
(out / 'apk-assets.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'APK: {apk.stat().st_size} bytes; {len(manifest)} exact web assets; no permissions or native libraries')
