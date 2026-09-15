"""Offline editorial source. No model/network calls; deterministic build of original items.
Each tuple is a complete authored situation, not a bag of interchangeable synonyms.
The last two situations of each family are reserved for transfer practice.
"""
import collections, hashlib, json, pathlib, random, sqlite3

ROOT = pathlib.Path(__file__).resolve().parents[1]
FAMILIES = {}
def family(key, levels, dimension, hint, explanation, texts):
    FAMILIES[key] = dict(levels=levels, dimension=dimension, hint=hint, explanation=explanation, texts=texts.strip().split('\n'))

family('reunir', [1,2], 'Relacionar cantidades', 'Representa las dos cantidades. ¿Qué ocurre al reunirlas?', '{a} + {b} = {answer}. Se reúnen las dos cantidades.', '''En una mesa hay {a} lápices y en otra hay {b}. ¿Cuántos lápices hay entre las dos mesas?
Luna encontró {a} piedras por la mañana y {b} por la tarde. ¿Cuántas encontró en todo el día?
Un autobús lleva {a} personas. Suben {b} y nadie baja. ¿Cuántas personas lleva ahora?
Para un mural usamos {a} hojas verdes y {b} azules. ¿Cuántas hojas usamos?
En un juego tienes {a} puntos. Ganas {b} más. ¿Cuántos puntos tienes después?
Un equipo recoge {a} botellas y otro recoge {b}. ¿Cuántas pueden entregar juntos?
Hay {a} libros en la repisa. Colocan otros {b}. ¿Cuántos libros quedan en la repisa?
En la primera parada caminamos {a} metros y en la segunda {b}. ¿Cuántos metros caminamos en total?''')
family('quitar', [1,2], 'Relacionar cantidades', 'Dibuja la cantidad inicial y tacha lo que se usa o se va.', '{total} − {b} = {answer}. Esa cantidad permanece.', '''Había {total} semillas. Sembramos {b}. ¿Cuántas quedan sin sembrar?
De {total} sillas, {b} están ocupadas. ¿Cuántas están libres?
Una cuerda mide {total} metros. Cortamos {b} metros. ¿Cuántos metros quedan?
El grupo tenía {total} hojas. Usó {b} para dibujar. ¿Cuántas hojas no se usaron?
En el refugio hay {total} animales. {b} salen al patio. ¿Cuántos permanecen dentro?
Se prepararon {total} vasos de agua y se entregaron {b}. ¿Cuántos faltan por entregar?
De {total} fichas, guardo {b} en una bolsa. ¿Cuántas dejo fuera?
Un camino tiene {total} pasos. Ya recorrí {b}. ¿Cuántos pasos faltan?''')
family('completar', [1,2,3], 'Dato desconocido', 'Busca cuánto falta para llegar a la cantidad final.', '{a} + {answer} = {total}. También puedes calcular {total} − {a}.', '''Necesitamos {total} vasos y ya tenemos {a}. ¿Cuántos faltan?
En una caja había {a} botones. Ahora hay {total}. Si nadie sacó botones, ¿cuántos se añadieron?
La meta es leer {total} páginas. Ya leí {a}. ¿Cuántas me quedan?
Un álbum tiene {total} espacios. Hay {a} ocupados. ¿Cuántos faltan por llenar?
Una planta medía {a} centímetros y ahora mide {total}. ¿Cuántos centímetros creció?
Queremos reunir {total} pesos. Tenemos {a}. ¿Cuántos pesos necesitamos todavía?
Un equipo tiene {a} puntos y quiere llegar a {total}. ¿Cuántos puntos le faltan?
La biblioteca recibió libros y pasó de {a} a {total}. No retiró ninguno. ¿Cuántos recibió?''')
family('comparar', [1,2,3], 'Comparar', 'Empareja las cantidades o calcula la diferencia.', '{total} − {a} = {answer}. La diferencia es la cantidad que no tiene pareja.', '''Ana tiene {total} fichas y Leo tiene {a}. ¿Cuántas fichas más tiene Ana?
Un árbol mide {total} metros y otro {a}. ¿Cuántos metros de diferencia hay?
Una ruta mide {total} metros y otra {a}. ¿Cuántos metros más larga es la primera?
El lunes asistieron {a} personas y el martes {total}. ¿Cuántas personas más asistieron el martes?
Un recipiente tiene {total} litros y otro {a}. ¿Cuántos litros separan las dos cantidades?
El equipo azul ganó {total} puntos y el verde {a}. ¿Por cuántos puntos ganó el azul?
Mara leyó {total} páginas. Saúl leyó {a}. ¿Cuántas páginas necesita leer Saúl para igualarla?
Una cuerda mide {a} centímetros y otra {total}. ¿Cuánto habría que añadir a la corta para igualarlas?''')
family('grupos', [2,3,4], 'Grupos y reparto', 'Representa grupos iguales y cuenta todos sus elementos.', '{a} × {b} = {answer}. Son {a} grupos de {b}.', '''Hay {a} cajas con {b} lápices en cada una. ¿Cuántos lápices hay?
Cada equipo recibe {b} fichas. Hay {a} equipos. ¿Cuántas fichas se necesitan?
Una huerta tiene {a} filas con {b} plantas por fila. ¿Cuántas plantas tiene?
Durante {a} días recogemos {b} botellas cada día. ¿Cuántas recogemos?
Una libreta cuesta {b} pesos. ¿Cuánto cuestan {a} libretas iguales?
Hay {a} bancas y caben {b} personas en cada una. ¿Cuántas personas pueden sentarse?
Cada collar usa {b} cuentas. ¿Cuántas cuentas hacen falta para {a} collares?
En cada página pegamos {b} estampas. Llenamos {a} páginas. ¿Cuántas estampas pegamos?''')
family('repartir', [2,3,4], 'Grupos y reparto', 'Distribuye el total en el número de grupos indicado, sin que sobre nada.', '{product} ÷ {a} = {answer}. Se comprueba con {a} × {answer} = {product}.', '''Repartimos {product} lápices entre {a} cajas por igual. ¿Cuántos van en cada caja?
Tenemos {product} semillas para {a} macetas. Todas reciben lo mismo. ¿Cuántas recibe cada una?
Se distribuyen {product} libros entre {a} estantes iguales. ¿Cuántos libros van en cada estante?
Un grupo de {a} niños comparte {product} fichas por igual. ¿Cuántas fichas recibe cada niño?
Queremos caminar {product} metros en {a} tramos iguales. ¿Cuánto mide cada tramo?
{a} equipos reciben la misma cantidad de hojas. En total reciben {product}. ¿Cuántas recibe cada equipo?
Una cuerda de {product} centímetros se corta en {a} partes iguales. ¿Cuánto mide cada parte?
En {a} días se leen {product} páginas, la misma cantidad cada día. ¿Cuántas páginas se leen al día?''')
family('agrupar', [2,3,4], 'Dato desconocido', 'Averigua cuántas veces cabe el tamaño de un grupo en el total.', '{product} ÷ {b} = {answer}. Caben {answer} grupos de {b}.', '''Tenemos {product} lápices. Ponemos {b} en cada caja. ¿Cuántas cajas llenamos?
Hay {product} plantas y colocamos {b} en cada fila. ¿Cuántas filas formamos?
Cada equipo necesita {b} hojas. Tenemos {product}. ¿Para cuántos equipos alcanza?
Una cuerda de {product} metros se corta en trozos de {b} metros. ¿Cuántos trozos salen?
Un álbum tiene {product} estampas, con {b} en cada página llena. ¿Cuántas páginas se llenaron?
Disponemos de {product} pesos. Cada libreta cuesta {b}. ¿Cuántas podemos comprar?
Cada bolsa lleva {b} semillas. Hay {product} semillas. ¿Cuántas bolsas completas llenamos?
Recorremos {product} metros avanzando {b} metros por turno. ¿Cuántos turnos necesitamos?''')
family('dos_pasos', [3,4], 'Planificar', 'Primero calcula el total de los grupos; después considera lo que se utiliza.', '{a} × {b} = {product}; {product} − {a} = {answer}.', '''Hay {a} cajas con {b} lápices cada una. Prestamos {a} lápices en total. ¿Cuántos quedan?
Se llenan {a} bandejas con {b} vasos cada una. Se rompen {a} vasos en total. ¿Cuántos quedan enteros?
Compramos {a} paquetes de {b} hojas. Usamos {a} hojas en total. ¿Cuántas quedan sin usar?
Sembramos {a} filas de {b} semillas. No brotan {a} semillas en total. ¿Cuántas sí brotan?
Tenemos {a} bolsas con {b} cuentas cada una. Regalamos {a} cuentas en total. ¿Cuántas conservamos?
El grupo reúne {a} veces {b} pesos. Gasta {a} pesos en total. ¿Cuántos pesos conserva?
Llegan {a} equipos de {b} personas. Después se retiran {a} personas en total. ¿Cuántas permanecen?
Cada una de {a} repisas tiene {b} libros. Se prestan {a} libros en total. ¿Cuántos siguen en las repisas?''')
family('perimetro', [3,4], 'Medir y representar', 'El borde de un rectángulo tiene dos lados largos y dos cortos.', '{a} + {b} + {a} + {b} = {answer}. Se suman los cuatro lados.', '''Un jardín rectangular mide {a} metros de largo y {b} de ancho. ¿Cuántos metros mide todo su borde?
Una tarjeta rectangular mide {a} centímetros por {b}. ¿Cuántos centímetros de cinta cubren su borde completo?
Queremos cercar un terreno rectangular de {a} metros por {b}, sin dejar aberturas. ¿Cuántos metros de cerca se necesitan?
Un marco rectangular mide {a} centímetros por {b}. ¿Cuánto suman sus cuatro lados?
Una pista rectangular tiene lados de {a} y {b} metros. ¿Cuántos metros recorres al dar una vuelta completa?
El borde de un mantel rectangular tiene lados de {a} y {b} metros. ¿Cuántos metros de adorno cubren todo el borde?
Un corral rectangular mide {a} por {b} metros. ¿Cuál es su perímetro en metros?
Una hoja rectangular mide {a} por {b} centímetros. Si recorres sus cuatro lados, ¿cuántos centímetros recorres?''')
family('area', [3,4], 'Medir y representar', 'Cuenta cuántas filas de cuadrados hay y cuántos cuadrados tiene cada fila.', '{a} × {b} = {answer}. El resultado cuenta cuadrados, no la longitud del borde.', '''Un piso tiene {a} filas de {b} baldosas cuadradas. ¿Cuántas baldosas lo cubren?
Un dibujo rectangular ocupa {a} filas de {b} cuadritos. ¿Cuántos cuadritos ocupa?
Una pared se cubre con {a} filas de {b} azulejos, sin huecos. ¿Cuántos azulejos se usan?
Un tapete rectangular tiene {a} filas de {b} cuadrados de tela. ¿Cuántos cuadrados contiene?
En una cuadrícula marcas un rectángulo de {a} filas y {b} columnas. ¿Cuántas casillas marcas?
Un mosaico tiene {a} filas con {b} piezas cuadradas en cada fila. ¿Cuántas piezas tiene?
Un rectángulo mide {a} metros por {b} metros. ¿Cuántos cuadrados de un metro de lado lo cubren?
Un tablero se forma con {a} filas de {b} casillas. ¿Cuántas casillas tiene en total?''')
family('fraccion', [3,4], 'Partes iguales', 'Una parte debe tener el mismo tamaño que las demás. Divide el total entre el número de partes.', '{product} ÷ {a} = {answer}. Es una de las {a} partes iguales del total.', '''De {product} semillas, guardamos una de {a} partes iguales. ¿Cuántas semillas guardamos?
Una cinta mide {product} centímetros. Usamos una de {a} partes iguales. ¿Cuántos centímetros usamos?
Una colección tiene {product} fichas. Pintamos una de {a} partes iguales. ¿Cuántas fichas pintamos?
De un camino de {product} metros recorremos una de {a} partes iguales. ¿Cuántos metros recorrimos?
Un libro tiene {product} páginas. Leo una de {a} partes iguales. ¿Cuántas páginas leo?
Tenemos {product} pesos. Gastamos una de {a} partes iguales. ¿Cuántos pesos gastamos?
Un depósito tiene {product} litros. Sacamos una de {a} partes iguales. ¿Cuántos litros sacamos?
En un álbum de {product} estampas completas una de {a} partes iguales. ¿Cuántas estampas colocaste?''')
family('datos', [1,2,3,4], 'Interpretar datos', 'Lee solo las categorías que pide la pregunta. No siempre se usan todos los datos.', '{a} + {b} = {answer}. La tercera categoría no se incluye en la pregunta.', '''Registro de frutas: peras {a}, manzanas {b}, limones {total}. ¿Cuántas peras y manzanas hay juntas?
Conteo de transporte: bicicletas {a}, motos {total}, autobuses {b}. ¿Cuántas bicicletas y autobuses se contaron?
Préstamos de libros: cuentos {a}, poesía {b}, ciencia {total}. ¿Cuántos cuentos y libros de poesía se prestaron?
Resultados de una encuesta: prefieren dibujar {a}, cantar {b}, correr {total}. ¿Cuántos prefieren dibujar o cantar?
Recogida de residuos: papel {total}, botellas {a}, latas {b}. ¿Cuántas botellas y latas se recogieron?
Vivero: árboles {a}, arbustos {total}, flores {b}. ¿Cuántos árboles y flores hay?
Materiales: pinceles {b}, reglas {total}, lápices {a}. ¿Cuántos pinceles y lápices hay?
Asistencia por actividad: teatro {total}, huerta {a}, lectura {b}. ¿Cuántas asistencias suman huerta y lectura?''')
family('patron', [1,2,3,4], 'Reconocer relaciones', 'Comprueba cuánto aumenta cada número. Mantén ese mismo aumento.', 'Cada paso aumenta {a}. Después de {triple} viene {answer}.', '''Un contador aumenta siempre lo mismo: {a}, {double}, {triple}. ¿Qué número sigue?
Marcamos distancias con el mismo salto: {a}, {double}, {triple} metros. ¿Cuál es la siguiente marca?
Una máquina suma siempre la misma cantidad. Muestra {a}, {double}, {triple}. ¿Qué mostrará después?
Una fila de tarjetas sigue este patrón: {a}, {double}, {triple}. Se suma lo mismo cada vez. ¿Qué tarjeta sigue?
Los puntos acumulados avanzan con igual aumento: {a}, {double}, {triple}. ¿Cuál será el siguiente total?
Un tablero numérico repite el mismo salto: {a}, {double}, {triple}. ¿En qué número cae el siguiente salto?
Un reloj de juego cuenta de {a} en {a}: {a}, {double}, {triple}. ¿Qué número mostrará después?
En una cinta escribimos números separados por la misma diferencia: {a}, {double}, {triple}. ¿Cuál sigue?''')
family('tiempo', [2,3,4], 'Medir y representar', 'Son horas del mismo día. Cuenta el tiempo desde el inicio hasta el final.', 'Desde las {a}:00 hasta las {total}:00 pasan {answer} horas.', '''La biblioteca abre a las {a}:00 y cierra a las {total}:00 del mismo día. ¿Cuántas horas está abierta?
Una excursión empieza a las {a}:00 y termina a las {total}:00 del mismo día. ¿Cuántas horas dura?
Regamos desde las {a}:00 hasta las {total}:00 del mismo día. ¿Cuántas horas transcurren?
Un taller comienza a las {a}:00 y acaba a las {total}:00 del mismo día. ¿Cuántas horas dura?
Un viaje sale a las {a}:00 y llega a las {total}:00 del mismo día. ¿Cuántas horas pasa viajando?
La exposición se visita desde las {a}:00 hasta las {total}:00 del mismo día. ¿Cuántas horas se puede visitar?
Una tarea empieza a las {a}:00 y termina a las {total}:00 del mismo día. ¿Cuántas horas pasan?
El centro educativo permanece abierto de {a}:00 a {total}:00 del mismo día. ¿Cuántas horas abre?''')
family('representar', [1,2,3,4], 'Elegir representación', 'Elige una expresión que describa lo que ocurre, antes de calcular.', 'La expresión {a} + {b} representa reunir las dos cantidades.', '''Reúnes {a} semillas de una bolsa y {b} de otra. ¿Qué expresión representa el total?
Un autobús llevaba {a} personas. Suben {b} y nadie baja. ¿Qué expresión representa cuántas lleva ahora?
De {total} fichas guardas {b} en una caja. ¿Qué expresión representa las fichas que quedan fuera?
Una biblioteca tiene {total} libros y presta {b}. ¿Qué expresión representa los libros que conserva?
Hay {a} mesas con {b} vasos en cada una. ¿Qué expresión representa todos los vasos?
Recorres {a} tramos de {b} metros cada uno. ¿Qué expresión representa la distancia total?
Un grupo entrega {a} dibujos y otro {b}. ¿Qué expresión representa los dibujos reunidos?
De {total} monedas gastas {b}. ¿Qué expresión representa las monedas que conservas?''')
family('dato_faltante', [2,3,4], 'Información suficiente', 'Distingue lo que ya sabes de lo que necesitas para responder.', 'Necesitas conocer cuántos elementos hay en cada grupo. El número de grupos por sí solo no basta.', '''Hay {a} cajas iguales con lápices, pero no sabemos cuántos lápices contiene cada caja. Para saber el total de lápices, ¿qué dato falta?
Se preparan {a} bolsas iguales con semillas. No se dice cuántas semillas lleva cada bolsa. Para hallar el total, ¿qué dato falta?
Un vivero tiene {a} filas iguales de plantas. No conocemos cuántas plantas hay en cada fila. Para contar todas las plantas, ¿qué dato falta?
Compramos {a} paquetes iguales de hojas. No conocemos las hojas por paquete. Para calcular todas las hojas, ¿qué dato falta?
Un álbum tiene {a} páginas llenas con la misma cantidad de estampas. Para contar las estampas, ¿qué dato falta?
Formamos {a} equipos del mismo tamaño. No conocemos las personas por equipo. Para calcular todas las personas, ¿qué dato falta?
Hay {a} repisas con igual cantidad de libros. Para saber cuántos libros hay en total, ¿qué dato falta?
Preparamos {a} collares con igual cantidad de cuentas. Para saber cuántas cuentas se usaron, ¿qué dato falta?''')

