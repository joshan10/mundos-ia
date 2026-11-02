# mundos-ia

Programa de consola que recibe una situación, un mundo y cinco colores, y genera un boceto visual de ese mundo imaginario. Primero guarda los datos en un JSON, después pide a un modelo de lenguaje una descripción de la imagen y finalmente envía esa descripción a un modelo de imágenes para guardar el resultado.

## Requisitos

- Node.js 20.12 o superior (`node -v`).
- npm y Git.
- Una cuenta gratuita en un servicio de texto (Groq o NVIDIA) y, si se quiere, en uno de imágenes (NVIDIA o Cloudflare). La opción de imágenes con Pollinations no necesita clave.

## Instalación y configuración

```bash
git clone <url-del-repositorio> mundos-ia
cd mundos-ia
npm install
cp .env.example .env
```

Después edita `.env` con tus claves. El archivo `.env` nunca se sube a Git.

Variables del proyecto:

| Variable | Para qué sirve |
| --- | --- |
| `TEXTO_API_KEY` | Clave del servicio de texto. |
| `TEXTO_URL` | URL del endpoint de texto. |
| `TEXTO_MODELO` | Nombre del modelo de texto. |
| `IMAGEN_API_KEY` | Clave del servicio de imágenes. Puede quedar vacía con Pollinations. |
| `IMAGEN_URL` | URL del endpoint de imágenes. |

Ejemplo con **Groq** para texto y **Pollinations** para imagen (la configuración usada en esta entrega):

```env
TEXTO_API_KEY=tu_clave_de_groq
TEXTO_URL=https://api.groq.com/openai/v1/chat/completions
TEXTO_MODELO=openai/gpt-oss-20b

IMAGEN_API_KEY=
IMAGEN_URL=https://image.pollinations.ai/prompt
```

Para usar **NVIDIA FLUX.1-schnell** en la imagen, cambia las dos últimas variables:

```env
IMAGEN_API_KEY=tu_clave_nvapi
IMAGEN_URL=https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell
```

El código también reconoce una URL de **Cloudflare Workers AI** y toma la imagen de `result.image`.

Servicios y enlaces:

- Groq: <https://console.groq.com/keys> y <https://console.groq.com/docs/models>.
- NVIDIA FLUX.1-schnell: <https://build.nvidia.com/black-forest-labs/flux_1-schnell>.
- Cloudflare Workers AI: <https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/>.
- Pollinations: <https://enter.pollinations.ai>.

## Uso

```bash
npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta
```

Las comillas son necesarias para que la situación y el mundo lleguen como un solo argumento. Deben llegar exactamente 7 argumentos: situación, mundo y 5 colores distintos.

Salida esperada la primera vez:

```text
Paso 1: mundo guardado en data/mundo_cba86145.json
Paso 2: descripción guardada en descripciones/mundo_cba86145.txt
Paso 3: imagen guardada en imagenes/mundo_cba86145.jpg
Listo. Revisa la carpeta imagenes/
```

Si se repite el mismo comando, no se vuelve a llamar a las APIs:

```text
Paso 1: mundo guardado en data/mundo_cba86145.json
Paso 2: la descripción ya existía, no se llamó al modelo de texto.
Paso 3: la imagen ya existía, no se llamó al modelo de imágenes.
Listo. Revisa la carpeta imagenes/
```

## Estructura

```text
mundos-ia/
├── src/
│   ├── index.js      # orquesta los pasos 1 a 3
│   ├── mundo.js      # valida, crea, guarda y lee el mundo
│   ├── texto.js      # consulta el modelo de lenguaje
│   ├── imagen.js     # consulta el modelo de imágenes y devuelve bytes
│   └── errores.js    # traduce errores de red y de HTTP al español
├── data/             # mundos en JSON (se crea al ejecutar)
├── descripciones/    # descripciones en .txt (se crea al ejecutar)
├── imagenes/         # imágenes .jpg (se crea al ejecutar)
├── evidencias/       # capturas y registros de las pruebas
├── .env              # claves reales (NO se sube a Git)
├── .env.example      # plantilla sin claves
├── .gitignore
├── package.json
├── README.md
└── PROMPT.md
```

