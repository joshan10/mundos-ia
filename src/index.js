import fs from 'node:fs';
import path from 'node:path';
import {
    crearMundo,
    guardarMundo,
    leerMundo,
    mostrarUso,
    rutaDescripcion,
    rutaImagen
} from './mundo.js';
import { describirMundo } from './texto.js';
import { generarImagen } from './imagen.js';

function rutaVisible(ruta) {
    const relativa = path.relative(process.cwd(), ruta);
    return relativa && !relativa.startsWith('..') ? relativa : ruta;
}

async function main() {
    const argumentos = process.argv.slice(2);
    let mundo;

    try {
        mundo = crearMundo(argumentos);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        mostrarUso();
        process.exitCode = 1;
        return;
    }

    const rutaJson = guardarMundo(mundo);
    console.log(`Paso 1: mundo guardado en ${rutaVisible(rutaJson)}`);

    const mundoGuardado = leerMundo(rutaJson);
    const rutaTxt = rutaDescripcion(mundoGuardado.id);
    let descripcion;

    if (fs.existsSync(rutaTxt)) {
        descripcion = fs.readFileSync(rutaTxt, 'utf8').trim();

        if (descripcion) {
            console.log('Paso 2: la descripción ya existía, no se llamó al modelo de texto.');
        } else {
            console.warn('Aviso: la descripción guardada estaba vacía. Se volverá a generar.');
            descripcion = await describirMundo(mundoGuardado);
            fs.mkdirSync(path.dirname(rutaTxt), { recursive: true });
            fs.writeFileSync(rutaTxt, `${descripcion}\n`, 'utf8');
            console.log(`Paso 2: descripción guardada en ${rutaVisible(rutaTxt)}`);
        }
    } else {
        descripcion = await describirMundo(mundoGuardado);
        fs.mkdirSync(path.dirname(rutaTxt), { recursive: true });
        fs.writeFileSync(rutaTxt, `${descripcion}\n`, 'utf8');
        console.log(`Paso 2: descripción guardada en ${rutaVisible(rutaTxt)}`);
    }

    const descripcionGuardada = fs.readFileSync(rutaTxt, 'utf8').trim();

    if (!descripcionGuardada) {
        throw new Error('La descripción guardada está vacía. No se puede generar la imagen.');
    }

    const rutaJpg = rutaImagen(mundoGuardado.id);

    if (fs.existsSync(rutaJpg)) {
        console.log('Paso 3: la imagen ya existía, no se llamó al modelo de imágenes.');
    } else {
        const bytes = await generarImagen(descripcionGuardada);

        if (!bytes || bytes.length === 0) {
            throw new Error('El modelo de imágenes no devolvió datos.');
        }

        fs.mkdirSync(path.dirname(rutaJpg), { recursive: true });
        fs.writeFileSync(rutaJpg, bytes);
        console.log(`Paso 3: imagen guardada en ${rutaVisible(rutaJpg)}`);
    }

    console.log('Listo. Revisa la carpeta imagenes/');
}

main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
});
