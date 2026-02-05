const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC5OQ8nhydwpM0CZUC7WZfswnoY8g3nnnc",
  authDomain: "stagebox-49312.firebaseapp.com",
  projectId: "stagebox-49312",
  storageBucket: "stagebox-49312.firebasestorage.app",
  messagingSenderId: "1079653078758",
  appId: "1:1079653078758:web:1d83fcb22da40608dd4d27"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  const email = 'admin@example.com';
  const password = 'password123';

  try {
    console.log('Creating admin user in Firebase Auth...');

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('User created in Auth:', user.uid);

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      name: '관리자',
      phone: null,
      role: 'admin',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists in Firebase Auth');
    } else {
      console.error('Error:', error.message);
    }
  }

  process.exit(0);
}

createAdminUser();
