/**
 * Create one 'available' asset for every product that currently has none,
 * so products become rentable. Idempotent: products that already have an
 * asset are skipped. Asset code matches the admin UI scheme: PREFIX@01
 * where PREFIX = first 6 chars of the product id, uppercased.
 *
 * Usage:
 *   node scripts/seed-one-asset-per-product.js <adminEmail> <adminPassword>
 */
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, addDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyC5OQ8nhydwpM0CZUC7WZfswnoY8g3nnnc',
  authDomain: 'stagebox-49312.firebaseapp.com',
  projectId: 'stagebox-49312',
  storageBucket: 'stagebox-49312.firebasestorage.app',
  messagingSenderId: '1079653078758',
  appId: '1:1079653078758:web:1d83fcb22da40608dd4d27',
};

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error('Usage: node scripts/seed-one-asset-per-product.js <adminEmail> <adminPassword>');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

(async () => {
  await signInWithEmailAndPassword(auth, email, password);
  console.log(`Signed in as ${email}\n`);

  const productsSnap = await getDocs(collection(db, 'products'));
  console.log(`${productsSnap.size} products found\n`);

  let created = 0;
  let skipped = 0;

  // Sequential to keep output readable and avoid hammering quota; catalog is small.
  for (const p of productsSnap.docs) {
    const assetsRef = collection(db, 'products', p.id, 'assets');
    const existing = await getDocs(assetsRef);
    if (existing.size > 0) {
      skipped++;
      continue;
    }
    const assetCode = `${p.id.substring(0, 6).toUpperCase()}@01`;
    await addDoc(assetsRef, {
      productId: p.id,
      assetCode,
      serialNumber: null,
      conditionGrade: 'A',
      images: [],
      notes: null,
      status: 'available',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    created++;
    console.log(`  + ${assetCode}  ${p.data().title || ''}`);
  }

  console.log(`\nDone. Created ${created} assets, skipped ${skipped} (already had assets).`);
  process.exit(0);
})().catch((e) => {
  console.error('Failed:', e.code || e.message);
  process.exit(1);
});
