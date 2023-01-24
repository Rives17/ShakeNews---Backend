const sgMail = require("@sendgrid/mail");

async function sendMail(to, name, verificationCode) {

  const msg = {
    to,
    from: "shakenewshab@gmail.com",
    subject: "¡Bienvenido a ShakeNews!",
    html: `<p> Hola ${name}, para activar tu cuenta pulsa en el siguiente enlace: <a href="http://localhost:5555/api/verify/${verificationCode}" > Verificar cuenta </a> </p>`,
  };

  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const data = await sgMail.send(msg);
    return data;

  } catch (err) {
    console.log(err);
  }
}

module.exports = { sendMail };
