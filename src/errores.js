function crearErrorDeRed(error) {
    if (error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        const errorTiempo = new Error('El servicio tardó demasiado en responder.');
        errorTiempo.code = 'TIMEOUT';
        errorTiempo.cause = error;
        return errorTiempo;
    }

    const errorConexion = new Error('No se pudo conectar. Revisa tu internet o la URL.');
    errorConexion.code = 'NETWORK';
    errorConexion.cause = error;
    return errorConexion;
}

async function crearErrorDeRespuesta(respuesta) {
    let mensaje;

    switch (respuesta.status) {
        case 401:
        case 403:
            mensaje = 'La API key no es válida. Revisa tu archivo .env.';
            break;
        case 402:
        case 429:
            mensaje = 'Superaste el límite gratuito. Espera un momento (revisa el encabezado retry-after si existe).';
            break;
        case 404:
        case 410:
            mensaje = 'El modelo o la URL no existen. Revisa tu configuración.';
            break;
        default:
            mensaje = `El servicio respondió con un error (${respuesta.status}). Inténtalo de nuevo.`;
    }

    try {
        await respuesta.text();
    } catch (error) {
    }

    const error = new Error(mensaje);
    error.status = respuesta.status;
    error.retryAfter = respuesta.headers.get('retry-after');
    return error;
}

export {
    crearErrorDeRed,
    crearErrorDeRespuesta
};
