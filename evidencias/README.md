# Evidencias

Estos archivos son los registros de terminal de las pruebas realizadas. Se guardaron como texto porque el entorno de ejecución no permite tomar capturas de pantalla gráficas.

- `01_ejecucion_mundo1.txt`: primera ejecución completa del primer mundo.
- `02_ejecucion_mundo2.txt`: segundo mundo. Incluye el primer intento, que guardó el JSON y el texto pero recibió un límite 429 al pedir la imagen, y el reintento exitoso 60 segundos después.
- `03_segunda_ejecucion_reutiliza.txt`: mismo comando del primer mundo; no se llamó a ninguna API.
- `04_error_clave_invalida.txt`: error 401 provocado con una clave falsa.
- `05_error_modelo_inexistente.txt`: error 404 provocado con un modelo que no existe.
- `06_error_url_incorrecta.txt`: error de conexión provocado con un dominio inexistente.
- `07_npm_publish_con_gitignore.txt`: `npm publish --dry-run` con `.gitignore`.
- `08_npm_publish_sin_gitignore.txt`: `npm publish --dry-run` con `.gitignore` renombrado temporalmente.
- `09_git_ls_files.txt`: archivos rastreados por Git, sin `.env`.
- `10_archivos_mundo1.txt` y `11_archivos_mundo2.txt`: contenido del JSON, la descripción y datos de la imagen.
- `mundo_cba86145.*` y `mundo_ed55fd36.*`: copia de los archivos generados de cada mundo.

Las claves reales nunca se incluyeron en estos archivos.
