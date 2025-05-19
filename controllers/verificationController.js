// utils/verificationService.js
const nodemailer = require("nodemailer");
const { Vonage } = require('@vonage/server-sdk');
const { sendWhatsMessage } = require("./whatsappController")

// Configuración del transporter (Gmail)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Configuración de Vonage (Nexmo)
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
});

// Objeto para almacenar códigos de verificación (en memoria)
const verificationCodes = {};
const lastSentTimestamps = {};

/**
 * Genera un código de 6 dígitos y lo guarda con timestamp
 */
function generateVerificationCode(identifier) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[identifier] = {
    code,
    timestamp: Date.now()
  };
  return code;
}

/**
 * Verifica si el código es correcto y no ha expirado (5 minutos)
 */
function verifyCode(identifier, userInputCode) {
  const record = verificationCodes[identifier];
  if (!record) return false;

  const expirationTime = 5 * 60 * 1000; // 5 minutos en milisegundos
  const isExpired = (Date.now() - record.timestamp) > expirationTime;
  const isValid = record.code === userInputCode;

  // Elimina el código (usado o expirado)
  delete verificationCodes[identifier];

  return isValid && !isExpired;
}

/**
 * Verifica si se puede enviar un nuevo código (espera mínima de 1 minuto)
 */
function canSendCode(identifier) {
  const lastSent = lastSentTimestamps[identifier];
  const now = Date.now();
  if (!lastSent || (now - lastSent) > 60 * 1000) {
    lastSentTimestamps[identifier] = now;
    return true;
  }
  return false;
}

/**
 * Envía un código de verificación por correo electrónico
 */
async function sendVerificationEmail(email, phone) {
  if (!canSendCode(email)) {
    throw new Error("Por favor, espera al menos 1 minuto antes de solicitar un nuevo código.");
  }
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
    await sendWhatsMessage(phone, `Su codigo de verificacion es: ${verificationCode}`);
    console.log(`✅ Código enviado a ${email} | Expira a las ${new Date(verificationCodes[email].timestamp + 5 * 60 * 1000).toLocaleTimeString()}`);
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    throw error;
  }
}

/**
 * Envía un código de verificación por SMS con Vonage
 */
async function sendVerificationSMS(phoneNumber) {
  if (!canSendCode(phoneNumber)) {
    throw new Error("Por favor, espera al menos 1 minuto antes de solicitar un nuevo código.");
  }
  const verificationCode = generateVerificationCode(phoneNumber);
  const from = "Vonage";
  const text = `Tu código de verificación es: ${verificationCode}`;

  try {
    const response = await vonage.sms.send({ to: phoneNumber, from, text });
    //await sendVerificationEmail();
    console.log(`✅ SMS enviado a ${phoneNumber}`);
    console.log(response);
  } catch (error) {
    console.error("❌ Error enviando SMS:", error);
    throw error;
  }
}

/**
 * Verifica el código ingresado por el usuario (SMS)
 */
function verifySMSCode(phoneNumber, userInputCode) {
  return verifyCode(phoneNumber, userInputCode);
}

module.exports = {
  sendVerificationEmail,
  sendVerificationSMS,
  verifyEmailCode: (email, code) => verifyCode(email, code),
  verifySMSCode
};
