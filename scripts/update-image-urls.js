/**
 * Update image URLs in Firestore to point to existing backend
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, updateDoc, getDocs } = require('firebase/firestore');

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

// ngrok backend URL
const BACKEND_URL = 'https://plaintive-nonsensuously-jaydon.ngrok-free.dev';
const API_URL = 'http://localhost:3001/api';

async function updateImageUrls() {
  console.log('🖼️ Updating product image URLs...');

  // Get products from backend API
  const response = await fetch(`${API_URL}/products`);
  const products = await response.json();

  let updatedCount = 0;

  for (const product of products) {
    if (product.images && product.images.length > 0) {
      // Convert local paths to ngrok URLs
      const imageUrls = product.images.map(img => {
        if (img.startsWith('/uploads/')) {
          return `${BACKEND_URL}${img}`;
        } else if (img.startsWith('uploads/')) {
          return `${BACKEND_URL}/${img}`;
        }
        return img;
      });

      const detailImageUrls = (product.detailImages || []).map(img => {
        if (img.startsWith('/uploads/')) {
          return `${BACKEND_URL}${img}`;
        } else if (img.startsWith('uploads/')) {
          return `${BACKEND_URL}/${img}`;
        }
        return img;
      });

      // Update Firestore document
      const docRef = doc(db, 'products', product.id);
      await updateDoc(docRef, {
        images: imageUrls,
        detailImages: detailImageUrls
      });

      console.log(`  ✓ ${product.title}: ${imageUrls.length} images`);
      updatedCount++;
    }
  }

  console.log(`\n✅ Updated ${updatedCount} products with image URLs`);
}

updateImageUrls().catch(console.error);
