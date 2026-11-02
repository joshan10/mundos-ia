import path from 'node:path';
import { crearErrorDeRed, crearErrorDeRespuesta } from './errores.js';

try {
    process.loadEnvFile(path.join(import.meta.dirname, '..', '.env'));
} catch (error) {
}

const TIMEOUT_MS = 60000;

function validarConfiguracion() {
    const apiUrl = process.env.IMAGEN_URL?.trim();

    if (!apiUrl) {
        throw new Error('Falta IMAGEN_URL. Configúrala en el archivo .env.');
    }

    const usaPollinations = apiUrl.includes('pollinations');
    const apiKey = process.env.IMAGEN_API_KEY?.trim();

    if (!usaPollinations && !apiKey) {
        throw new Error('Falta IMAGEN_API_KEY. Configúrala en el archivo .env.');
    }

    return { apiKey, apiUrl, usaPollinations };
}

async function pedirImagenPollinations(descripcion, apiUrl) {
    const base = apiUrl.replace(/\/+$/, '');
    const url = `${base}/${encodeURIComponent(descripcion)}?width=1024&height=1024&nologo=true`;
    let respuesta;

    try {
        respuesta = await fetch(url, {
            method: 'GET',
            signal: AbortSignal.timeout(TIMEOUT_MS)
        });
    } catch (error) {
        throw crearErrorDeRed(error);
    }

    if (!respuesta.ok) {
        throw await crearErrorDeRespuesta(respuesta);
    }

    const bytes = Buffer.from(await respuesta.arrayBuffer());

    if (bytes.length === 0) {
        throw new Error('El modelo de imágenes no devolvió datos.');
    }

    return bytes;
}

async function pedirImagenCloudflare(descripcion, apiUrl, apiKey) {
    let respuesta;

    try {
        respuesta = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                prompt: descripcion,
                steps: 4
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS)
        });
    } catch (error) {
        throw crearErrorDeRed(error);
    }

    if (!respuesta.ok) {
        throw await crearErrorDeRespuesta(respuesta);
    }

    let datos;

    try {
        datos = await respuesta.json();
    } catch (error) {
        throw new Error('La API de imágenes devolvió una respuesta que no es un JSON válido.');
    }

    const textoBase64 = datos?.result?.image;

    if (typeof textoBase64 !== 'string' || !textoBase64.trim()) {
        throw new Error('El modelo de imágenes no devolvió la imagen esperada.');
    }

    const bytes = Buffer.from(textoBase64, 'base64');

    if (bytes.length === 0) {
        throw new Error('El modelo de imágenes no devolvió datos.');
    }

    return bytes;
}

async function pedirImagenNvidia(descripcion, apiUrl, apiKey) {
    let respuesta;

    try {
        respuesta = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                prompt: descripcion,
                width: 1024,
                height: 1024,
                steps: 4,
                seed: 0
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS)
        });
    } catch (error) {
        throw crearErrorDeRed(error);
    }

    if (!respuesta.ok) {
        throw await crearErrorDeRespuesta(respuesta);
    }

    let datos;

    try {
        datos = await respuesta.json();
    } catch (error) {
        throw new Error('La API de imágenes devolvió una respuesta que no es un JSON válido.');
    }

    const artifact = datos?.artifacts?.[0];

    if (!artifact) {
        throw new Error('El modelo de imágenes no devolvió la imagen esperada.');
    }

    if (artifact.finishReason !== 'SUCCESS') {
        throw new Error('El modelo de imágenes no pudo generar la imagen (finishReason distinto de SUCCESS).');
    }

    const textoBase64 = artifact.base64;

    if (typeof textoBase64 !== 'string' || !textoBase64.trim()) {
        throw new Error('El modelo de imágenes no devolvió la imagen esperada.');
    }

    const bytes = Buffer.from(textoBase64, 'base64');

    if (bytes.length === 0) {
        throw new Error('El modelo de imágenes no devolvió datos.');
    }

    return bytes;
}

async function generarImagen(descripcion) {
    if (typeof descripcion !== 'string' || !descripcion.trim()) {
        throw new Error('La descripción no puede estar vacía para generar la imagen.');
    }

    const { apiKey, apiUrl, usaPollinations } = validarConfiguracion();
    const descripcionLimpia = descripcion.trim();

    if (usaPollinations) {
        return pedirImagenPollinations(descripcionLimpia, apiUrl);
    }

    if (apiUrl.includes('cloudflare')) {
        return pedirImagenCloudflare(descripcionLimpia, apiUrl, apiKey);
    }

    return pedirImagenNvidia(descripcionLimpia, apiUrl, apiKey);
}

export {
    generarImagen,
    TIMEOUT_MS
};
