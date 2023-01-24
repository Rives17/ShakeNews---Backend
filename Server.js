
require("dotenv").config();
const express = require('express');
const fileUpload = require('express-fileupload')
const app = express()
const cors = require('cors')


//IMPORTACION DE FUNCIONALIDADES
const {createUser, login , editUser, authentication, uploadAvatar, deleteUser, listUsers, listUsersId, listUsersNickname, activateUser } = require('./usr')
const { createNewPost, editPost, deletePost, listNews, listNewsId, listNewsUser, canEditNews, existsNews, categoryFilter} = require('./news');
const { createComentario, deleteComentario, editComentario, listComentarios, canEditComment } = require("./comentarios");
const {toggleValoracion, getUserValoracion } = require("./valoraciones");


//APLICACION DE MIDDLEWARES
app.use(express.json())
app.use(fileUpload())
app.use(cors())
app.use(express.static('avatars'))


//ESTABLECIMIENTO DE PETICIONES
//USUARIO
app.post('/api/signup',createUser)//Crear usuario
app.post('/login', login)//Login en la pagina
app.put('/api/editUsers/:id', authentication, editUser)//Editar usuario
app.post('/api/users/avatar', authentication, uploadAvatar)//Subir avatar
app.delete('/api/deleteUser/:id', authentication, deleteUser)//Eliminar usuario
app.get('/api/listUsers', listUsers)//Listar usuarios
app.get('/api/listUsersId/:id', listUsersId)//Listar usuarios por Id
app.get('/api/listUsersNickname/:nickname', listUsersNickname)//Listar usuarios por Nickname


//NOTICIAS
app.post('/createNews', authentication, createNewPost)//Crear nueva noticia
app.put('/editNews/:id', authentication, existsNews, canEditNews, editPost)//Editar noticia publicada
app.delete('/deleteNews/:id', authentication, existsNews, canEditNews, deletePost)//Eliminar noticias publicadas
app.get('/listNews', listNews)//Listar noticias
app.get('/listNewsId/:id', listNewsId)//Listar noticia por id
app.get('/listNewsUser/:id_usuario', listNewsUser)//Listar noticias usuario
app.get('/listNews/:categoria', categoryFilter)//Filtrar por categoría


//COMETARIOS
app.post('/createComentario/:id', authentication, createComentario)//Crear nuevo comentario
app.put('/editComentario/:id', authentication, canEditComment, editComentario) //Editar un comentario
app.delete('/deleteComentario/:id', authentication, canEditComment, deleteComentario)//Eliminar comentarios publicados
app.get('/listComentarios/:id_noticia', listComentarios)//Listar comentarios

//VALORACIONES
app.post('/news/:id_noticia/vote', authentication, toggleValoracion)
app.get('/news/:id_noticia/vote', authentication, getUserValoracion)


//EMAIL
app.get('/api/verify/:verificationCode', activateUser)


//ERRORES
app.use((error, req, res, next) => {
    console.log(error)
    res.status(error.code || 500).send({
        status: "error",
        message: error.message
    })
})

//NOT FOUND
app.use((req, res) => {
    res.status(404).send({
        status: "error",
        message: "No encontrado"
    })
})

app.listen(5555, () => console.log('Servidor listo'));