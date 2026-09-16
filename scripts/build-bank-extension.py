"""Add original situations without modifying any published 0.3.0 item."""
import json,random,sqlite3,pathlib,hashlib
root=pathlib.Path(__file__).resolve().parents[1]
rng=random.Random(400);rows=[];seen=set()
templates={
'posicion':('Valor posicional',2,[
'Para el huerto reunieron {a} bolsas de diez semillas y {b} semillas sueltas. ¿Cuántas semillas hay?',
'Una cooperativa preparó {a} paquetes de diez tarjetas y dejó {b} tarjetas sin empacar. ¿Cuántas tarjetas preparó?',
'En el inventario aparecen {a} decenas de cuadernos y {b} unidades. ¿Cuántos cuadernos son?',
'En la biblioteca juntaron {a} grupos de diez etiquetas y {b} etiquetas adicionales. ¿Cuántas etiquetas juntaron?']),
'decimal':('Cantidades decimales',3,[
'Para un cartel compraron una cinta de {x} metros y otra de {y} metros. ¿Cuántos metros compraron en total?',
'Un recipiente tiene {x} litros de agua y agregan {y} litros. ¿Cuántos litros tiene ahora?',
'Dos equipos recogieron {x} y {y} kilogramos de papel. ¿Cuántos kilogramos reunieron entre ambos?',
'Una caminata tiene dos tramos: {x} y {y} kilómetros. ¿Cuántos kilómetros mide todo el recorrido?']),
'equivalencia':('Fracciones equivalentes',3,[
'Una receta usa {a}/{b} de litro. ¿Qué fracción expresa la misma cantidad?',
'El grupo pintó {a}/{b} del mural. ¿Qué fracción representa la misma parte pintada?',
'De una cinta se ocupó {a}/{b} de su longitud. ¿Qué otra fracción indica esa misma parte?',
'Un depósito está lleno hasta {a}/{b} de su capacidad. ¿Qué fracción representa el mismo nivel?']),
'unidades':('Relaciones entre unidades',3,[
'Una mesa mide {a} decímetros de largo. Cada decímetro equivale a diez centímetros. ¿Cuántos centímetros mide?',
'Para decorar el aula cortaron {a} decímetros de listón. Si un decímetro son diez centímetros, ¿cuántos centímetros cortaron?',
'El tallo de una planta mide {a} decímetros. Sabiendo que cada decímetro tiene diez centímetros, ¿cuántos centímetros mide?',
'Un estante tiene {a} decímetros de ancho. Cada decímetro son diez centímetros. ¿Cuántos centímetros tiene de ancho?']),
'comparacion':('Comparar números',2,[
'Un equipo reunió {x} tapas y otro reunió {y}. ¿Cuál de esas dos cantidades es menor?',
'Dos cajas tienen {x} y {y} lápices. ¿Cuántos lápices contiene la caja con menos lápices?',
'Dos rutas miden {x} y {y} metros. ¿Cuántos metros mide la ruta más corta?',
'Dos estantes tienen {x} y {y} libros. ¿Cuántos libros tiene el estante con menos libros?'])}
decimal=lambda x:f'{x//10},{x%10}'
for family,(dimension,level,texts) in templates.items():
 for ti,text in enumerate(texts):
  made=0
  for attempt in range(500):
   a,b=rng.randint(1,9),rng.randint(0,9);labels=None
   values={'a':a,'b':b}
   if family=='posicion':answer=10*a+b;explanation=f'{a} decenas son {a*10}; al sumar {b} unidades se obtiene {answer}.'
   elif family=='decimal':
    a,b=rng.randint(1,49),rng.randint(1,49);values={'x':decimal(a),'y':decimal(b)}
    labels=[decimal(a+b),decimal(a+b+1),decimal(abs(a-b)),decimal(a+b+10)];answer=0
    explanation=f'Se suman las cantidades: {decimal(a)} + {decimal(b)} = {decimal(a+b)}. La coma separa la parte entera de los décimos.'
   elif family=='equivalencia':
    b=rng.choice([4,8]);a=rng.randint(1,b-1);values={'a':a,'b':b}
    labels=[f'{2*a}/{2*b}',f'{a}/{2*b}',f'{a+1}/{b+1}',f'{a}/{b+1}'];answer=0
    explanation=f'Al multiplicar numerador y denominador por dos, {a}/{b} se escribe {2*a}/{2*b}; la cantidad representada no cambia.'
   elif family=='unidades':
    a=rng.randint(1,30);b=10;values={'a':a};answer=a*10
    explanation=f'Hay diez centímetros en cada decímetro: {a} × 10 = {answer} centímetros.'
   else:
    a,b=rng.randint(1,49),rng.randint(1,49)
    if a==b:continue
    values={'x':a,'y':b};answer=min(a,b);explanation=f'{min(a,b)} es menor que {max(a,b)}. Compara primero las decenas y, si coinciden, las unidades.'
   prompt=text.format(**values)
   if prompt in seen:continue
   seen.add(prompt);options=[0,1,2,3] if labels else sorted(set([answer,max(0,answer-1),answer+1,answer+10]))
   if len(options)!=4:continue
   q=dict(id=f'ext04-{family}-{ti}-{made}',template=f'ext04-{family}-{ti}',family=family,context=['huerto','aula','comunidad','biblioteca'][ti],dimension=dimension,level=level,pool='transfer' if ti==3 else 'practice',a=a,b=b,answer=answer,options=options,prompt=prompt,explanation=explanation,solution=labels[0] if labels else str(answer),hintText='Representa las cantidades y revisa qué dato necesitas encontrar.',contentVersion='0.4.0')
   if labels:q['labels']=labels
   rows.append(q);made+=1
   if made==20:break
(root/'web/bank-extra.js').write_text('export const EXTRA_BANK='+json.dumps(rows,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
old=root/'native-android/app/src/main/assets/bank-0.3.0.db';dest=old.with_name('bank-0.4.0.db')
if dest.exists():dest.unlink()
with sqlite3.connect(old) as src,sqlite3.connect(dest) as out:
 src.backup(out)
 out.executemany('INSERT INTO items VALUES(?,?,?,?,?,?,?)',[(q['id'],q['level'],q['pool'],q['template'],q['family'],q['context'],json.dumps(q,ensure_ascii=False,separators=(',',':'))) for q in rows]);out.commit();out.execute('VACUUM')
manifest={'version':'0.4.0','newItems':len(rows),'newTemplates':20,'newFamilies':len(templates),'preservedItems':6270,'total':6270+len(rows),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'review':'Internal consistency review; independent teacher review pending.'}
(root/'docs/BANK-EXTENSION-0.4.0.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8');print(json.dumps(manifest))
