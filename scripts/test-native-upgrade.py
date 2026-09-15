"""Release-to-release upgrade through visible Android UI; synthetic profile only."""
import json, pathlib, re, subprocess, sys, time, urllib.request, xml.etree.ElementTree as ET
OUT=pathlib.Path('native-evidence')
def adb(*args):
    return subprocess.check_output(['adb',*args],text=True)
def nodes():
    adb('shell','uiautomator','dump','/data/local/tmp/upgrade.xml')
    return list(ET.fromstring(adb('shell','cat','/data/local/tmp/upgrade.xml')).iter('node'))
def tap(node):
    x,y,x2,y2=map(int,re.findall(r'\d+',node.attrib['bounds']))
    adb('shell','input','tap',str((x+x2)//2),str((y+y2)//2));time.sleep(.5)
def text(label):
    for _ in range(12):
        for n in nodes():
            if n.attrib.get('text')==label: tap(n);return
        time.sleep(.5)
    raise AssertionError('UI text not found: '+label)
def enter(fields):
    edits=[n for n in nodes() if n.attrib.get('class')=='android.widget.EditText']
    assert len(edits)==len(fields)
    for n,value in zip(edits,fields):
        tap(n);adb('shell','input','text',value);adb('shell','input','keyevent','111')
def start():
    adb('shell','am','start','-W','-n','org.krakaur.sendero.nativo/.MainActivity');time.sleep(1)

previous=OUT/'previous-0.2.0.apk'
urllib.request.urlretrieve('https://github.com/Krakaur/sendero-matematico/releases/download/v0.2.0/Sendero-Nativo-0.2.0.apk',previous)
adb('install',str(previous));start();text('Crear perfil');enter(['Continuidad','prueba-local','prueba-local']);text('Crear');time.sleep(2)
text('+  El bosque de las sumas')
for n in nodes():
    match=re.fullmatch(r'(\d+) \+ (\d+) = \?',n.attrib.get('text',''))
    if match: answer=sum(map(int,match.groups()));break
else: raise AssertionError('Arithmetic question missing')
text(str(answer));adb('shell','am','force-stop','org.krakaur.sendero.nativo')
adb('install','-r',sys.argv[1]);start();text('Continuidad');enter(['prueba-local']);text('Entrar');time.sleep(2);text('Continuar mi camino')
assert any(n.attrib.get('text')==f'¡{match.group(1)} + {match.group(2)} = {answer}!' for n in nodes())
(OUT/'upgrade.json').write_text(json.dumps({'from':'0.2.0','to':'0.3.0','samePackageAndSignature':True,'profileAndPasswordPreserved':True,'pendingAnswerPreserved':True},indent=2))
adb('shell','am','force-stop','org.krakaur.sendero.nativo');start()
print('Release upgrade preserves synthetic profile, password and pending answer.')
