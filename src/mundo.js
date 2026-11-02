import fs from 'node:fs';
import path from 'node:path';
import objectHash from 'object-hash';

const RUTA_DATA = path.join(import.meta.dirname, '..', 'data');
const RUTA_DESCRIPCIONES = path.join(import.meta.dirname, '..', 'descripciones');
const RUTA_IMAGENES = path.join(import.meta.dirname, '..', 'imagenes');

const CANTIDAD_COLORES = 5;
const CANTIDAD_ARGUMENTOS = 2 + CANTIDAD_COLORES;

function mostrarUso() {
    console.log('Uso:');
    console.log('  npm start -- "<situación>" "<mundo>" <color1> <color2> <color3> <color4> <color5>');
    console.log('');
    console.log('Ejemplo:');
    console.log('  npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta');
    console.log('');
    console.log('Recuerda usar comillas cuando la situación o el mundo tengan espacios.');
}

function validarArgumentos(argumentos) {
    if (!Array.isArray(argumentos) || argumentos.length !== CANTIDAD_ARGUMENTOS) {
        throw new Error(
            `Deben llegar exactamente ${CANTIDAD_ARGUMENTOS} argumentos: una situación, un mundo y ${CANTIDAD_COLORES} colores.`
        );
    }

    const limpios = argumentos.map((argumento) => String(argumento).trim());

    if (limpios.some((argumento) => argumento.length === 0)) {
        throw new Error('Ningún argumento puede estar vacío ni tener solo espacios.');
    }

    const [situacion, mundo, ...colores] = limpios;
    const coloresNormalizados = colores.map((color) => color.toLocaleLowerCase('es'));

    if (new Set(coloresNormalizados).size !== colores.length) {
        throw new Error('Los 5 colores deben ser distintos (sin distinguir mayúsculas de minúsculas).');
    }

    return { situacion, mundo, colores };
}

function crearMundo(argumentos) {
    const { situacion, mundo, colores } = validarArgumentos(argumentos);
    const id = objectHash({ situacion, mundo, colores }).slice(0, 8);
    const creadoEn = new Date().toISOString();

    return { id, situacion, mundo, colores, creadoEn };
}

function guardarMundo(mundo) {
    fs.mkdirSync(RUTA_DATA, { recursive: true });

    const ruta = path.join(RUTA_DATA, `mundo_${mundo.id}.json`);
    fs.writeFileSync(ruta, JSON.stringify(mundo, null, 2), 'utf8');

    return ruta;
}

function leerMundo(ruta) {
    let contenido;

    try {
        contenido = fs.readFileSync(ruta, 'utf8');
    } catch (error) {
        throw new Error(`No se pudo leer el mundo guardado en ${ruta}.`);
    }

    try {
        return JSON.parse(contenido);
    } catch (error) {
        throw new Error(`El archivo ${ruta} no contiene un JSON válido.`);
    }
}

function rutaMundo(id) {
    return path.join(RUTA_DATA, `mundo_${id}.json`);
}

function rutaDescripcion(id) {
    return path.join(RUTA_DESCRIPCIONES, `mundo_${id}.txt`);
}

function rutaImagen(id) {
    return path.join(RUTA_IMAGENES, `mundo_${id}.jpg`);
}

export {
    RUTA_DATA,
    RUTA_DESCRIPCIONES,
    RUTA_IMAGENES,
    CANTIDAD_COLORES,
    CANTIDAD_ARGUMENTOS,
    mostrarUso,
    validarArgumentos,
    crearMundo,
    guardarMundo,
    leerMundo,
    rutaMundo,
    rutaDescripcion,
    rutaImagen
};
