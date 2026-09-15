# Firma, reputación y distribución de Sendero

Fecha de consulta: 15 de septiembre de 2026. Alcance: decisión de distribución para un juego educativo gratuito dirigido a primaria. Las tarifas y condiciones siguientes corresponden a documentación oficial consultada en esta fecha; deberán comprobarse de nuevo al tramitar una publicación.

## Conclusión y estado del proyecto

Sendero no necesita comprar un «certificado de seguridad» genérico para continuar su distribución actual. La web puede mantenerse en GitHub Pages con HTTPS; Android admite la firma propia que ya utiliza el proyecto. Windows constituye un problema diferente: el ejecutable portable está configurado sin firma Authenticode y puede provocar advertencias o bloqueos. Una firma comercial puede identificar al editor, pero no garantiza reputación inmediata ni ausencia de detecciones.

La recomendación económica es conservar la web como entrada pública, ofrecer la APK firmada para uso Android sin conexión y mantener Windows como descarga opcional con su estado de firma declarado. Si las advertencias de Windows impiden el uso escolar, conviene evaluar primero Microsoft Store mediante MSIX y, como alternativa para descarga directa, la elegibilidad de SignPath Foundation. iOS debe seguir identificado como adaptación pendiente; actualmente no existe un proyecto Xcode ni una IPA de Sendero.

El estado técnico se apoya en `package.json`, la [documentación Android](ANDROID-DISTRIBUCION.md) y la [planificación iOS](IOS-PENDIENTE.md). Esta evaluación no sustituye la verificación de cada binario publicado ni demuestra aprobación de ninguna tienda.

## Qué acredita cada mecanismo

