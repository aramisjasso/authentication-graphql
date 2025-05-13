const db = require('./firebase');
const usersRef = db.collection('users');
const { sendVerificationEmail, verifyCode } = require('../controllers/verificationController');
const otpsRef = db.collection('otps');

// Generar OTP de 6 dígitos
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Función simulada para enviar OTP por correo o WhatsApp (impleméntala según tu método preferido)
const sendOTP = async (email, otp) => {
  console.log(`Enviando OTP ${otp} a ${email}`);
  // Aquí deberías usar nodemailer o Twilio
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
    throw new Error('Correo no válido');
  }

  await sendVerificationEmail(email);

  const newUser = { email, phone, isVerified: false };
  const docRef = await usersRef.add(newUser); 
  
  return {
    id: docRef.id, 
    ...newUser
  };
};

const check = async (email, code) => {
  try {
    // 1. Verificar el código
    const isValid = verifyCode(email, code);
    
    if (!isValid) {
      throw new Error("Código inválido o expirado");
    }

    // 2. Actualizar el usuario en la base de datos
    const usersRef = db.collection('users'); // Asegúrate de tener tu referencia a Firestore
    const querySnapshot = await usersRef.where('email', '==', email).get();

    if (querySnapshot.empty) {
      throw new Error("Usuario no encontrado");
    }

    // Actualizar todos los documentos que coincidan (por si hay duplicados)
    const batch = db.batch();
    querySnapshot.forEach(doc => {
      batch.update(doc.ref, { isVerified: true });
    });

    await batch.commit();
    
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data(), isVerified: true };
    
  } catch (error) {
    console.error("Error en verificación:", error.message);
    return { success: false, error: error.message };
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
