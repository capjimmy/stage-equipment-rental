const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC5OQ8nhydwpM0CZUC7WZfswnoY8g3nnnc",
  authDomain: "stagebox-49312.firebaseapp.com",
  projectId: "stagebox-49312",
  storageBucket: "stagebox-49312.firebasestorage.app",
  messagingSenderId: "1079653078758",
  appId: "1:1079653078758:web:1d83fcb22da40608dd4d27"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkImages() {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);

  const imageUrls = new Map();

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.images && data.images.length > 0) {
      for (const img of data.images) {
        // Get the domain/prefix of the URL
        let prefix = 'unknown';
        if (img.startsWith('http')) {
          try {
            const url = new URL(img);
            prefix = url.hostname;
          } catch (e) {
            prefix = img.substring(0, 50);
          }
        } else if (img.startsWith('/')) {
          prefix = 'local-path';
        } else {
          prefix = img.substring(0, 30);
        }

        imageUrls.set(prefix, (imageUrls.get(prefix) || 0) + 1);
      }
    }
  }

  console.log('Image URL types found:');
  for (const [prefix, count] of imageUrls) {
    console.log(`  ${prefix}: ${count} images`);
  }

  // Show a few example URLs
  console.log('\nSample image URLs:');
  let samples = 0;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.images && data.images.length > 0 && samples < 5) {
      console.log(`  ${data.title}: ${data.images[0]}`);
      samples++;
    }
  }

  process.exit(0);
}

checkImages();
