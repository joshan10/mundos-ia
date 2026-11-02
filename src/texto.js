import path from 'node:path';
import { crearErrorDeRed, crearErrorDeRespuesta } from './errores.js';

try {
    process.loadEnvFile(path.join(import.meta.dirname, '..', '.env'));
} catch (error) {
}

const TIMEOUT_MS = 30000;
const MAX_CARACTERES = 1500;

const MENSAJE_SISTEMA = [
    'Eres un director de arte especializado en concept art para videojuegos.',
    'Responde únicamente con un párrafo en inglés de entre 80 y 120 palabras.',
    'Describe una imagen: la escena, los elementos principales, la iluminación, la composición y el estilo artístico.',
    'No escribas un cuento ni una historia.',
    'Menciona los cinco colores del mundo (puedes traducirlos al inglés).',
    'No incluyas títulos, formato markdown ni texto escrito dentro de la imagen.'
].join(' ');

function validarConfiguracion() {
    const apiKey = process.env.TEXTO_API_KEY?.trim();
    const apiUrl = process.env.TEXTO_URL?.trim();
    const modelo = process.env.TEXTO_MODELO?.trim();

    if (!apiKey) {
        throw new Error('Falta TEXTO_API_KEY. Configúrala en el archivo .env.');
    }

    if (!apiUrl) {
        throw new Error('Falta TEXTO_URL. Configúrala en el archivo .env.');
    }

    if (!modelo) {
        throw new Error('Falta TEXTO_MODELO. Configúralo en el archivo .env.');
    }

    return { apiKey, apiUrl, modelo };
}

async function describirMundo(mundo) {
    if (!mundo || typeof mundo !== 'object') {
        throw new Error('El mundo debe ser un objeto válido para pedir la descripción.');
    }

    const { apiKey, apiUrl, modelo } = validarConfiguracion();
    let respuesta;

    try {
        respuesta = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelo,
                messages: [
                    { role: 'system', content: MENSAJE_SISTEMA },
                    { role: 'user', content: JSON.stringify(mundo) }
                ]
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
        throw new Error('La API de texto devolvió una respuesta que no es un JSON válido.');
    }

    let descripcion = datos?.choices?.[0]?.message?.content;

    if (typeof descripcion !== 'string' || !descripcion.trim()) {
        throw new Error('El modelo de texto no devolvió ninguna descripción.');
    }

    descripcion = descripcion.trim();

    if (descripcion.length > MAX_CARACTERES) {
        descripcion = descripcion.slice(0, MAX_CARACTERES).trim();
        console.warn(`Aviso: la descripción superaba ${MAX_CARACTERES} caracteres y se recortó.`);
    }

    return descripcion;
}

export {
    describirMundo,
    MENSAJE_SISTEMA,
    TIMEOUT_MS,
    MAX_CARACTERES
};