**HTTPS/TLS** protege la comunicación con el sitio frente a lectura o modificación en tránsito y permite autenticar el dominio. GitHub ofrece HTTPS para Pages, y los sitios actuales bajo `github.io` lo reciben automáticamente. No es necesario comprar un certificado TLS para [la página de Sendero](https://krakaur.github.io/sendero-matematico/). Esa protección no firma la APK o el ejecutable ni certifica su calidad educativa. [GitHub: HTTPS en Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

**La firma de código** vincula un artefacto con una clave y permite comprobar integridad y continuidad de publicación. La confianza atribuida al certificado depende de cada plataforma. **La reputación** es una valoración adicional del archivo o editor realizada por servicios de seguridad. **La revisión de tienda** comprueba políticas de un canal determinado. Ninguno de estos mecanismos demuestra por sí solo eficacia pedagógica, ausencia absoluta de vulnerabilidades o compatibilidad universal.

Un SHA-256 publicado permite comprobar que dos archivos son idénticos. Su utilidad depende de que la referencia provenga de una fuente confiable; no reemplaza una firma ni genera reputación. Para Sendero interesa publicar versión, procedencia y huellas de los artefactos definitivos, conservando la misma identidad de publicación.

## Windows: ejecutable directo, firma y Store

### Descarga del portable

El proyecto configura `win.signExecutable=false`. La distribución directa de este EXE no exige que el autor compre una firma, pero su ejecución queda sujeta a Windows y a las políticas del equipo. SmartScreen considera la reputación del archivo y del editor: un archivo nuevo puede mostrar advertencias incluso con certificado válido. Microsoft indica además que los certificados EV ya no conceden reputación inmediata. Smart App Control puede bloquear archivos sin firma y sin reputación suficiente; las políticas institucionales pueden impedir continuar. No debe presentarse una advertencia de «aplicación desconocida» como prueba de malware, ni utilizarse esa distinción para descartar una detección concreta. [Microsoft: reputación de SmartScreen](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation).

Un certificado autofirmado de Windows no se reconoce automáticamente. Distribuir raíces de confianza a las familias añade administración y no se recomienda para Sendero. [Microsoft: opciones de firma](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options).

### Microsoft Store

Store firma gratuitamente los paquetes **MSIX** después de certificarlos; la ruta **MSI/EXE** exige firma previa del editor. La instalación desde Store evita avisos de SmartScreen, aunque siguen existiendo otros controles. Para Sendero, preparar MSIX exige comprobar instalación, actualización y persistencia; subir el portable actual no resuelve ese trabajo. [Microsoft: diferencias entre MSIX y MSI/EXE](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options).

La documentación vigente del nuevo registro de Partner Center indica **sin tarifa de inscripción para cuentas individuales y de empresa**. Deben comprobarse disponibilidad efectiva y verificación de identidad al abrir la cuenta; no corresponde repetir como vigente una tarifa histórica. La selección del titular y tipo de cuenta importa: Microsoft no admite convertir directamente una cuenta individual en cuenta de empresa. El empaquetado tampoco garantiza aceptación. [Microsoft: apertura de una cuenta de desarrollador](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account).

### Alternativas para firmar descargas directas

Artifact Signing parte de aproximadamente **9,99 USD/mes** y admite personas de Estados Unidos y Canadá; para organizaciones añade Unión Europea y Reino Unido. No se presupone elegibilidad mexicana. Los certificados OV/EV comerciales requieren cotización. [Microsoft: disponibilidad y opciones](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options).

**SignPath Foundation** ofrece firma gratuita a proyectos de código abierto que satisfacen sus condiciones. Entre ellas figuran licencia aprobada por OSI, ausencia de componentes propietarios incompatibles, mantenimiento activo, publicación previa y documentación. Sendero declara MIT, pero esa licencia por sí sola no demuestra que todo el proyecto sea elegible. La Fundación establece controles sobre la compilación y figura como editor del certificado. Requiere solicitud y aceptación; no se dispone todavía de aprobación. [SignPath Foundation: condiciones](https://signpath.org/terms.html).

Una detección concreta de Defender debe investigarse con el archivo exacto, hash y nombre de detección. Microsoft dispone de un procedimiento para disputar clasificaciones erróneas; no ofrece una lista preventiva de software garantizado ni una aprobación perpetua. No se recomienda desactivar el antivirus para distribuir Sendero. [Microsoft: preguntas para desarrolladores](https://learn.microsoft.com/en-us/defender-xdr/developer-faq).

## Android: la firma propia es válida; la identidad verificada es otra obligación

### APK y continuidad de actualizaciones

Android exige firma para instalar una APK y admite certificados autofirmados generados por el desarrollador, sin una autoridad certificadora comercial. Por tanto, **no hace falta comprar un certificado para sustituir la firma propia de Sendero**. La firma de producción debe conservarse y protegerse; una identidad distinta puede impedir actualizar instalaciones existentes. Esto no equivale a usar la clave pública y conocida de depuración. [Android Open Source Project: firma de aplicaciones](https://source.android.com/docs/security/features/apksigning).

Play Protect puede analizar aplicaciones externas a Play y recomendar un análisis de una aplicación desconocida. Una firma válida no elimina todos sus controles. La instalación desde una fuente externa también puede requerir autorización del usuario o administrador. La ausencia de permiso de internet en Sendero no desactiva los controles del sistema operativo. [Google: funcionamiento de Play Protect](https://support.google.com/googleplay/answer/2812853?hl=es).

### Publicación en Google Play

Google Play cobra **25 USD una sola vez por la cuenta**, además de verificar identidad y, cuando corresponde, acceso a un dispositivo Android. Para cuentas personales creadas después del 13 de noviembre de 2023, se requieren pruebas cerradas con al menos **12 participantes inscritos continuamente durante 14 días**, antes de solicitar acceso a producción. Cumplir el periodo no garantiza aprobación. [Registro en Play Console](https://support.google.com/googleplay/android-developer/answer/6112435), [requisitos de pruebas](https://support.google.com/googleplay/android-developer/answer/14151465?hl=es).

El AAB se carga en Play; Google genera y firma las APK mediante **Play App Signing**. La clave de carga y la clave que firma las aplicaciones instaladas cumplen funciones distintas. Antes del primer envío debe decidirse cómo preservar actualizaciones entre la APK directa y Play: Google permite proporcionar la clave existente; si genera otra, no debe suponerse compatibilidad automática entre canales. Esa decisión requiere intervención del titular mediante el procedimiento seguro de Google. [Android: Play App Signing](https://developer.android.com/studio/publish/app-signing).

Por dirigirse a primaria, Sendero debe declarar correctamente su audiencia y atender las políticas de Familias, privacidad, contenido y tratamiento de datos aplicables. Ser gratuito, carecer de publicidad y funcionar localmente no elimina la revisión. Los pendientes de ficha, pruebas y declaraciones se detallan en la documentación Android. [Google Play: políticas de Familias](https://support.google.com/googleplay/android-developer/answer/9893335?hl=es).

### Verificación de desarrolladores: calendario de 2026 y límite documental

La página principal vigente de Android establece el **30 de septiembre de 2026** como primer hito para instalaciones desde tiendas participantes en **Brasil, Indonesia, Singapur y Tailandia**, en dispositivos certificados con Android 7 o posterior; anuncia expansión global a todas las aplicaciones en 2027. México no figura en ese primer grupo. Esto registra identidad y paquetes; no exige adquirir un certificado comercial. [Android: alcance y calendario](https://developer.android.com/developer-verification).

Hay una diferencia entre fuentes oficiales: la guía de distribución limitada, actualizada el 20 de agosto de 2026, describe de forma más amplia la imposibilidad de instalar paquetes no registrados en esos cuatro países desde esa fecha, mientras que la página principal limita el hito a tiendas participantes. Por ello, **no se afirma aquí un bloqueo universal de toda APK descargada directamente el 30 de septiembre**. Antes de distribuir en esos países deberá confirmarse el alcance efectivo para ese canal y dispositivo. [Guía de distribución limitada](https://developer.android.com/developer-verification/guides/limited-distribution), [calendario principal](https://developer.android.com/developer-verification).

Android Developer Console permite **distribución limitada gratuita hasta 20 dispositivos autorizados** mediante consentimiento y enlaces o códigos QR. No requiere identificación gubernamental adicional, pero sí cuenta Google, verificación en dos pasos y perfil de pagos con nombre y dirección. Es una opción para un piloto pequeño; no cubre una distribución escolar extensa. La cuenta de distribución completa de ADC tiene una tarifa de **25 USD**. ADC sirve a quienes distribuyen fuera de Play y no equivale a obtener una ficha en esa tienda; quien ya utiliza Play debe revisar su vía desde Play Console. [Distribución limitada](https://developer.android.com/developer-verification/guides/limited-distribution), [preguntas de verificación y tarifas](https://developer.android.com/developer-verification/guides/faq).

### F-Droid

F-Droid es otra opción para software libre, sujeta a sus criterios de inclusión y preparación de compilación. Puede conservar firmas del desarrollador cuando verifica compilaciones reproducibles; la continuidad de firma debe resolverse antes de adoptar el canal. No basta con alojar el repositorio en GitHub para aparecer en su catálogo, y abrir otro canal añade mantenimiento. Se propone como alternativa posterior, no como requisito del piloto. [F-Droid: preguntas para desarrolladores](https://f-droid.org/docs/FAQ_-_App_Developers/).

## iPhone y iPad

La APK y el AAB no sirven para iOS. Una aplicación distribuida mediante App Store o TestFlight exige el proyecto y compilación correspondientes, firma y perfiles Apple y la participación en Apple Developer Program. La tarifa publicada es **99 USD por año**, o importe local disponible. Algunas instituciones educativas acreditadas, entidades sin fines de lucro y organismos públicos pueden solicitar exención; ser docente o publicar gratuitamente a título personal no concede automáticamente esa condición. [Apple: modalidades de distribución](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases), [membresía](https://developer.apple.com/programs/whats-included/), [exenciones](https://developer.apple.com/help/account/membership/fee-waivers/).

TestFlight es un canal de pruebas y cada compilación caduca a los **90 días**. La distribución ad hoc exige registrar dispositivos y tiene un límite de **100 por familia de producto y año de membresía**. Alojar una IPA en GitHub no permite instalarla universalmente. Las modalidades alternativas dependen de región y requisitos específicos; no se asume que habiliten una descarga directa general en México. [TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview), [dispositivos ad hoc](https://developer.apple.com/help/account/devices/devices-overview), [distribución por región](https://developer.apple.com/programs/whats-included/).

Mientras tanto, la web es la alternativa de menor coste. Apple permite añadir un sitio a la pantalla de inicio; esto no acredita almacenamiento persistente ni disponibilidad sin conexión en todos los dispositivos. Sendero necesita pruebas concretas de primera carga, reinicio, conservación de datos y exportación antes de prometer equivalencia con la APK local. [Apple: aplicaciones web en iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).

## Decisión propuesta y próximos pasos

Para el piloto, se propone mantener los canales existentes y dedicar el esfuerzo a verificar dispositivos reales, integridad de descargas, actualización y conservación de informes. No hay justificación económica inmediata para adquirir un certificado Android ni un EV de Windows. Las incidencias reales deberán clasificarse por producto y mensaje: reputación desconocida, detección de malware, bloqueo institucional o fallo de instalación requieren respuestas diferentes.

Si se necesita una instalación Windows más accesible, el titular deberá decidir si publica con cuenta individual o institucional y si autoriza preparar MSIX para Store; la documentación vigente sitúa esa ruta sin tarifa de inscripción ni compra de certificado de firma. Si prefiere conservar exclusivamente el EXE directo, corresponde decidir una solicitud a SignPath o asumir el coste de una firma comercial y el mantenimiento de su identidad.

Para Android, las decisiones pendientes son el tamaño del público, los países de destino y la conveniencia de Play frente a distribución directa. Un piloto de hasta 20 dispositivos puede evaluar ADC limitado; una difusión amplia requiere revisar registro completo y calendario. Antes de Play debe acordarse la continuidad de la clave existente y prepararse la revisión para audiencia infantil. Para iOS debe confirmarse demanda, disponibilidad de entorno macOS y dispositivos, titularidad y presupuesto anual o elegibilidad institucional.

No se han abierto cuentas, comprado certificados, solicitado admisión, enviado paquetes a tiendas ni obtenido aprobaciones. Tampoco se afirma que las descargas actuales estén exentas de advertencias. La conclusión es una recomendación de distribución proporcionada al alcance actual de Sendero, con requisitos identificados y decisiones pendientes de su titular.
