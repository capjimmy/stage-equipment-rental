const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

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
const storage = getStorage(app);

const UPLOADS_DIR = path.join(__dirname, '../../backend/uploads/products');

async function uploadImagesToFirebase() {
  console.log('Starting image upload to Firebase Storage...');
  console.log(`Looking for images in: ${UPLOADS_DIR}`);

  // Check if uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.error('Uploads directory not found!');
    process.exit(1);
  }

  // Get all products from Firestore
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);

  console.log(`Found ${snapshot.docs.length} products`);

  let updated = 0;
  let errors = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    // Skip if no images or images don't point to localhost
    if (!data.images || data.images.length === 0) {
      continue;
    }

    // Check if any image points to localhost
    const localhostImages = data.images.filter(img => img.includes('localhost:3001'));
    if (localhostImages.length === 0) {
      continue;
    }

    const newImages = [];

    for (const imageUrl of data.images) {
      if (!imageUrl.includes('localhost:3001')) {
        newImages.push(imageUrl);
        continue;
      }

      // Extract filename from URL
      const filename = imageUrl.split('/').pop();
      const localPath = path.join(UPLOADS_DIR, filename);

      // Check if file exists locally
      if (!fs.existsSync(localPath)) {
        console.log(`  File not found: ${filename}`);
        // Use placeholder instead
        newImages.push('/images/placeholder.svg');
        continue;
      }

      try {
        // Read the file
        const fileBuffer = fs.readFileSync(localPath);

        // Upload to Firebase Storage
        const storageRef = ref(storage, `products/${filename}`);
        await uploadBytes(storageRef, fileBuffer, {
          contentType: 'image/jpeg'
        });

        // Get download URL
        const downloadUrl = await getDownloadURL(storageRef);
        newImages.push(downloadUrl);

        console.log(`  Uploaded: ${filename}`);
      } catch (error) {
        console.error(`  Error uploading ${filename}:`, error.message);
        newImages.push('/images/placeholder.svg');
        errors++;
      }
    }

    // Update product with new image URLs
    if (newImages.length > 0) {
      try {
        await updateDoc(doc(db, 'products', docSnap.id), {
          images: newImages
        });
        updated++;
        console.log(`Updated product: ${data.title}`);
      } catch (error) {
        console.error(`Error updating product ${data.title}:`, error.message);
        errors++;
      }
    }
  }

  console.log(`\nDone!`);
  console.log(`Products updated: ${updated}`);
  console.log(`Errors: ${errors}`);

  process.exit(0);
}

uploadImagesToFirebase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
