const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

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

async function deletePlaceholderProducts() {
  console.log('Searching for products with placeholder images...');

  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);

  const toDelete = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const images = data.images || [];

    // Check if images are placeholders (local paths)
    const hasRealImage = images.some(img =>
      img.includes('firebasestorage.googleapis.com')
    );

    if (!hasRealImage) {
      toDelete.push({
        id: docSnap.id,
        title: data.title
      });
    }
  }

  console.log(`Found ${toDelete.length} products with placeholder images:`);
  toDelete.forEach(p => console.log(`  - ${p.title}`));

  console.log('\nDeleting products...');

  let deleted = 0;
  for (const product of toDelete) {
    try {
      await deleteDoc(doc(db, 'products', product.id));
      deleted++;
      console.log(`  Deleted: ${product.title}`);
    } catch (error) {
      console.error(`  Error deleting ${product.title}:`, error.message);
    }
  }

  console.log(`\nDone! Deleted ${deleted} products.`);
  process.exit(0);
}

deletePlaceholderProducts().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
