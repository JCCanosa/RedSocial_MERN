// Importar dependencias
const jwt = require('jwt-simple')
const moment = require('moment')

// Clave secreta
const secret = 'CLAVE_SECRETA_red_SociAL_552345'

// Crear función para generar tokens
const create_token = (user) => {
    const payload = {
        id: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(90, 'days').unix()
    }

    // Devolver jwt token
    return jwt.encode(payload, secret)
}

module.exports = {
    secret,
    create_token
}
