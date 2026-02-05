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

// Musical name mappings (Korean to folder prefix)
const musicalMappings = {
  '바람과': '바람사',
  '바람사': '바람사',
  '오캐롤': '오캐롤',
  '나폴레옹': '나폴레옹',
  '에드거앨런포': '에드거앨런포',
  '에드거': '에드거앨런포',
};

async function uploadAllImages() {
  console.log('Step 1: Uploading all images to Firebase Storage...');

  // Get all files in the uploads directory
  const files = fs.readdirSync(UPLOADS_DIR).filter(f =>
    f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png')
  );

  console.log(`Found ${files.length} image files`);

  // Upload images and build a map of filename -> URL
  const imageUrls = new Map();
  let uploaded = 0;
  let errors = 0;

  for (const filename of files) {
    const localPath = path.join(UPLOADS_DIR, filename);

    try {
      const fileBuffer = fs.readFileSync(localPath);
      const storageRef = ref(storage, `products/${filename}`);

      await uploadBytes(storageRef, fileBuffer, {
        contentType: 'image/jpeg'
      });

      const downloadUrl = await getDownloadURL(storageRef);
      imageUrls.set(filename, downloadUrl);

      uploaded++;
      if (uploaded % 20 === 0) {
        console.log(`  Uploaded ${uploaded}/${files.length} images...`);
      }
    } catch (error) {
      console.error(`  Error uploading ${filename}:`, error.message);
      errors++;
    }
  }

  console.log(`\nStep 1 complete: ${uploaded} images uploaded, ${errors} errors`);

  // Step 2: Map images to products
  console.log('\nStep 2: Mapping images to products...');

  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);

  let productsUpdated = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const title = data.title || '';

    // Extract musical name from title (e.g., "[나폴레옹] 바라스 - ...")
    const match = title.match(/^\[([^\]]+)\]/);
    if (!match) {
      // Not a musical product, keep placeholder
      continue;
    }

    const musicalName = match[1].replace(' ', '');
    const prefix = musicalMappings[musicalName];

    if (!prefix) {
      console.log(`  Unknown musical: ${musicalName} in "${title}"`);
      continue;
    }

    // Find matching images (filenames that start with the prefix)
    const matchingImages = [];
    for (const [filename, url] of imageUrls) {
      if (filename.startsWith(prefix + '_')) {
        matchingImages.push({ filename, url });
      }
    }

    if (matchingImages.length === 0) {
      continue;
    }

    // Pick a random image for this product (or we could try to match by product number)
    // Extract product identifier from title to try better matching
    const productImages = [];

    // Try to find specific product images
    // e.g., "나폴레옹_p1_img1" for product 1
    for (const { filename, url } of matchingImages) {
      productImages.push(url);
      if (productImages.length >= 1) break; // Just get first matching for now
    }

    if (productImages.length > 0) {
      try {
        await updateDoc(doc(db, 'products', docSnap.id), {
          images: productImages
        });
        productsUpdated++;
      } catch (error) {
        console.error(`  Error updating ${title}:`, error.message);
      }
    }
  }

  console.log(`\nStep 2 complete: ${productsUpdated} products updated with images`);
  console.log('\nDone!');

  process.exit(0);
}

uploadAllImages().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
