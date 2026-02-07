/**
 * Migration Script: SQLite (via API) -> Firebase
 *
 * This script migrates data from the existing NestJS backend to Firebase.
 * Run with: node scripts/migrate-to-firebase.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, Timestamp } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC5OQ8nhydwpM0CZUC7WZfswnoY8g3nnnc",
  authDomain: "stagebox-49312.firebaseapp.com",
  projectId: "stagebox-49312",
  storageBucket: "stagebox-49312.firebasestorage.app",
  messagingSenderId: "1079653078758",
  appId: "1:1079653078758:web:1d83fcb22da40608dd4d27"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Backend API URL
const API_URL = 'http://localhost:3001/api';

// Image uploads directory
const UPLOADS_DIR = path.join(__dirname, '../backend/uploads/products');

async function fetchFromAPI(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
  }
  return response.json();
}

async function uploadImage(filePath, storagePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, fileBuffer);
    const url = await getDownloadURL(storageRef);
    console.log(`  Uploaded: ${storagePath}`);
    return url;
  } catch (error) {
    console.error(`  Failed to upload ${filePath}:`, error.message);
    return null;
  }
}

async function migrateCategories() {
  console.log('\n📁 Migrating Categories...');
  const categories = await fetchFromAPI('/categories');

  for (const category of categories) {
    const docRef = doc(db, 'categories', category.id);
    await setDoc(docRef, {
      name: category.name,
      slug: category.slug,
      parentId: category.parentId || null,
      level: category.level || 1,
      createdAt: Timestamp.fromDate(new Date(category.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(category.updatedAt)),
    });
    console.log(`  ✓ Category: ${category.name}`);
  }

  console.log(`  Total: ${categories.length} categories migrated`);
  return categories;
}

async function migrateTags() {
  console.log('\n🏷️ Migrating Tags...');
  const tags = await fetchFromAPI('/tags');

  for (const tag of tags) {
    const docRef = doc(db, 'tags', tag.id);
    await setDoc(docRef, {
      name: tag.name,
      type: tag.type || 'other',
      synonyms: tag.synonyms || null,
      status: tag.status || 'approved',
      createdAt: Timestamp.fromDate(new Date(tag.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(tag.updatedAt)),
    });
  }

  console.log(`  Total: ${tags.length} tags migrated`);
  return tags;
}

async function migrateProducts() {
  console.log('\n📦 Migrating Products...');
  const products = await fetchFromAPI('/products');

  let imageCount = 0;

  for (const product of products) {
    console.log(`  Processing: ${product.title}`);

    // Upload images to Firebase Storage
    const imageUrls = [];
    if (product.images && Array.isArray(product.images)) {
      for (const imagePath of product.images) {
        // Extract filename from path
        const filename = imagePath.split('/').pop();
        const localPath = path.join(UPLOADS_DIR, filename);

        if (fs.existsSync(localPath)) {
          const storagePath = `products/${product.id}/${filename}`;
          const url = await uploadImage(localPath, storagePath);
          if (url) {
            imageUrls.push(url);
            imageCount++;
          }
        } else {
          console.log(`    Image not found: ${localPath}`);
        }
      }
    }

    // Create product document
    const docRef = doc(db, 'products', product.id);
    await setDoc(docRef, {
      title: product.title,
      description: product.description || '',
      categoryId: product.categoryId || null,
      supplierId: product.supplierId || null,
      baseDailyPrice: product.baseDailyPrice || '0',
      status: product.status || 'active',
      images: imageUrls,
      detailImages: product.detailImages || [],
      createdAt: Timestamp.fromDate(new Date(product.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(product.updatedAt)),
    });

    // Migrate tags as subcollection
    if (product.tags && product.tags.length > 0) {
      for (const tag of product.tags) {
        const tagDocRef = doc(db, 'products', product.id, 'tags', tag.id);
        await setDoc(tagDocRef, {
          name: tag.name,
          type: tag.type || 'other',
        });
      }
    }

    // Migrate assets as subcollection
    if (product.assets && product.assets.length > 0) {
      for (const asset of product.assets) {
        const assetDocRef = doc(db, 'products', product.id, 'assets', asset.id);
        await setDoc(assetDocRef, {
          assetCode: asset.assetCode,
          serialNumber: asset.serialNumber || null,
          status: asset.status || 'available',
          conditionGrade: asset.conditionGrade || 'A',
          notes: asset.notes || null,
          createdAt: Timestamp.fromDate(new Date(asset.createdAt)),
          updatedAt: Timestamp.fromDate(new Date(asset.updatedAt)),
        });
      }
    }

    console.log(`  ✓ Product: ${product.title} (${imageUrls.length} images)`);
  }

  console.log(`  Total: ${products.length} products migrated, ${imageCount} images uploaded`);
  return products;
}

async function migrateUsers() {
  console.log('\n👤 Migrating Users...');

  try {
    // Try to get users from admin API (may require auth)
    const users = await fetchFromAPI('/admin/users').catch(() => []);

    for (const user of users) {
      const docRef = doc(db, 'users', user.id);
      await setDoc(docRef, {
        email: user.email,
        name: user.name,
        phone: user.phone || null,
        address: user.address || null,
        role: user.role || 'customer',
        status: user.status || 'active',
        createdAt: Timestamp.fromDate(new Date(user.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(user.updatedAt)),
      });
      console.log(`  ✓ User: ${user.email}`);
    }

    console.log(`  Total: ${users.length} users migrated`);
    return users;
  } catch (error) {
    console.log('  Skipping users (requires authentication)');
    return [];
  }
}

async function main() {
  console.log('🚀 Starting Firebase Migration');
  console.log('================================');
  console.log(`Source: ${API_URL}`);
  console.log(`Images: ${UPLOADS_DIR}`);

  try {
    // Check if backend is running
    await fetch(`${API_URL}/products`).catch(() => {
      throw new Error('Backend server is not running. Please start it first.');
    });

    // Migrate data
    await migrateCategories();
    await migrateTags();
    await migrateProducts();
    await migrateUsers();

    console.log('\n================================');
    console.log('✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify data in Firebase Console: https://console.firebase.google.com');
    console.log('2. Restart the frontend to use Firebase data');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
