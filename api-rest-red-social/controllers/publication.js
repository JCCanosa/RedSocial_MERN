const Publication = require('../models/publication')
const followService = require('../services/followService')
const fs = require('fs')
const path = require('path')

// Acciones de prueba
const pruebaPublication = (req, res) => {
    return res.status(200).send({
        message: 'Mensaje enviado desde: controllers/publication.js'
    })
}

// Guardar publicación
const save = (req, res) => {
    // Recoger datos del body
    const params = req.body

    // Si no hay datos, respuesta negativa
    if (!params.text) {
        return res.status(400).send({
            status: 'error',
            message: 'Debes enviar texto para la publicación'
        })
    }

    // Crear y rellenar el objeto del modelo
    let newPublication = new Publication(params)
    newPublication.user = req.user.id

    // Guardar objeto en BBDD
    newPublication.save()
        .then((publicationStored => {
            if (!publicationStored) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Error al publicar'
                })
            }

            return res.status(200).send({
                status: 'success',
                message: 'Publicación guardada',
                publicationStored
            })
        }))
        .catch(error => {
            return res.status(500).send({
                status: 'error',
                message: 'Error al guardar la publicación',
                error
            })
        })
}

// Recuperar una publicación en contreto
const detail = (req, res) => {
    // Obtener id de la publicacion de la url
    const publicationId = req.params.id

    // Buscar la publicacion mediante el id
    Publication.findById(publicationId)
        .then((publicationStored => {
            if (!publicationStored) {
                return res.status(400).send({
                    status: 'error',
                    message: 'No se puede obtener la publicación'
                })
            }

            // Devolver respuesta
            return res.status(200).send({
                status: 'success',
                message: 'Detalle de la publicación',
                publication: publicationStored
            })

        }))
        .catch(error => {
            return res.status(500).send({
                status: 'error',
                message: 'Error al obtener la publicación',
                error
            })
        })
}

// Eliminar publicaciones
const remove = (req, res) => {
    // Recuperar el id de la url
    const publicationId = req.params.id

    // Buscar la publicación y remove
    // Solo de las nuestras
    Publication.findOneAndRemove({
        'user': req.user.id,
        '_id': publicationId
    }).then((publicationRemoved => {
        if (!publicationRemoved) {
            return res.status(400).send({
                status: 'error',
                message: 'No se ha encontrado la publicación a eliminar'
            })
        }

        // Devolver respuesta
        return res.status(200).send({
            status: 'success',
            message: 'Eliminar publicación',
            publication: publicationId
        })
    }))
        .catch(error => {
            return res.status(500).send({
                status: 'error',
                message: 'No se ha podido eliminar la publicación',
                error
            })
        })
}

// Listar publicaciones de un usuario en concreto
const user = (req, res) => {
    // Recuperar el id del usuario de la url
    const userId = req.params.id

    // Controlar la pagina
    let page = 1
    if (req.params.page) page = req.params.page
    const items_page = 2

    // Guardar el total de publicaciones
    Publication.find({ user: userId })
        .then((publications => {
            total = publications.length
        }))

    // Buscar, popular, ordenar y paginar
    Publication.find({ user: userId })
        .sort('-created_at')
        .populate('user', '-password -__v -role -email')
        .paginate(page, items_page)
        .then((publications => {
            if (!publications || publications.length <= 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se han encontrado publicaciones'
                })
            }

            // Devolver respuesta
            return res.status(200).send({
                status: 'success',
                message: 'Lista publicaciones usuario',
                publications: publications,
                page,
                total,
                pages: Math.ceil(total / items_page)
            })
        }))
        .catch(error => {
            return res.status(500).send({
                status: 'error',
                message: 'Error al obtener las publicaciones',
                error
            })
        })
}

// Subir ficheros
const upload = (req, res) => {
    // Recuperar id de la publicación
    const publicationId = req.params.id

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
    Publication.findByIdAndUpdate({ 'user': req.user.id, '_id': publicationId }, { file: req.file.filename }, { new: true })
        .then((publicationUpdated => {
            if (!publicationUpdated) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Imagen no encontrada'
                })
            }

            // Devolver respuesta
            return res.status(200).json({
                status: 'success',
                publication: publicationUpdated,
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

// Devolver archivos multimedia, imagenes
const media = (req, res) => {
    // Obtener parámetro de la url
    const file = req.params.file

    // Montar el path de la imagen
    const file_path = './uploads/publications/' + file

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

// Listar publicaciones de los usuarios que sigo (FEED)
const feed = async (req, res) => {
    // Recuperar la pagina actual y establecer elementos por página
    let page = 1
    if (req.params.page) page = req.params.page

    let items_page = 5

    // Obtener array de ids de los usuarios que sigo como identificado
    try {
        const myFollows = await followService.followUserIds(req.user.id)

        // Find para el total de publicaciones
        await Publication.find({ user: myFollows.following })
            .then((publications => {
                total = publications.length
            }))

        // Find a publicaciones, ordenar, popular y paginar
        const publications = await Publication.find({
            user: myFollows.following
        }).populate('user', '-password -role -__v -email')
            .sort('-created_at')
            .paginate(page, items_page)

        if (!publications || publications <= 0) {
            return res.status(404).send({
                status: 'error',
                message: 'Los usuarios que sigues aún no tienen publicaciones'
            })
        } else {
            return res.status(200).send({
                status: 'success',
                message: 'Feed de publicaciones',
                following: myFollows.following,
                page,
                total,
                pages: Math.ceil(total / items_page),
                publications
            })
        }
    } catch (error) {
        return res.status(500).send({
            status: 'error',
            message: 'No se han encontrado las publicaciones del feed'
        })
    }
}


// Exportar acciones
module.exports = {
    pruebaPublication,
    save,
    detail,
    remove,
    user,
    upload,
    media,
    feed
}