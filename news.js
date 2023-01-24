//Crear  noticia

const Joi = require("joi");
const { getConnection } = require("./database");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const { hash } = require("bcryptjs");

async function createNewPost(req, res, next) {
  let connection;
  try {
    connection = await getConnection();
    const { title, descripcion, enlaces, categoria } = req.body;
    const id_usuario = req.auth.id;

    const response = await axios({ url: enlaces, responseType: "arraybuffer" });
    const dom = new JSDOM(response.data);

    let imagesrc = "";
    let source = "";
    if (enlaces.includes("elpais")) {
      source = "elpais.com";
      const image = dom.window.document.querySelector(".lead_art > img");
      imagesrc = image.src;
    }

    if (enlaces.includes("nosdiario.gal")) {
      source = "www.nosdiario.gal";
      const image = dom.window.document.querySelector(".article-media.article-media-hero > figure > img");
      imagesrc = "https://www.nosdiario.gal" + image.src;
    }

    if (enlaces.includes("lavozdegalicia")) {
      source = "lavozdegalicia.es";
      const image = dom.window.document.querySelector(".media.ratio16-9 > img");
      imagesrc = image.src;
    }

    if (enlaces.includes("marca")) {
      source = "marca.com";
      const image = dom.window.document.querySelector(".ue-c-article__image");
      imagesrc = image.src;
    }

    if (enlaces.includes("publico")) {
      source = "publico.es";
      const image = dom.window.document.querySelector(".ImagenAperturaClick");
      imagesrc = "https://www.publico.es" + image.src;
    }

    if (enlaces.includes("20minutos")) {
      source = "20minutos.es";
      const image = dom.window.document.querySelector(".noLazyImage");
      imagesrc = image.src;
    }

    if (enlaces.includes("farodevigo.es")) {
      source = "farodevigo.es";
      const image = dom.window.document.querySelector(".image > img");
      imagesrc = image.src;
    }

    if (enlaces.includes("nationalgeographic")) {
      source = "nationalgeographic.com";
      const image = dom.window.document.querySelector(".resp-img-cntr.css-ac6mem > img");
      imagesrc = image.src;
    }

    const userSchema = Joi.object({
      title: Joi.string().min(20).max(200).required(),
      descripcion: Joi.string().min(20).max(500).required(),
      enlaces: Joi.string().min(5).required(),
      categoria: Joi.string().required(),
      id_usuario: Joi.number(),
    });

    await userSchema.validateAsync({
      title,
      descripcion,
      enlaces,
      categoria,
      id_usuario,
    });

    console.log("CREANDO NOTICIA", {
      title,
      descripcion,
      enlaces,
      categoria,
      id_usuario,
    });


    const query =
      "INSERT INTO noticias (title, descripcion, enlaces, categoria, id_usuario, imagen, source) VALUES (?, ?, ?, ?, ?, ?, ?)";

    const [results] = await connection.query(query, [
      title,
      descripcion,
      enlaces,
      categoria,
      id_usuario,
      imagesrc,
      source,
    ]);

    res.send({ message: "Noticia creada", insertId: results.insertId });

  } catch (err) {
    next(err)
  }
}

//Editar noticia publicada
async function editPost(req, res, next) {
  let connection;
  try {
    const { id } = req.params;
    connection = await getConnection();
    const { title, descripcion, enlaces, categoria } = req.body;
    const userSchema = Joi.object({
      title: Joi.string(),
      descripcion: Joi.string(),
      enlaces: Joi.string().min(5),
      categoria: Joi.string(),
    });
    await userSchema.validateAsync({ title, descripcion, enlaces, categoria });
    const query =
      "UPDATE noticias SET title=?, descripcion=?, enlaces=?, categoria=? WHERE id=?";
      await connection.query(query, [
        title,
        descripcion,
        enlaces,
        categoria,
        id,
      ]);

    res.send({ message: "Noticia editada" });
  } catch (err) {
    next(err);
  }
}

//Autenticar post para posterior eliminado
async function authenticationPost(req, res, next) {
  let connection;
  try {
    connection = await getConnection();
    const { authorization } = req.headers;

    if (!authorization) {
      const error = new Error("Authorization header required");
      error.statusCode = 401;
      throw error;
    }

    const decodedToken = jwt.verify(authorization, process.env.SECRET);
    const { id } = decodedToken;
    // Comprobamos el usuario para el que fue emitido
    // el token todavía existe.
    const query = "SELECT * FROM noticias WHERE id = ?";
    const [post] = await connection.query(query, id);
    if (!users) {
      const error = new Error("El usuario ya no existe");
      error.code = 401;
      throw error;
    }

    req.auth = decodedToken;
    next();
  } catch (err) {
    next(err);
  }
}

