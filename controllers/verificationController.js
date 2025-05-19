// utils/verificationService.js
const nodemailer = require("nodemailer");
const { Vonage } = require('@vonage/server-sdk');
const db = require('../models/firebase');
const { sendWhatsMessage } = require('./whatsappController');

const verificationCodesRef = db.collection('verificationCodes');
const lastSentRef = db.collection('lastSentTimestamps');

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

/**
 * Genera un código de 6 dígitos y lo guarda en Firestore con timestamp
 */
async function generateVerificationCode(identifier) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const timestamp = Date.now();
  
  await verificationCodesRef.doc(identifier).set({
    code,
    timestamp
  });
  
  return code;
}

/**
 * Verifica si el código es correcto y no ha expirado (5 minutos)
 */
async function verifyCode(identifier, userInputCode) {
  const doc = await verificationCodesRef.doc(identifier).get();
  
  if (!doc.exists) return false;

  const record = doc.data();
  const expirationTime = 5 * 60 * 1000; // 5 minutos en milisegundos
  const isExpired = (Date.now() - record.timestamp) > expirationTime;
  const isValid = record.code === userInputCode;

  // Elimina el código (usado o expirado)
  if (isValid || isExpired) {
    await verificationCodesRef.doc(identifier).delete();
  }

  return isValid && !isExpired;
}

/**
 * Verifica si se puede enviar un nuevo código (espera mínima de 1 minuto)
 */
async function canSendCode(identifier) {
  const doc = await lastSentRef.doc(identifier).get();
  const now = Date.now();
  
  if (!doc.exists || (now - doc.data().timestamp) > 60 * 1000) {
    await lastSentRef.doc(identifier).set({ timestamp: now });
    return true;
  }
  return false;
}

/**
 * Envía un código de verificación por correo electrónico
 */
async function sendVerificationEmail(email) {
  if (!await canSendCode(email)) {
    throw new Error("Por favor, espera al menos 1 minuto antes de solicitar un nuevo código.");
  }
  
  const verificationCode = await generateVerificationCode(email);

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
    
    // Obtener el timestamp de expiración para el log
    const doc = await verificationCodesRef.doc(email).get();
    const expirationTime = new Date(doc.data().timestamp + 5 * 60 * 1000).toLocaleTimeString();
    
    console.log(`✅ Código enviado a ${email} | Expira a las ${expirationTime}`);
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    throw error;
  }
}

/**
 * Envía un código de verificación por SMS con Vonage
 */
async function sendVerificationSMS(phoneNumber) {
  if (!await canSendCode(phoneNumber)) {
    throw new Error("Por favor, espera al menos 1 minuto antes de solicitar un nuevo código.");
  }
  
  const verificationCode = await generateVerificationCode(phoneNumber);
  const from = "Vonage";
  const text = `Tu código de verificación es: ${verificationCode}`;

  try {
    const response = await vonage.sms.send({ to: phoneNumber, from, text });
    console.log(`✅ SMS enviado a ${phoneNumber}`);
    console.log(response);
  } catch (error) {
    console.error("❌ Error enviando SMS:", error);
    throw error;
  }
}

async function sendWhatsAppMessage(phone) {
  const verificationCode = await generateVerificationCode(phone);
  await sendWhatsMessage(phone, `Su codigo de verificacion es: ${verificationCode}`);
}

module.exports = {
  sendVerificationEmail,
  sendVerificationSMS,
  sendWhatsAppMessage,
  verifyCode,
};