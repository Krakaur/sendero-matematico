"""Isolated test origin: 0.3.0 cache -> current web; synthetic browser data only.

Run from repo root. Write 'new' to qa-private/upgrade-mode.txt to switch.
"""
import io
import subprocess
import zipfile
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

root = Path.cwd()
old = root / 'qa-private' / 'web-upgrade'
old.mkdir(parents=True, exist_ok=True)
archive = subprocess.check_output(['git', 'archive', '--format=zip', '1979973^', 'web'])
with zipfile.ZipFile(io.BytesIO(archive)) as z:
    z.extractall(old)
marker = root / 'qa-private' / 'upgrade-mode.txt'
marker.write_text('old', encoding='utf-8')

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Archive extraction timestamps do not represent the deployed revision.
        # Do not let Last-Modified produce a false 304 when switching roots.
        if 'If-Modified-Since' in self.headers:
            del self.headers['If-Modified-Since']
        super().do_GET()

    def __init__(self, *args, **kwargs):
        directory = root / 'web' if marker.read_text(encoding='utf-8').strip() == 'new' else old / 'web'
        super().__init__(*args, directory=str(directory), **kwargs)

ThreadingHTTPServer(('127.0.0.1', 4174), Handler).serve_forever()