## Cómo funciona

1. `src/index.js` recibe `process.argv`, valida los argumentos y llama a `crearMundo`.
2. `crearMundo` calcula el id con `object-hash` sobre `{ situacion, mundo, colores }` y toma los primeros 8 caracteres. La fecha `creadoEn` no entra en el hash.
3. `guardarMundo` crea `data/` si hace falta y escribe `data/mundo_<id>.json` con `JSON.stringify(objeto, null, 2)`.
4. `index.js` vuelve a leer el JSON desde el disco con `leerMundo` y llama a `describirMundo`.
5. `texto.js` envía el JSON como mensaje de usuario a la API de texto y devuelve un párrafo en inglés de 80 a 120 palabras. La descripción se guarda en `descripciones/mundo_<id>.txt`.
6. `index.js` lee la descripción desde el `.txt` y llama a `generarImagen`.
7. `imagen.js` obtiene los bytes de la imagen y `index.js` los escribe con `writeFileSync` en `imagenes/mundo_<id>.jpg`, sin codificación `utf-8`.

## Ahorro de cuota

- El id es determinista: los mismos datos producen siempre el mismo id.
- Antes de llamar al modelo de texto se comprueba `fs.existsSync` del `.txt`.
- Antes de llamar al modelo de imágenes se comprueba `fs.existsSync` del `.jpg`.
- Si un paso falla, los archivos anteriores se conservan. Al repetir el comando, el programa continúa desde el paso que faltó.
- La descripción se lee desde el archivo guardado, no desde una variable en memoria, para que el flujo use siempre lo que quedó en disco.

## Manejo de errores

| Situación | Reconocimiento | Mensaje |
| --- | --- | --- |
| Clave inválida o sin permisos | HTTP 401 o 403 | La API key no es válida. Revisa tu archivo .env. |
| Límite de uso | HTTP 402 o 429 | Superaste el límite gratuito. Espera un momento (revisa el encabezado retry-after si existe). |
| Modelo o URL incorrectos | HTTP 404 o 410 | El modelo o la URL no existen. Revisa tu configuración. |
| Sin conexión o URL mal escrita | `fetch` lanza `TypeError` | No se pudo conectar. Revisa tu internet o la URL. |
| Tiempo de espera agotado | `error.name === 'TimeoutError'` | El servicio tardó demasiado en responder. |

Las claves se leen de `.env` y nunca se imprimen en consola ni se incluyen en los mensajes de error.

## Servicios elegidos

Para esta entrega usé **Groq** (`openai/gpt-oss-20b`) para el texto y **Pollinations** para la imagen. Pollinations no necesita clave y sirve para pruebas individuales. En un salón de clase, todos los equipos comparten la misma IP y el límite de Pollinations (una imagen cada 45 segundos) no alcanza; en ese caso se recomienda NVIDIA o Cloudflare.

El código de `src/imagen.js` también soporta NVIDIA FLUX.1-schnell y Cloudflare Workers AI. Solo hay que cambiar `IMAGEN_URL` e `IMAGEN_API_KEY` en `.env`.

## Experimento de `npm publish --dry-run`

Con `.gitignore` presente, npm lo usa como respaldo porque no hay `.npmignore`. El paquete incluye `package.json`, `README.md`, `PROMPT.md`, `.env.example`, los archivos de `src/` y las evidencias, pero no aparecen `.env`, `data/`, `descripciones/` ni `imagenes/`.

Al renombrar temporalmente `.gitignore` a `.gitignore.off`, npm deja de tener reglas de exclusión y el `--dry-run` muestra también `.env`, los JSON de `data/`, los `.txt` de `descripciones/` y los `.jpg` de `imagenes/`. Esto es peligroso porque un `npm publish` real subiría las claves de `.env` al registro público de npm. Cualquiera podría leerlas y gastar la cuota o acceder a los servicios. Por eso el `.gitignore` debe existir siempre y `.env` nunca debe publicarse. Después del experimento se restauró el nombre `.gitignore`.

