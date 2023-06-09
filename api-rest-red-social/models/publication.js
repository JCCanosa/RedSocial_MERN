const {Schema, model} = require('mongoose')

const publicationSchema = Schema({
    // Usuario que ha creado la publicación
    user: {
        type: Schema.ObjectId,
        ref: "User"
    },
    text:{
        type: String,
        required: true
    },
    created_at:{
        type: Date,
        default: Date.now
    },
    file: String
})

module.exports = model('Publication', publicationSchema, 'publications')