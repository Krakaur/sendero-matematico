# Copias protegidas y límites

Web y Windows exportan un respaldo cifrado con AES-256-GCM y una clave derivada mediante PBKDF2-SHA256 (210 000 iteraciones, sal e IV aleatorios). Conserva historial, adaptación, partida pendiente e informes recibidos. Para recuperar se requiere la contraseña de respaldo y se elige una nueva contraseña de acceso. Una restauración sobre el mismo perfil conserva una copia local previa para recuperación técnica. La invitación docente queda excluida: es necesario volver a vincular el aula.

Android tiene un formato cifrado independiente con los mismos algoritmos. Se guarda mediante el selector de archivos del sistema. Puede restaurarse en una instalación donde no exista ese perfil ni otro con su alias. No reemplaza perfiles existentes ni recupera una contraseña olvidada sin disponer del respaldo y su clave. Los formatos de respaldo Android y web no son intercambiables; los informes educativos JSON sí mantienen su contrato común.

El cifrado protege el archivo exportado. El almacenamiento activo de navegador y SQLite no está cifrado por la aplicación. Las contraseñas locales separan el acceso ordinario, pero no resisten a quien controla el dispositivo, su depuración o sus archivos. La protección de Android y el bloqueo del dispositivo siguen siendo relevantes. No se anuncia cifrado integral de los datos activos.

Las pruebas comprueban contraseña incorrecta, alteración del cifrado, recuperación de identidad y partida, nueva contraseña y rechazo del reemplazo involuntario en Android. Debe ensayarse una recuperación con datos de prueba antes de depender de ella para registros educativos reales.
