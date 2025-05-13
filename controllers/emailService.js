// utils/emailService.js
const nodemailer = require("nodemailer");

// Configurar el transporter para cuentas de Google
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Envía un correo de confirmación de reserva a un cliente
 * @param {string} destination - Correo electrónico del cliente
 * @param {string} classData - Arreglo de informacion de la clase
 */
exports.sendConfirmationEmail = async (destination, classData) => {
  //Convertir de fecha YYYY-MM-DD a una cadena
  const dateString = new Date(classData.date);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const formatedDate = dateString.toLocaleDateString('es-ES', options);

  const mailOptions = {
    from: `"Equipo Adana Pilates" <${process.env.EMAIL_SENDER}>`,
    to: destination,
    subject: "Confirmación de Reserva - Adana Pilates",
    html: `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
      <h2 style="color: #4CAF50;">¡Reserva confirmada! 🧘‍♀️</h2>
      <p>Hola,</p>
      <p>Has reservado exitosamente tu clase de <strong>${classData.title}</strong>.</p>
      <ul style="list-style-type: none; padding: 0;">
        <li><strong>Instructor:</strong> ${classData.instructor}</li>
        <li><strong>Fecha:</strong> ${formatedDate}</li>
        <li><strong>Hora:</strong> ${classData.time}</li>
        <li><strong>Importe pagado:</strong>$${classData.totalPrice}</li>
      </ul>
      <p>Te esperamos con mucha energía ✨</p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ccc;">

      <div style="font-size: 14px; color: #555;">
        <p><strong>— El equipo de Adana</strong></p>
        <p style="color: #388E3C; font-style: italic;">
          "Move beyond your possibilities..."
          <img src="https://cdn-icons-png.flaticon.com/512/427/427735.png" width="16" height="16" style="vertical-align: middle; margin-left: 5px;" alt="hoja ecológica"/>
        </p>
      </div>
    </div>
  `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Correo de confirmación enviado a:", destination);
  } catch (error) {
    console.error("Error al enviar el correo de confirmación:", error);
  }
};