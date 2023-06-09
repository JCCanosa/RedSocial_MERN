//Importar librerias y controlador
const express = require('express')
const router = express.Router()
const multer = require('multer')
const UserController = require('../controllers/user')
const mid_auth = require('../middlewares/auth')

// Configuración de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/avatars')
    },
    filename: (req, file, cb) => {
        cb(null, 'avatar-'+ Date.now() +'-'+ file.originalname)
    }
})

const uploads = multer({storage})

// Definir rutas
router.get('/prueba-usuario', mid_auth.auth, UserController.pruebaUser)
router.post('/register', UserController.register)
router.post('/login', UserController.login)
router.get('/profile/:id', mid_auth.auth, UserController.profile)
router.get('/list/:page?', mid_auth.auth, UserController.list)
router.put('/update', mid_auth.auth, UserController.update)
router.post('/upload', [mid_auth.auth, uploads.single('file0')], UserController.upload)
router.get('/avatar/:file', UserController.avatar)
router.get('/counters/:id', mid_auth.auth, UserController.counters)

// Exportar el router
module.exports = router