Las capturas de ambos resultados están en `evidencias/07_npm_publish_con_gitignore.txt` y `evidencias/08_npm_publish_sin_gitignore.txt`.

## Preguntas de reflexión

**¿Por qué el id se calcula sin la fecha? ¿Qué pasaría si la incluyeras?**
Porque el id debe depender solo de los datos del mundo para ser reproducible. Si incluyera `creadoEn`, cada ejecución generaría un id distinto, no encontraría los archivos anteriores y volvería a llamar a las dos APIs, gastando cuota y duplicando archivos.

**¿Por qué se le pide al modelo de texto la descripción en inglés?**
Los modelos de imágenes suelen estar entrenados con más textos en inglés y entienden mejor las indicaciones de escena, iluminación y estilo. Una descripción en español puede funcionar, pero suele perder matices o producir resultados menos fieles. No hice una comparación con español para no gastar cuota; la decisión se basa en la recomendación del taller.

**¿Qué diferencia hay entre una respuesta JSON de texto y una respuesta con los bytes de una imagen? ¿Qué es base64?**
Una respuesta JSON de texto es texto UTF-8 que se puede leer y parsear con `JSON.parse`. Una imagen es un archivo binario. Base64 es una codificación que convierte esos bytes binarios en caracteres ASCII para poder viajar dentro de un JSON; después se recuperan con `Buffer.from(texto, 'base64')`.

**¿Qué pasaría si guardas la imagen con `'utf-8'`? ¿Por qué?**
El archivo quedaría dañado porque `utf-8` interpreta los bytes binarios como texto y reemplaza las secuencias que no son válidas. La imagen no se abriría o se vería incompleta. Por eso se escribe el `Buffer` directamente, sin pasar una codificación.

**¿Qué pasos consumen cuota gratuita y cómo evitaste repetirlos?**
La llamada al modelo de texto y la llamada al modelo de imágenes consumen cuota. Se evitan con `fs.existsSync` sobre el `.txt` y el `.jpg`, y con un id determinista que siempre apunta a los mismos archivos. Si un paso falla, el siguiente intento reutiliza lo que ya está guardado.

**Si usaste IA: ¿qué fue lo más difícil de pedirle y qué parte tuviste que corregir tú?**
Fue difícil lograr que respetara solo las herramientas vistas en clase y que usara ES Modules de forma consistente. Corregí el paso de CommonJS a ES Modules, ajusté el manejo de los tres servicios de imagen y verifiqué que los mensajes de error no mostraran detalles técnicos ni claves.

## Evidencias

En la carpeta `evidencias/` están los registros de terminal de cada prueba (capturas en texto):

- `01_ejecucion_mundo1.txt`: primera ejecución completa.
- `02_ejecucion_mundo2.txt`: segundo mundo; incluye el primer intento con límite 429 y el reintento exitoso.
- `03_segunda_ejecucion_reutiliza.txt`: mismo comando, sin llamadas a las APIs.
- `04_error_clave_invalida.txt`, `05_error_modelo_inexistente.txt`, `06_error_url_incorrecta.txt`: errores provocados.
- `07_npm_publish_con_gitignore.txt` y `08_npm_publish_sin_gitignore.txt`: experimento de publicación.
- `09_git_ls_files.txt`: archivos rastreados por Git, sin `.env`.
- `10_archivos_mundo1.txt` y `11_archivos_mundo2.txt`: JSON, descripción y datos de la imagen de cada mundo.
- `mundo_*.json`, `mundo_*.txt` y `mundo_*.jpg`: copia de los archivos generados.

## Seguridad

- `.env` está en `.gitignore` y no se versiona.
- `.env.example` no contiene claves reales.
- Si una clave se filtra, se debe revocar en la consola del servicio y crear otra.
- Las claves no se escriben en el código ni se muestran en los mensajes de error.

## Autor y licencia

Joshan Pereira — Licencia MIT.
