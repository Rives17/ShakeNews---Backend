const Joi = require("joi");
const { getConnection } = require("./database");

async function toggleValoracion(req, res, next) {
  let connection;

  try {
    connection = await getConnection();
    const id_usuario = req.auth.id;
    const { id_noticia } = req.params;

    const queryHasVoted =
      "SELECT * FROM valoraciones WHERE id_usuario = ? AND id_noticia = ?";

    const [results] = await connection.query(queryHasVoted, [
      id_usuario,
      id_noticia,
    ]);
    const hasVoted = results.length < 1 ? false : true;

    const queryToggle = hasVoted
      ? "DELETE FROM valoraciones WHERE id_usuario = ? AND id_noticia = ?"
      : "INSERT INTO valoraciones (id_usuario, id_noticia) VALUES (?, ?)";
    await connection.query(queryToggle, [id_usuario, id_noticia]);

    const queryCountVotes =
      "SELECT COUNT(id) valoraciones FROM valoraciones WHERE id_noticia = ?";
    const [valoraciones] = await connection.query(queryCountVotes, id_noticia);

    res.send({
      hasVoted: !hasVoted,
      message: "Valoracion realizada con éxito",
      valoraciones: valoraciones[0].valoraciones,
    });

  } catch (err) {
    next(err);
  }
}

async function getUserValoracion(req, res, next) {
  let connection;
  try {
    connection = await getConnection();
    const id_usuario = req.auth.id;
    const { id_noticia } = req.params;

    const query =
      "SELECT * FROM valoraciones WHERE id_usuario = ? AND id_noticia = ?";

    const [results] = await connection.query(query, [id_usuario, id_noticia]);
    const hasVoted = results.length < 1 ? false : true;
    res.send({ hasVoted: hasVoted });

  } catch (err) {
    res.send("No se ha podido obtener el voto del usuario");
  }
}

module.exports = {
  toggleValoracion,
  getUserValoracion,
};
