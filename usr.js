const {getConnection} = require('./database')
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { json } = require('express');
const { sendMail } = require('./sendMail')


//Crear usuario
async function createUser(req, res, next)  {
  let connection;
  try {
    connection = await getConnection();
    const { nickName, email, password, repeatPassword } = req.body;

    const userSchema = Joi.object({
      nickName: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(5).max(60).required(),
      repeatPassword: Joi.string().min(5).max(60).required()
    });

    //Comprobamos si las password coinciden
    if(password !== repeatPassword) {
      const error = new Error('Las contraseñas no coinciden');
      error.code = 401;
      throw error;
    }

    await userSchema.validateAsync({ nickName, email, password, repeatPassword });
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationCode = uuidv4()
    const query = 'INSERT INTO usuarios (nickName, email, password, verification_code) VALUES (?, ?, ?, ?)';

    await connection.query(query, [nickName, email, passwordHash, verificationCode]);
    await sendMail(email, nickName, verificationCode)

    res.code = 200
    res.send({message:'Usuario creado'});

  } catch (err) {
    next(err)
  }
}


//Login
async function login(req, res, next) {
  let connection;
  try {
    connection = await getConnection()
    const { email, password } = req.body;

    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(5).max(20).required(),
    });

    await schema.validateAsync({ email, password });


    //1. Recuperamos el usuario desde la base de datos.

    const query = 'SELECT * FROM usuarios WHERE email = ? AND is_activated = TRUE';
    const [rows] = await connection.query(query, email);

    if (!rows || !rows.length) {
      const error = new Error('No existe el usuario');
      error.code = 404;
      throw error;
    }

    const user = rows[0];

    //2. Comprobamos que el password que nos están enviando es válido.

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      const error = new Error('El password no es válido');
      error.code = 401;
      throw error;
    }

    //3. Construimos el JWT para enviárselo al cliente.
    const tokenPayload = { id: user.id };

    const token = jwt.sign(
      tokenPayload,
      process.env.SECRET,
      { expiresIn: '30d' },
    );
    res.code = 200
    res.send({ token, data:user });

  } catch (err) {
    next(err);
  }
}


async function authentication (req, res, next) {
  let connection
  try {
    connection = await getConnection()
    const { authorization } = req.headers;

    if (!authorization) {
      const error = new Error('Authorization header required');
      error.code = 401;
      throw error;
    }
    const token = authorization.split(' ')[1]
    const decodedToken = jwt.verify(token, process.env.SECRET);
    const { id } = decodedToken


    // Comprobamos que el usuario para el que fue emitido
    // el token todavía existe.
    const query = 'SELECT * FROM usuarios WHERE id = ?';
    const [users] = await connection.query(query, id);

    if (!users) {
      const error = new Error('El usuario ya no existe');
      error.code = 401;
      throw error;
    }

    req.auth = decodedToken;
    next();
   } catch (err) {
     next(err);
   }
}

async function editUser (req, res) {
  let connection;

  try{
    connection = await getConnection()
    const { nickname, email, password, repeatPassword, biografia } = req.body
    const { id } = req.params

    if(password !== repeatPassword) {
      const error = new Error('Las contraseñas no coinciden');
      error.code = 401;
      throw error;
    }

    const [user] = await connection.query('SELECT * FROM usuarios WHERE id = ?', id)
    let passwordHash = await bcrypt.hash(password, 10);

    if (password === user[0].password) {
      passwordHash = password
    }

    const query = 'UPDATE usuarios SET nickname = ?, email = ?, password = ?, biografia = ? WHERE id = ?'
    await connection.query(query, [nickname, email, passwordHash, biografia, id])

    res.code = 200
    res.send({message: 'Editado!'})

  } catch (err) {
    res.code = 401
    res.send(err.message)
  }
}

async function uploadAvatar (req, res) {
  let connection;
  try {
    connection = await getConnection();

    if (!req.files) {
      res.statusCode(404)
      res.send('Error al subir el archivo')

    } else {
    let image  = req.files.image

    const uuid = uuidv4()
    image.mv('./avatars/' + uuid + '.' + image.name.split('.')[1])
    const avatar = (uuid + '.' + image.name.split('.')[1])
    const query = 'UPDATE usuarios SET avatar = ? WHERE id = ?'
    await connection.query(query, [avatar, req.auth.id])

    res.code = 200
    res.send({avatar})
  }

  } catch (err) {
    res.code = 401
    res.send(err.message)
  }
}

async function deleteUser (req, res) {
  let connection;
  try {
    const { id } = req.params

    connection = await getConnection();
    const query = 'DELETE FROM usuarios WHERE id=?';

    try {
      await connection.query(query, [id]);

    } catch (err) {
      console.log(err);
    }
    res.statusCode = 200
    res.send('Usuario eliminado');

  } catch (err) {
      res.statusCode = 401
      res.send(err.message)
    console.log('Error al eliminar')
  }
}

async function listUsers (req, res) {
  let connection

  try{
    connection = await getConnection();
    const query = 'SELECT * FROM usuarios'
    const [listado] = await connection.query(query)

    res.send(listado)

  }catch(err) {
    res.send(err.message)

  }
}


async function listUsersId (req, res) {
  let connection
  try{
    connection = await getConnection();
    const query = 'SELECT * FROM usuarios WHERE id = ?'
    const [listado] = await connection.query(query, req.params.id)

    res.send(listado[0])

  }catch(err) {
    res.send(err.message)

  }
}

async function listUsersNickname (req, res) {
  let connection
  try{
    connection = await getConnection();
    const query = 'SELECT * FROM usuarios WHERE nickname = ?'
    const [listado] = await connection.query(query, req.params.nickname)

    res.send(listado[0])

  }catch(err) {
    res.send(err.message)

  }
}

async function activateUser (req, res, next) {
  try{
    if(!req.params.verificationCode) {
      throw new Error("Código de verificación no válido")
    }
    const connection = await getConnection()
    const query = 'UPDATE usuarios SET is_activated = TRUE WHERE verification_code = ? AND is_activated = FALSE'
    const [results] = await connection.query(query, req.params.verificationCode)

    if(results.affectedRows === 0) {
      throw new Error("No se pudo activar el usuario")
    }

    res.send({message:"Cuenta activada"})

  }catch(err){
    next(err)
  }
}

module.exports = {
  login,
  createUser,
  editUser,
  authentication,
  uploadAvatar,
  deleteUser,
  listUsers,
  listUsersId,
  listUsersNickname,
  activateUser
};