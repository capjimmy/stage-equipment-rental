const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

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

// Placeholder images - using public folder images
const placeholderImages = [
  '/images/product-1.svg',
  '/images/product-2.svg',
  '/images/product-3.svg',
  '/images/product-4.svg',
  '/images/product-5.svg',
];

async function addImagesToProducts() {
  console.log('Starting to add images to products...');

  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);

    console.log(`Found ${snapshot.docs.length} products`);

    let updated = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Skip if already has images
      if (data.images && data.images.length > 0) {
        console.log(`Skipping ${data.title} - already has images`);
        continue;
      }

      // Assign a random placeholder image
      const randomImage = placeholderImages[updated % placeholderImages.length];

      await updateDoc(doc(db, 'products', docSnap.id), {
        images: [randomImage]
      });

      updated++;
      console.log(`Updated: ${data.title} with ${randomImage}`);
    }

    console.log(`\nDone! Updated ${updated} products with images.`);
  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

addImagesToProducts();
