//Importar librerias y controlador
const express = require('express')
const router = express.Router()
const multer = require('multer')
const PublicationController = require('../controllers/publication')
const mid_auth = require('../middlewares/auth')

// Configuración de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/publications')
    },
    filename: (req, file, cb) => {
        cb(null, 'pub-'+ Date.now() +'-'+ file.originalname)
    }
})

const uploads = multer({storage})

// Definir rutas
router.get('/prueba-publication', PublicationController.pruebaPublication)
router.post('/save', mid_auth.auth, PublicationController.save)
router.get('/detail/:id', mid_auth.auth, PublicationController.detail)
router.delete('/remove/:id', mid_auth.auth, PublicationController.remove)
router.get('/user/:id/:page?', mid_auth.auth, PublicationController.user)
router.post('/upload/:id', [mid_auth.auth, uploads.single('file0')], PublicationController.upload)
router.get('/media/:file', PublicationController.media)
router.get('/feed/:page?', mid_auth.auth, PublicationController.feed)


// Exportar el router
module.exports = router