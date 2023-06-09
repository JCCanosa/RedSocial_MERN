//Importar librerias y controlador
const express = require('express')
const router = express.Router()
const FollowController = require('../controllers/follow')
const mid_auth = require('../middlewares/auth')

// Definir rutas
router.get('/prueba-follow', FollowController.pruebaFollow)
router.post('/save', mid_auth.auth, FollowController.save)
router.delete('/unfollow/:id', mid_auth.auth, FollowController.unfollow)
router.get('/following/:id?/:page?', mid_auth.auth, FollowController.following)
router.get('/followers/:id?/:page?', mid_auth.auth, FollowController.followers)

// Exportar el router
module.exports = router