// Importar dependecias y modulos
const bcrypt = require('bcrypt')
const paginate = require('mongoose-pagination')
const fs = require('fs')
const path = require('path')

// Importar modelos
const User = require('../models/user')
const Follow = require('../models/follow')
const Publication = require('../models/publication')

// Importar servicios
const jwt = require('../services/jwt')
const followService = require('../services/followService')
// const validate = require('../helpers/validate')

// Acciones de prueba
const pruebaUser = (req, res) => {
    return res.status(200).send({
        message: 'Mensaje enviado desde: controllers/user.js',
        user: req.user
    })
}

// Registro de usuarios
const register = (req, res) => {
    // Recoger datos de la petición
    let params = req.body

    // Comprobar que llegan bien los datos + validación
    if (!params.name || !params.email || !params.nick || !params.password) {
        return res.status(400).json({
            status: 'error',
            message: 'Faltan datos por enviar',
        })
    }

    // Validación
    // validate(params)

    // Control usuarios duplicados
    // Si un email o un nick existe en user_to_save, el usuario ya está registrado.
    // exec para ejecutar, tiene un callback con error y el objeto devuelto
    User.find({
        $or: [
            { email: params.email.toLowerCase() },
            { nick: params.nick.toLowerCase() }

        ]
    }).then(async (users) => {
        if (users && users.length >= 1) {
            return res.status(200).send({
                status: 'error',
                message: 'El usuario ya existe'
            })
        }

        // Cifrar la contraseña
        let pwd = await bcrypt.hash(params.password, 10)
        params.password = pwd
        // console.log(pwd)

        // Crear objeto de Usuario
        let user_to_save = new User(params)

        // Guardar usuario en la BBDD
        user_to_save.save()
            .then(userStored => {
                // Usuario guardado correctamente
                return res.status(200).json({
                    status: 'success',
                    message: 'Usuario registrado correctamente',
                    user: userStored
                })
            }).catch(error => {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al guardar el usuario'
                })
            })

    }).catch((error) => {
        return res.status(500).json({
            status: 'error',
            message: 'Error en la consulta de usuarios',
            error
        })
    })
}

// Login
const login = (req, res) => {
    // Recoger los parametros del body
    let params = req.body

    if (!params.email || !params.password) {
        return res.status(400).send({
            status: 'error',
            message: 'Faltan datos por enviar'
        })
    }

    // Buscar en la bbdd
    User.findOne({ email: params.email })
        .select({ "created_at": 0 })
        .then((user => {
            if (!user) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No existe el usuario'
                })
            }
            // Comprobar su contraseña
            let pwd = bcrypt.compareSync(params.password, user.password)

            if (!pwd) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Password incorrecto'
                })
            }

            // Conseguir el Token
            const token = jwt.create_token(user)

            // Devolver datos usuario
            return res.status(200).send({
                status: 'success',
                message: 'Identificado Correctamente',
                user: {
                    id: user._id,
                    name: user.name,
                    nick: user.nick
                },
                token
            })
        }))
        .catch((e => {
            return res.status(500).send({
                status: 'error',
                message: 'Error al buscar el usuario',
            })
        }))
}

// Función para recoger los datos del perfil del usuario
const profile = (req, res) => {
    // Recibir el parametro del id de usuario por la url
    const id = req.params.id

    // Consulta para recoger datos del ususario
    User.findById(id)
        .select({ password: 0, role: 0 })
        .then((async userProfile => {
            if (!userProfile) {
                return res.status(404).send({
                    status: 'error',
                    message: 'El usuario no existe'
                })
            }

            //Información de seguimiento.
            const followInfo = await followService.followThisUser(req.user.id, id)

            return res.status(200).send({
                status: 'success',
                user: userProfile,
                following: followInfo.following,
                follwer: followInfo.follower
            })
        }))
        .catch(e => {
            return res.status(500).send({
                status: 'error',
                message: 'Error al buscar el usuario',
            })
        })
}

const list = (req, res) => {
    // Controlar en que página estamos
    let page = 1
    if (req.params.page) {
        page = req.params.page
    }
    page = parseInt(page)

    // Consulta con mongoose paginate
    let itemsPage = 5
    let total = 0

    User.find()
        .then(users => {
            total = users.length
        })

    User.find().sort('_id').paginate(page, itemsPage)
        .then((async users => {
            if (!users) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se encontraron usuarios'
                })
            }

            let followUserIds = await followService.followUserIds(req.user.id)

            return res.status(200).send({
                status: 'success',
                users,
                page,
                itemsPage,
                total,
                pages: Math.ceil(total / itemsPage),
                following: followUserIds.following,
                followers: followUserIds.followers
            })

        }))
        .catch(error => {
            return res.status(500).send({
                status: 'error',
                message: 'Error al consultar usuarios',
                error
            })
        })
}