//Eliminar noticia
async function deletePost(req, res, next) {
  let connection;
  try {
    const { id } = req.params;

    connection = await getConnection();
    const query = "DELETE FROM noticias WHERE id=?";

    await connection.query(query, [id]);

    res.code = 200;
    res.send({message: "Noticia eliminada"});
  } catch (err) {
    next(err);
  }
}

//Autenticar post para posterior eliminado
async function authenticationPost(req, res, next) {
  let connection;
  try {
    connection = await getConnection();
    const { authorization } = req.headers;
    if (!authorization) {
      const error = new Error("Authorization header required");
      error.code = 401;
      throw error;
    }
    const decodedToken = jwt.verify(authorization, process.env.SECRET);
    const { id } = decodedToken;
    // Comprobamos el usuario para el que fue emitido
    // el token todavía existe.
    const query = "SELECT * FROM noticias WHERE id = ?";
    const [post] = await connection.query(query, id);
    if (!users) {
      const error = new Error("El usuario ya no existe");
      error.code = 401;
      throw error;
    }
    req.auth = decodedToken;
    next();
  } catch (err) {
    next(err);
  }
}

//Listar Noticias
async function listNews(req, res) {
  let connection;

  try {
    connection = await getConnection();
    const query =
      "SELECT n.*, u.nickname, u.avatar, COUNT(v.id) valoraciones FROM noticias n INNER JOIN usuarios u ON n.id_usuario = u.id LEFT JOIN valoraciones v ON n.id = v.id_noticia GROUP BY n.id ORDER BY valoraciones DESC";
    const [listado] = await connection.query(query);

    res.send(listado);
  } catch (err) {
    res.send(err.message);
  }
}

//Listar Noticia por id
async function listNewsId(req, res) {
  let connection;

  try {
    connection = await getConnection();
    const { id } = req.params;
    const query =
      "SELECT n.*, u.nickname, u.avatar, COUNT(v.id) valoraciones FROM noticias n INNER JOIN usuarios u ON n.id_usuario = u.id LEFT JOIN valoraciones v ON n.id = v.id_noticia WHERE n.id = ? GROUP BY n.id ORDER BY valoraciones DESC";

    const [noticia] = await connection.query(query, id);
    res.send(noticia[0]);

  } catch (err) {
    next(err);
  }
}

//Listar Noticia por id_usuario
async function listNewsUser(req, res) {
  let connection;

  try {
    connection = await getConnection();
    const { id_usuario } = req.params;
    const query =
      "SELECT n.*, u.nickname, u.avatar, COUNT(v.id) valoraciones FROM noticias n INNER JOIN usuarios u ON n.id_usuario = u.id LEFT JOIN valoraciones v ON n.id = v.id_noticia WHERE n.id_usuario = ? GROUP BY n.id ORDER BY valoraciones DESC";
    const [noticia] = await connection.query(query, id_usuario);

    res.send(noticia);

  } catch (err) {
    res.send(err.message);
  }
}

//Comprobar si puede editar noticia
async function canEditNews(req, res, next) {
  let connection;
  try {
    connection = await getConnection();
    const { id } = req.params;
    const [owner] = await connection.query(
      "SELECT id_usuario FROM noticias WHERE id = ?",
      [id]
    );

    if (owner[0].id_usuario !== req.auth.id) {
      const error = new Error("No tienes permiso para editar esta noticia");
      error.code = 401;
      throw error;
    }

    next();
  } catch (err) {
    res.send(err.message);
  }
}

async function existsNews(req, res, next) {
  let connection;
  try {
    connection = await getConnection();
    const { id } = req.params;
    const [news] = await connection.query(
      "SELECT id FROM noticias WHERE id = ?",
      [id]
    );

    if (news.length < 1) {
      const error = new Error("Esta noticia no existe");
      error.code = 401;
      throw error;
    }

    next();
  } catch (err) {
    next(err);
  }
}

async function categoryFilter(req, res, next) {
  let connection;
  try {
    connection = await getConnection();
    const { categoria } = req.params;

    const query =
      "SELECT n.*, u.nickname, u.avatar, COUNT(v.id) valoraciones FROM noticias n INNER JOIN usuarios u ON n.id_usuario = u.id LEFT JOIN valoraciones v ON n.id = v.id_noticia WHERE categoria = ? GROUP BY n.id ORDER BY valoraciones DESC";
    const [category] = await connection.query(query, categoria);

    res.send(category);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createNewPost,
  editPost,
  authenticationPost,
  deletePost,
  listNews,
  listNewsId,
  listNewsUser,
  canEditNews,
  existsNews,
  canEditNews,
  categoryFilter,
};
