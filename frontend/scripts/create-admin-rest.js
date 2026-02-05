const https = require('https');

const API_KEY = 'AIzaSyC5OQ8nhydwpM0CZUC7WZfswnoY8g3nnnc';
const email = 'admin@stagebox.com';
const password = 'admin123456';

// Create user in Firebase Auth via REST API
const createUser = () => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: email,
      password: password,
      returnSecureToken: true
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      port: 443,
      path: `/v1/accounts:signUp?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(JSON.parse(body));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

// Create user document in Firestore via REST API
const createFirestoreDoc = (uid) => {
  return new Promise((resolve, reject) => {
    const firestoreData = JSON.stringify({
      fields: {
        email: { stringValue: email },
        name: { stringValue: '관리자' },
        role: { stringValue: 'admin' },
        phone: { nullValue: null },
        createdAt: { timestampValue: new Date().toISOString() },
        updatedAt: { timestampValue: new Date().toISOString() }
      }
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      port: 443,
      path: `/v1/projects/stagebox-49312/databases/(default)/documents/users?documentId=${uid}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(firestoreData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(JSON.parse(body));
        } else {
          reject({ statusCode: res.statusCode, body: JSON.parse(body) });
        }
      });
    });

    req.on('error', reject);
    req.write(firestoreData);
    req.end();
  });
};

async function main() {
  try {
    console.log('Creating admin user...');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('');

    const authResult = await createUser();
    console.log('Firebase Auth user created!');
    console.log('UID:', authResult.localId);

    const firestoreResult = await createFirestoreDoc(authResult.localId);
    console.log('Firestore document created!');
    console.log('');
    console.log('=== Admin account created successfully! ===');
    console.log('Email: admin@stagebox.com');
    console.log('Password: admin123456');

  } catch (error) {
    if (error.error && error.error.message === 'EMAIL_EXISTS') {
      console.log('Admin user already exists in Firebase Auth');
      console.log('Email: admin@stagebox.com');
      console.log('Password: admin123456');
    } else {
      console.error('Error:', error);
    }
  }
}

main();