const update = (req, res) => {
    // Recoger info del usuario
    let userData = req.user
    let userUpdate = req.body

    //Elminiar campos sobrantes
    delete userUpdate.iat
    delete userUpdate.exp
    delete userUpdate.role
    delete userUpdate.image

    // Comprobar si el usuario existe
    User.find({
        $or: [
            { email: userUpdate.email.toLowerCase() },
            { nick: userUpdate.nick.toLowerCase() }

        ]
    }).then(async (users) => {
        let userIsset = false

        users.forEach(user => {
            if (user && user._id != userData.id) userIsset = true
        });

        if (userIsset) {
            return res.status(200).send({
                status: 'error',
                message: 'El usuario ya existe'
            })
        }

        // Cifrar la contraseña si llega
        if (userUpdate.password) {
            let pwd = await bcrypt.hash(userUpdate.password, 10)
            userUpdate.password = pwd
        } else {
            delete userUpdate.password
        }

        // Buscar y actualizar datos
        User.findByIdAndUpdate(userData.id, userUpdate, { new: true })
            .then((user => {
                if (!user) {
                    return res.status(404).json({
                        status: 'error',
                        message: 'Error usuario no encontrado',
                    })
                }

                // Respuesta correcta
                return res.status(200).send({
                    status: 'success',
                    message: 'Usuario Actualizado Correctamente',
                    user
                })

            })).catch(error => {
                return res.status(500).json({
                    status: 'error',
                    message: 'Error al actualizar usuario',
                    error
                })
            })

    }).catch((error) => {
        return res.status(500).json({
            status: 'error',
            message: 'Error en la consulta de usuarios',
            error
        })
    })
}

const upload = (req, res) => {
    // Recoger fichero de imagen y comprobar que existe
    if (!req.file) {
        return res.status(404).send({
            status: 'error',
            message: 'No se incluye la imagen'
        })
    }

    // Conseguir nombre del archivo
    let img = req.file.originalname

    // Sacar extensión del archivo
    const img_split = img.split("\.")
    const extension = img_split[1]

    // Comprobar extensión
    if (extension != 'png' && extension != 'jpg' && extension != 'jpeg' && extension != 'gif') {

        // Borrar archivo subido
        const file_path = req.file.path
        const del_file = fs.unlinkSync(file_path)

        // Devolver respuesta
        return res.status(400).send({
            status: 'error',
            message: 'Archivo incorrecto'
        })
    }

    // Si es correcta, guardar imagen en BBDD
    User.findByIdAndUpdate(req.user.id, { image: req.file.filename }, { new: true })
        .then((userUpdated => {
            if (!userUpdated) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Imagen no encontrada'
                })
            }

            // Devolver respuesta
            return res.status(200).json({
                status: 'success',
                user: userUpdated,
                file: req.file
            })
        })).catch(error => {
            return res.status(500).send({
                status: 'error',
                message: 'Error al guardar imagen',
                error
            })
        })
}

const avatar = (req, res) => {
    // Obtener parámetro de la url
    const file = req.params.file

    // Montar el path de la imagen
    const file_path = './uploads/avatars/' + file

    // Comprobar que existe el archivo
    fs.stat(file_path, (error, exists) => {
        if (!exists) {
            return res.status(404).send({
                status: 'error',
                message: 'No existe la imagen',
                error
            })
        }

        // Devolver un file
        return res.sendFile(path.resolve(file_path))
    })
}

// Contadores
const counters = async(req, res) => {
    // Recuperamos el id del usuario identificado
    let userId = req.user.id

    // Si nos llega un id por la url cambiamos el valor
    if(req.params.id){
        userId = req.params.id
    }

    try {
        // Recuperamos los datos para los contadores
        const following = await Follow.count({'user': userId})
        const followed = await Follow.count({'followed': userId})
        const publications = await Publication.count({'user': userId})

        // Devolvemos los 3 resultados.
        return res.status(200).send({
            userId,
            following: following,
            followed: followed,
            publications: publications
        })
    } catch (error) {
        return res.status(500).send({
            status: 'error',
            message: 'Error en los contadores'
        })
    }
}

// Exportar acciones
module.exports = {
    pruebaUser,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar,
    counters
}