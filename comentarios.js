
const Joi = require('joi');
const {getConnection} = require ('./database')

async function createComentario (req, res) {
    let connection;

    try {
        connection = await getConnection()

        const { texto } = req.body
        const id_usuario = req.auth.id
        const {id} = req.params

        const userSchema = Joi.object({
            texto: Joi.string().min(10).max(500).required(),
            id_usuario: Joi.number(),
            id: Joi.number()
        })

        await userSchema.validateAsync({ texto, id_usuario, id })
        const query = 'INSERT INTO comentarios (texto, id_usuario, id_noticia) VALUES (?, ?, ?)'

        try {
            await connection.query(query,[texto, id_usuario, id ])

        }catch(err) {
            console.log(err.message)
            res.statusCode = 400
            res.send('Error fatal')
        }
        res.statusCode = 201
        res.send({message: 'Comenatrio creado'})

        } catch (err) {
            console.log(err.message)
            res.statusCode = 400
            res.send('Error al crear comentario')
        }
    }

//Borrar comentarios
async function deleteComentario(req, res) {
  let connection;
  try {
    const { id } = req.params

    connection = await getConnection();
    const query = 'DELETE FROM comentarios WHERE id = ?';

    try {
      await connection.query(query, [id]);

    } catch (err) {
      console.log(err);
    }
    res.statusCode = 200
    res.send({message:'Comentario eliminado'});

  } catch (err) {
      res.statusCode = 401
      res.send(err.message)
      console.log('Error al eliminar')
  }
}


async function editComentario (req, res) {
  let connection;

  try {
    const { id } = req.params
    connection = await getConnection();
    const { texto } = req.body;

    const query = 'UPDATE comentarios SET texto = ? WHERE id = ?';
    await connection.query(query, [ texto, id ]);

    res.statusCode = 200
    res.send({message:'Comentario editado!'});

  } catch (err) {
    res.statusCode = 401
    console.log(err.message)
  }
}

async function listComentarios (req, res) {
  let connection

  try{
    const {id_noticia} = req.params
    connection = await getConnection();
    const query = "SELECT c.*, u.nickname, u.avatar FROM comentarios c INNER JOIN usuarios u ON c.id_usuario = u.id WHERE c.id_noticia = ?";
    const [listado] = await connection.query(query, id_noticia)

    res.send(listado)

  }catch(err) {
    res.send(err.message)

  }
}

async function canEditComment (req, res, next) {
  let connection
  try {
    connection = await getConnection()
    const { id } = req.params;
    const [owner] = await connection.query('SELECT id_usuario FROM comentarios WHERE id = ?', [id])

    if (owner[0].id_usuario !== req.auth.id) {
      const error = new Error('No tienes permiso para editar este comentario');
      error.code = 401;
      throw error;
    }

    next();
   } catch (err) {
     next(err);
   }
}

    module.exports = {
        createComentario,
        deleteComentario,
        editComentario,
        listComentarios,
        canEditComment
    }