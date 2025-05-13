const db = require('./firebase');
const usersRef = db.collection('users');

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

const create = async (email, phone) => {
  if (!validateEmail(email)) {
    throw new Error('Email no válido');
  }

  const newUser = { email, phone, isVerified: false };
  const docRef = await usersRef.add(newUser); 
  
  return {
    id: docRef.id, 
    ...newUser
  };
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

module.exports = { getAll, getById, create, update, remove };
