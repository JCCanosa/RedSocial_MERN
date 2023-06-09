// Importar depencias o modulos
const jwt = require('jwt-simple')
const moment = require('moment')

// Importas clave secreta
const libjwt = require('../services/jwt')
const secret = libjwt.secret

// Funcion de autenticación
exports.auth = (req, res, next) => {
    // Comprobar si me llega la cabecera de autenticación
    if (!req.headers.authorization) {
        return res.status(403).send({
            status: 'error',
            message: 'Falta cabecera de autenticación'
        })
    }

    // Sanear el token
    let token = req.headers.authorization.replace(/['"]+/g, '')

    // Decodificar el token
    try {
        let payload = jwt.decode(token, secret)

        // Comporbar expiración token
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({
                status: 'error',
                message: 'Token expirado'
            })
        }

        // Agregar datos de usuario a la request
        req.user = payload
        
    } catch (error) {
        return res.status(404).send({
            status: 'error',
            message: 'Token no válido'
        })
    }

    // Pasar a ejecutar la ruta o acción
    next()
}