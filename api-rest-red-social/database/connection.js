//Importamos mongoose
const mongoose = require('mongoose')

// Creamos una función asincrona para conectarnos.
// Hasta que no nos conectemos no seguimos con los siguientes pasos.
const connection = async() => {
    try {
        // Si cambiamos 127.0.0.1 por localhost no funciona
        await mongoose.connect('mongodb://127.0.0.1:27017/mi_redsocial')

        // Comprobación de la conexión
        console.log('Conectado correctamente a la base de datos!')
    } catch (error) {
        console.log(error)
        throw new Error("No se ha podido conectar a la base de datos !!")
    }
}

// Exportación del método

// Forma 1:
// module.exports = {
//     connection
// }

// Forma 2:
module.exports = connection