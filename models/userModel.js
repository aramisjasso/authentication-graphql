const db = require('./firebase');
const usersRef = db.collection('users');
const { sendVerificationEmail, verifyEmailCode, sendVerificationSMS, verifySMSCode } = require('../controllers/verificationController');
const otpsRef = db.collection('otps');

// Generar OTP de 6 dígitos
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Función simulada para enviar OTP por correo o WhatsApp (impleméntala según tu método preferido)
const sendOTP = async (email, otp) => {
  try {
    // Buscar usuario por email
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      console.error(`❌ Usuario no encontrado con email: ${email}`);
      return;
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    // Enviar OTP según el método de verificación
    const via = user.isVerified; // puede ser "email" o "phone"

    if (via === "email") {
      await sendVerificationEmail(email, otp);
      console.log(`📧 OTP enviado por email a ${email}`);
    } else if (via === "phone") {
      await sendVerificationSMS(user.phone, otp);
      console.log(`📱 OTP enviado por SMS a ${user.phone}`);
    } else {
      console.error("⚠️ Método de verificación no soportado:", via);
    }
  } catch (error) {
    console.error("❌ Error al enviar OTP:", error.message);
  }
};



const login = async (email) => {
  const snapshot = await usersRef.where('email', '==', email).get();

  if (snapshot.empty) {
    return false; // Usuario no encontrado
  }

  const doc = snapshot.docs[0];
  const user = { id: doc.id, ...doc.data() };

  if (user.isVerified) {
    return true; // Acceso permitido
  } else {
    const otp = generateOTP();
    await sendOTP(email, otp);
    await otpsRef.doc(email).set({ otp, createdAt: Date.now() });
    return false; // OTP reenviado
  }
};

const getAll = async () => {
  const snapshot = await usersRef.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

const getById = async (id) => {
  const doc = await usersRef.doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return {
    id: doc.id,
    ...doc.data()
  };
};

const register = async (email, phone, via) => {
  if (!validateEmail(email)) {
    throw new Error('Email no válido');
  }

  if (!validatePhone(phone)) {
    throw new Error('Telefono no válido');
  }

  if (via === "email") {
    await sendVerificationEmail(email, phone);
  }else if(via === "phone"){
    await sendVerificationSMS(phone);
  }

  const newUser = { email, phone, isVerified: via };
  const docRef = await usersRef.add(newUser);

  return {
    id: docRef.id,
    ...newUser,
    isVerified: false 
  };
};

const check = async (email, code) => {
  try {
    // 1. Obtener usuario y su método de verificación
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('email', '==', email).get();

    if (querySnapshot.empty) {
      throw new Error("Usuario no encontrado");
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const verificationVia = userData.isVerified; // 'email' o 'phone'

    // 2. Verificar el código según el método
    let isValid;
    if (verificationVia === "email") {
      isValid = verifyEmailCode(email, code); // Tu función existente para email
    } else if (verificationVia === "phone") {
      isValid = verifySMSCode(userData.phone, code); // Nueva función para SMS
    } else {
      throw new Error("Método de verificación no soportado");
    }

    if (!isValid) {
      throw new Error("Código inválido o expirado");
    }

    // 3. Actualizar el usuario (marcar como verificado y limpiar la vía)
    await userDoc.ref.update({ 
      isVerified: true, // Ahora sí marcamos como verdadero
    });

    return { 
      success: true,
      id: userDoc.id,
      ...userData,
      isVerified: true // Devolvemos el estado actualizado
    };

  } catch (error) {
    console.error("Error en verificación:", error.message);
    return { 
      success: false, 
      error: error.message
    };
  }
};

const update = async (id, email, phone) => {
  if (email && !validateEmail(email)) {
    throw new Error('Email no válido');
  }

  const userRef = usersRef.doc(id);
  const updates = {};

  if (email !== undefined) updates.email = email;
  if (phone !== undefined) updates.phone = phone;

  await userRef.update(updates);
  const updatedDoc = await userRef.get();
  return {
    id: updatedDoc.id,
    ...updatedDoc.data()
  };
};

const remove = async (id) => {
  try {
    const docRef = usersRef.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false; // Documento no existe
    }

    await docRef.delete();
    return true;
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return false;
  }
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  const re = /^\+?[1-9]\d{1,14}$/;
  return re.test(phone);
};

module.exports = { getAll, getById, register, update, remove, check, login };
