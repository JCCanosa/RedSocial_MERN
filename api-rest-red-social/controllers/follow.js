// Importar modelos y dependencias
const Follow = require('../models/follow')
const User = require('../models/user')

const followService = require('../services/followService')

const paginate = require('mongoose-pagination')

// Acciones de prueba
const pruebaFollow = (req, res) => {
    return res.status(200).send({
        message: 'Mensaje enviado desde: controllers/follow.js'
    })
}

// Guardar un follow - seguir
const save = (req, res) => {
    // Recoger datos del body
    const params = req.body
    // Recuperar el id del usuario identificado
    const identity = req.user

    // Crear objeto con el modelo follow
    let user_follow = new Follow({
        user: identity.id,
        followed: params.followed
    })

    // Guardar el objeto en la BBDD
    user_follow.save()
        .then((followStored) => {
            if (!followStored) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Usuario no encontrado'
                })
            }

            return res.status(200).send({
                status: 'success',
                identity: req.user,
                followStored
            })

        }).catch((err) => {
            return res.status(500).send({
                status: 'error',
                message: 'Error al seguir al usuario'
            })
        });
}

// Borrar un follow - dejar de seguir
const unfollow = (req, res) => {
    // Recoger el id del usuario identificado
    const user_id = req.user.id

    // Recoger el id del usuario al que queremos dejar de seguir
    const followed_id = req.params.id

    // Comprobar si existe en la BD, el registro y borrarlo
    // Este find equivaldria a SELECT ... FROM ... WHERE ...
    Follow.findOneAndRemove({
        "user": user_id,
        "followed": followed_id
    }).then((followDeleted) => {
        if (!followDeleted) {
            return res.status(404).send({
                status: 'error',
                message: 'Registro no encontrado'
            })
        }

        return res.status(200).send({
            status: 'success',
            followDeleted
        })

    }).catch((err) => {
        return res.status(500).send({
            status: 'error',
            message: 'Error al recuperar el registro',
            err
        })
    })
}

// Listar usuarios que cualquier usuario está siguiendo
const following = (req, res) => {
    // Recuperar id usuario identificado
    let user_id = req.user.id

    // Comprobar si llega el parámetro id por la url
    // El id que llega por url tiene preferencia, si llega lo cambiamos
    if (req.params.id) user_id = req.params.id

    // Comprobar si me llega la pagina, si no será la 1
    let page = 1
    if (req.params.page) page = req.params.page

    // Establecer el número de usuarios que vamos a mostrar por pagina
    const items_page = 5

    // Total de follows
    Follow.find()
        .then(follows => {
            total = follows.length
        })

    // Buscar en follow, popular los datos de los usuarios y paginar
    Follow.find({ user: user_id })
        .populate('user followed', '-password -role -__v -email')
        .paginate(page, items_page)
        .then(async (follows) => {

            let followUserIds = await followService.followUserIds(req.user.id)

            return res.status(200).send({
                status: 'success',
                message: 'Listado de usuarios que estoy siguiendo',
                follows,
                total,
                pages: Math.ceil(total / items_page),
                following: followUserIds.following,
                followers: followUserIds.followers
            })
        }).catch((err) => {
            return res.status(500).send({
                status: 'error',
                message: 'Error al recuperar los follows',
                err
            })
        })
}

// Listar usuarios que siguen a cualquier usuario (seguido por)
const followers = (req, res) => {
    // Recuperar id usuario identificado
    let user_id = req.user.id

    // Comprobar si llega el parámetro id por la url
    // El id que llega por url tiene preferencia, si llega lo cambiamos
    if (req.params.id) user_id = req.params.id

    // Comprobar si me llega la pagina, si no será la 1
    let page = 1
    if (req.params.page) page = req.params.page

    // Establecer el número de usuarios que vamos a mostrar por pagina
    const items_page = 5

    // Total de follows
    Follow.find()
        .then(follows => {
            total = follows.length
        })

    // Buscar en follow, popular los datos de los usuarios y paginar
    Follow.find({ followed: user_id })
        .populate('user', '-password -role -__v -email')
        .paginate(page, items_page)
        .then(async (follows) => {

            let followUserIds = await followService.followUserIds(req.user.id)

            return res.status(200).send({
                status: 'success',
                message: 'Listado de usuarios que me siguen',
                follows,
                total,
                pages: Math.ceil(total / items_page),
                following: followUserIds.following,
                followers: followUserIds.followers
            })
        }).catch((err) => {
            return res.status(500).send({
                status: 'error',
                message: 'Error al recuperar los follows',
                err
            })
        })
}

// Exportar acciones
module.exports = {
    pruebaFollow,
    save,
    unfollow,
    following,
    followers
}