def make_values(key, level, rng):
    hi=[5,10,20,40][level-1]
    a,b=rng.randint(2,hi),rng.randint(2,hi)
    if key in ('grupos','repartir','agrupar','dos_pasos','area','perimetro','fraccion'):
        a,b=rng.randint(2,[3,5,10,12][level-1]),rng.randint(2,[5,6,10,20][level-1])
    if key=='fraccion': a=rng.choice([2,3,4,5])
    if key=='tiempo': a,b=rng.randint(*{2:(6,8),3:(9,11),4:(12,14)}[level]),rng.randint(1,4)
    if key in ('dato_faltante','patron'): a=rng.randint(*[(2,5),(6,10),(11,20),(21,40)][level-1])
    if key=='representar' and a==b: b+=1
    v=dict(a=a,b=b,total=a+b,product=a*b,double=2*a,triple=3*a)
    answer={'reunir':a+b,'quitar':a,'completar':b,'comparar':b,'grupos':a*b,'repartir':b,'agrupar':a,'dos_pasos':a*b-a,'perimetro':2*(a+b),'area':a*b,'fraccion':b,'datos':a+b,'patron':4*a,'tiempo':b,'representar':0,'dato_faltante':0}[key]
    return v|dict(answer=answer)

def build():
    rng=random.Random(20260915); rows=[]; texts=set(); template_count=0
    for key,f in FAMILIES.items():
        assert len(f['texts'])==8
        for ti,text in enumerate(f['texts']):
            template_count+=1
            for level in f['levels']:
                made=0
                for attempt in range(4000):
                    v=make_values(key,level,rng); prompt=text.format(**v)
                    if prompt in texts: continue
                    texts.add(prompt)
                    q=dict(id=f'{key}-{ti+1}-L{level}-{made+1:02}',template=f'{key}-{ti+1}',family=key,context=f'{key}-{ti+1}',level=level,pool='transfer' if ti>=6 else 'practice',dimension=f['dimension'],prompt=prompt,hintText=f['hint'],explanation=f['explanation'].format(**v),**{k:v[k] for k in ('a','b','answer')})
                    if key in ('representar','dato_faltante'):
                        q['labels']=([f"{v['a']} + {v['b']}",f"{v['a']} − {v['b']}",f"{v['a']} × {v['b']}",f"{v['a']} ÷ {v['b']}"] if key=='representar' else ['La cantidad en cada grupo','El color de los objetos','El nombre de quien cuenta','La hora a la que empezaron'])
                        q['options']=[0,1,2,3]
                        if key=='representar':
                            if ti in (2,3,7): q['labels']=[f"{v['total']} − {v['b']}",f"{v['total']} + {v['b']}",f"{v['total']} × {v['b']}",f"{v['total']} ÷ {v['b']}"]
                            if ti in (4,5): q['labels']=[f"{v['a']} × {v['b']}",f"{v['a']} + {v['b']}",f"{v['a']} − {v['b']}",f"{v['a']} ÷ {v['b']}"]
                            q['explanation']='La expresión '+q['labels'][0]+(' representa quitar una cantidad del total.' if ti in (2,3,7) else ' representa grupos iguales.' if ti in (4,5) else ' representa reunir dos cantidades.')
                    else:
                        opts={v['answer']}
                        while len(opts)<4: opts.add(max(0,v['answer']+rng.randint(-5,5)))
                        q['options']=sorted(opts)
                    q['solution']=q.get('labels',[str(i) for i in range(0)])[0] if 'labels' in q else str(q['answer'])
                    rows.append(q); made+=1
                    if made==20: break
                assert made>=4,(key,ti,level,made)
    assets=ROOT/'native-android/app/src/main/assets';assets.mkdir(parents=True,exist_ok=True)
    db=assets/'bank-0.3.0.db'
    if db.exists(): db.unlink()
    with sqlite3.connect(db) as con:
        con.execute('CREATE TABLE items(id TEXT PRIMARY KEY,level INTEGER,pool TEXT,template TEXT,family TEXT,context TEXT,body TEXT)')
        con.executemany('INSERT INTO items VALUES(?,?,?,?,?,?,?)',[(q['id'],q['level'],q['pool'],q['template'],q['family'],q['context'],json.dumps(q,ensure_ascii=False,separators=(',',':'))) for q in rows])
        con.execute('CREATE INDEX selection ON items(level,pool)');con.commit();con.execute('VACUUM')
    (ROOT/'web/bank-data.js').write_text('export const BANK_VERSION="0.3.0";\nexport const BANK='+json.dumps(rows,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    counts=collections.Counter((q['level'],q['pool']) for q in rows)
    manifest=dict(version='0.3.0',authorship='Original AI-assisted editorial content, generated before distribution. No runtime AI.',review='Internal mathematical and editorial review; independent teacher review pending.',templates=template_count,items=len(rows),families=len(FAMILIES),uniquePrompts=len(texts),counts={f'L{l}-{p}':n for (l,p),n in sorted(counts.items())},sha256=hashlib.sha256(db.read_bytes()).hexdigest(),databaseBytes=db.stat().st_size)
    (ROOT/'docs/BANK-MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(manifest,ensure_ascii=False,indent=2))
if __name__=='__main__': build()
