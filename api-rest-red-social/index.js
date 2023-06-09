// Importar dependecias
const connection = require('./database/connection')
const express = require('express')
const cors = require('cors')

// Mensaje bienvenida
console.log('API NODE para RED SOCIAL arrancada!!')

// Conexion a la BD
connection()

// Crear servidor Node
const app = express()
const puerto = 3900

// Configurar cors, usando un middleware
// Llamamos a cors dentro del middleware
app.use(cors())

// Convertir los datos del body a objetos js
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// Cargar conf rutas
const UserRoutes = require('./routes/user')
const PublicationRoutes = require('./routes/publication')
const FollowRoutes = require('./routes/follow')

app.use('/api/user', UserRoutes)
app.use('/api/publication', PublicationRoutes)
app.use('/api/follow', FollowRoutes)

// Ruta de pruebas
app.get('/ruta-prueba', (req, res) => {
    return res.status(200).json({
        'id':1,
        'nombre': 'Juan Carlos',
        'web': 'jcweb.es'
    })
})

// Poner servidor a escuchar peticiones http
app.listen(puerto, () =>{
    console.log('Servidor de node corriendo en el puerto: ', puerto)
})