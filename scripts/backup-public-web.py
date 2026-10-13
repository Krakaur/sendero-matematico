"""Preserve the published branch and verify every public file before replacing it."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib, json, subprocess, urllib.request, sys

root = Path(__file__).resolve().parents[1]
destination = Path(sys.argv[1]).resolve()
base = 'https://krakaur.github.io/sendero-matematico/'
destination.mkdir(parents=True, exist_ok=False)
commit = subprocess.check_output(['git','rev-parse','origin/gh-pages'], cwd=root, text=True).strip()
subprocess.run(['git','archive','--format=zip','--output='+str(destination/'published-branch.zip'),commit],cwd=root,check=True)
files = subprocess.check_output(['git','ls-tree','-r','--name-only',commit],cwd=root,text=True).splitlines()
def preserve(name):
    expected = subprocess.check_output(['git','show',f'{commit}:{name}'],cwd=root)
    request = urllib.request.Request(base+name, headers={'Cache-Control':'no-cache'})
    with urllib.request.urlopen(request,timeout=45) as response:
        actual=response.read()
        headers={k:response.headers.get(k) for k in ('ETag','Last-Modified','Content-Type')}
    output=destination/'public-files'/name
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_bytes(actual)
    return {'file':name,'url':base+name,'bytes':len(actual),'sha256':hashlib.sha256(actual).hexdigest(),'branch_sha256':hashlib.sha256(expected).hexdigest(),'matches_branch':actual==expected,'headers':headers}
with ThreadPoolExecutor(max_workers=4) as pool:
    records=list(pool.map(preserve,files))
archive=destination/'published-branch.zip'
manifest={'captured_utc':datetime.now(timezone.utc).isoformat(),'public_url':base,'source_commit':commit,'archive_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'files':records,'all_files_match_branch':all(r['matches_branch'] for r in records)}
(destination/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(destination/'RESTORE.txt').write_text('Published web backup before replacement.\nSource gh-pages commit: '+commit+'\nThe ZIP contains the full deployable web. Public-files contains the downloaded HTTP bytes.\nTo roll back, create a new gh-pages commit restoring the ZIP contents and push normally; do not rewrite branch history.\nProfile data lives in each browser and is not part of this server backup.\n',encoding='utf-8')
print(json.dumps({'directory':str(destination),'source_commit':commit,'file_count':len(records),'all_files_match_branch':manifest['all_files_match_branch']}))
if not manifest['all_files_match_branch']: sys.exit(2)
