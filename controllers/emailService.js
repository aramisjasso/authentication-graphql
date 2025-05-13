// utils/emailService.js
const nodemailer = require("nodemailer");

// Configuración del transporter (Gmail)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Objeto para almacenar códigos (en memoria)
const verificationCodes = {};

/**
 * Genera un código y lo guarda con timestamp
 */
function generateVerificationCode(email) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = {
    code,
    timestamp: Date.now() // Registra el momento exacto de creación
  };
  //console.log(`Código generado para ${email}: ${code} | Timestamp: ${verificationCodes[email].timestamp}`);
  return code;
}

/**
 * Verifica si el código es correcto y no ha expirado (5 mins)
 * @returns {boolean} - True si es válido, False si no
 */
exports.verifyCode = (email, userInputCode) => {
  const record = verificationCodes[email];
  if (!record) return false;

  const expirationTime = 5 * 60 * 1000; // 5 minutos en milisegundos
  const isExpired = (Date.now() - record.timestamp) > expirationTime;
  const isValid = record.code === userInputCode;

  // Elimina el código (usado o expirado)
  delete verificationCodes[email];

  return isValid && !isExpired; // Solo válido si coincide y no ha expirado
};

/**
 * Envía el correo con código de 6 dígitos (válido por 5 minutos)
 */
exports.sendVerificationEmail = async (email) => {
  const verificationCode = generateVerificationCode(email);

  const mailOptions = {
    from: `"Código de Verificación" <${process.env.EMAIL_SENDER}>`,
    to: email,
    subject: "Tu código expira en 5 minutos ⏳",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">¡Usa este código para continuar!</h2>
        <p style="font-size: 18px;">Código de verificación:</p>
        <p style="font-size: 32px; font-weight: bold; color: #1a73e8; letter-spacing: 5px; margin: 20px 0;">
          ${verificationCode}
        </p>
        <p style="font-size: 14px; color: #d32f2f;">
          ⚠️ <strong>Expira en 5 minutos</strong> (generado el ${new Date().toLocaleTimeString()})
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Código enviado a ${email} | Expira a las ${new Date(verificationCodes[email].timestamp + 5*60*1000).toLocaleTimeString()}`);
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    throw error;
  }
};