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

// Musical prefixes to upload (only upload first 5 images per musical)
const musicalPrefixes = ['바람사', '오캐롤', '나폴레옹', '에드거앨런포'];
const MAX_IMAGES_PER_MUSICAL = 20;

// Title to prefix mapping
const titlePrefixMap = {
  '바람과': '바람사',
  '바람사': '바람사',
  '오캐롤': '오캐롤',
  '나폴레옹': '나폴레옹',
  '에드거앨런포': '에드거앨런포',
  '에드거': '에드거앨런포',
};

async function uploadSampleImages() {
  console.log('Step 1: Uploading sample images for each musical...');

  // Get files grouped by musical prefix
  const files = fs.readdirSync(UPLOADS_DIR).filter(f =>
    f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png')
  );

  // Group files by musical and only take a few per musical
  const imagesByMusical = {};
  for (const prefix of musicalPrefixes) {
    imagesByMusical[prefix] = files
      .filter(f => f.startsWith(prefix + '_'))
      .slice(0, MAX_IMAGES_PER_MUSICAL);
  }

  // Upload selected images
  const imageUrls = {};
  for (const prefix of musicalPrefixes) {
    imageUrls[prefix] = [];
  }

  let uploaded = 0;

  for (const prefix of musicalPrefixes) {
    console.log(`\nUploading images for ${prefix}...`);

    for (const filename of imagesByMusical[prefix]) {
      const localPath = path.join(UPLOADS_DIR, filename);

      try {
        const fileBuffer = fs.readFileSync(localPath);
        const storageRef = ref(storage, `products/${filename}`);

        await uploadBytes(storageRef, fileBuffer, {
          contentType: 'image/jpeg'
        });

        const downloadUrl = await getDownloadURL(storageRef);
        imageUrls[prefix].push(downloadUrl);

        uploaded++;
        console.log(`  Uploaded: ${filename}`);
      } catch (error) {
        console.error(`  Error uploading ${filename}:`, error.message);
      }
    }
  }

  console.log(`\nStep 1 complete: ${uploaded} images uploaded`);

  // Step 2: Update products with images
  console.log('\nStep 2: Updating products with images...');

  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);

  let productsUpdated = 0;
  const productIndices = {};

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const title = data.title || '';

    // Extract musical name from title
    const match = title.match(/^\[([^\]]+)\]/);
    if (!match) {
      // Not a musical product, keep as is
      continue;
    }

    const musicalName = match[1].replace(' ', '');
    const prefix = titlePrefixMap[musicalName];

    if (!prefix || !imageUrls[prefix] || imageUrls[prefix].length === 0) {
      continue;
    }

    // Track index for each musical to cycle through images
    if (!productIndices[prefix]) {
      productIndices[prefix] = 0;
    }

    // Get next image for this musical (cycling through available images)
    const imageIndex = productIndices[prefix] % imageUrls[prefix].length;
    const imageUrl = imageUrls[prefix][imageIndex];
    productIndices[prefix]++;

    try {
      await updateDoc(doc(db, 'products', docSnap.id), {
        images: [imageUrl]
      });
      productsUpdated++;
    } catch (error) {
      console.error(`  Error updating ${title}:`, error.message);
    }
  }

  console.log(`\nStep 2 complete: ${productsUpdated} products updated`);
  console.log('\nDone!');

  process.exit(0);
}

uploadSampleImages().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
