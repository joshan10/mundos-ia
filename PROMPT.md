# PROMPT.md — Cómo construí `mundos-ia`

## A. Declaración

**Usé IA: sí.**

Usé IA como apoyo para escribir la estructura inicial, resolver dudas de sintaxis y revisar los mensajes de error. También consulté la guía del taller y los apuntes de las sesiones anteriores para mantener el código dentro de los temas vistos en clase.

## B. Herramienta y modelo

- Herramienta: opencode (asistente de consola).
- Modelo: `deepseek-v4.1-flash-free`.
- Entorno: Node.js 24, Linux, Git y npm.

## C. Prompt inicial completo

Este fue el prompt inicial que usé, adaptado de la plantilla del taller:

```text
Actúa como un instructor de Node.js para principiantes del SENA.
Quiero construir un programa de consola llamado "mundos-ia".

CONTEXTO: solo conozco estos temas: process.argv, módulos con import/export,
el módulo nativo fs (writeFileSync, readFileSync, existsSync, mkdirSync),
path, npm (init, install, scripts), el paquete object-hash, variables de
entorno con .env y process.loadEnvFile, async/await con try/catch y el fetch
nativo de Node. Uso ES Modules, no CommonJS.

OBJETIVO:
1. Recibir por parámetros una situación, un mundo y 5 colores, y guardarlos
   en un objeto JSON en data/mundo_<id>.json.
2. Leer ese JSON y enviarlo con fetch a la API de un modelo de lenguaje para
   que genere la descripción de una imagen. Guardarla en
   descripciones/mundo_<id>.txt.
3. Enviar esa descripción con fetch a la API de un modelo de imágenes y
   guardar la imagen en imagenes/mundo_<id>.jpg.

RESTRICCIONES:
- No uses dotenv, axios, SDK de proveedores, readline, commander ni frameworks.
- Código simple, con comentarios en español numerados ("paso 1", "paso 2"...).
- Las API keys se leen del archivo .env y nunca se escriben en el código.
- Si el .txt o la imagen ya existen, no vuelvas a llamar a las APIs.
- Divide el código en src/index.js, src/mundo.js, src/texto.js y src/imagen.js.

SERVICIOS: texto con Groq (modelo openai/gpt-oss-20b) e imagen con
Pollinations (sin clave). Si Pollinations falla, deja preparado el código
para NVIDIA FLUX.1-schnell o Cloudflare.

FORMA DE RESPONDER: dame un archivo a la vez, explica cada bloque en 2 líneas
y no uses nada que no esté en el CONTEXTO.
```

## D. Prompts siguientes

### Prompt 2

> "Vamos a utilizar module, no EsCommon."

La IA respondió que cambiaría todo a ES Modules. Cambió `require` por `import`, `module.exports` por `export`, agregó `"type": "module"` al `package.json` y reemplazó `__dirname` por `import.meta.dirname`. Revisé que todos los archivos usaran la misma sintaxis y ejecuté el programa para comprobar que funcionaba.

### Prompt 3

> "NVIDIA me está dando timeout. Cambia la imagen a Pollinations y deja el código preparado para NVIDIA y Cloudflare."

La IA agregó una función para Pollinations que hace `GET`, codifica la descripción con `encodeURIComponent` y obtiene los bytes con `Buffer.from(await respuesta.arrayBuffer())`. También dejó las funciones de NVIDIA y Cloudflare. Cambié el `.env` para usar Pollinations y probé con dos mundos.

### Prompt 4

> "Provoca tres errores controlados y guarda la salida en evidencias: clave inválida, modelo inexistente y URL incorrecta."

La IA cambió temporalmente el `.env`, ejecutó el programa con mundos de prueba, guardó los mensajes en archivos y restauró el `.env` original. Verifiqué que los mensajes estuvieran en español y que no mostraran claves.

### Prompt 5

> "Escribe el README con las reflexiones y el experimento de npm publish, y crea PROMPT.md."

La IA redactó el README y este archivo. Revisé que no aparecieran claves reales y ajusté los nombres de las evidencias.

## E. Cambios que hice sobre lo que entregó la IA

1. **Cambié CommonJS por ES Modules.** La primera versión usaba `require` y `module.exports`. Como el taller pedía elegir un sistema y usarlo en todo el proyecto, lo cambié a `import`/`export`, puse `"type": "module"` y usé `import.meta.dirname` para las rutas.
2. **Corregí el nombre de una variable del `.env`.** El archivo tenía `GROQ_API_KEY`, pero el código leía `TEXTO_API_KEY`. El programa decía que faltaba la variable. Renombré la línea y volví a probar.
3. **Cambié el servicio de imagen a Pollinations.** NVIDIA tardó más de 120 segundos y el programa tiene un límite de 60 segundos. Pollinations respondió con un JPEG válido y sin clave. Dejé el código de NVIDIA y Cloudflare por si se quiere cambiar después.
4. **Quité los detalles técnicos de los mensajes de error.** La IA al principio pegaba el cuerpo de la respuesta de la API. Eso puede mostrar información interna o partes de la petición. Lo cambié por los mensajes en español de la tabla del taller.
5. **Aseguré que la imagen se escriba como bytes.** La IA pudo haber usado `writeFileSync` con `'utf8'`; lo dejé sin codificación para no dañar el JPEG.

## F. Una línea que no entendía al principio

```js
const id = objectHash({ situacion, mundo, colores }).slice(0, 8);
```

Entendía que `object-hash` convertía un objeto en un texto único, pero no por qué se cortaba. Con el tiempo entendí que el hash completo es muy largo y que los primeros 8 caracteres alcanzan para identificar el mundo. Como el objeto no incluye `creadoEn`, el mismo mundo siempre produce el mismo id y puedo reutilizar el `.txt` y el `.jpg`.

## G. Un error y cómo lo resolví

Al generar el segundo mundo, Pollinations respondió con el mensaje:

```text
Error: Superaste el límite gratuito. Espera un momento (revisa el encabezado retry-after si existe).
```

El paso 1 y el paso 2 ya habían terminado, así que el JSON y el `.txt` quedaron guardados. Esperé 60 segundos y ejecuté el mismo comando. El programa detectó que la descripción ya existía, no llamó otra vez al modelo de texto y solo generó la imagen. Así comprobé que los resultados parciales se conservan y que no se gasta cuota dos veces.

También tuve un error de configuración: el `.env` tenía `GROQ_API_KEY` pero el código esperaba `TEXTO_API_KEY`. El mensaje era "Falta TEXTO_API_KEY. Configúrala en el archivo .env." Lo resolví renombrando la variable y verificando que el programa leyera la clave correcta.
