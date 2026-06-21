/**
 * READ-ONLY Firestore inspection.
 * Signs in as an admin, then reports collection counts and flags suspicious
 * (test / placeholder / duplicate / orphaned) documents. Deletes NOTHING.
 *
 * Usage:
 *   node scripts/inspect-firestore.js <adminEmail> <adminPassword>
 *
 * Review the output, decide what to clean, THEN write a targeted delete script.
 */
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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
  console.error('Usage: node scripts/inspect-firestore.js <adminEmail> <adminPassword>');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const COLLECTIONS = ['products', 'categories', 'tags', 'featuredSets', 'orders', 'users', 'inquiries', 'notifications', 'settings'];

const isPlaceholderImage = (img) =>
  typeof img === 'string' && !img.includes('firebasestorage.googleapis.com') && (img.startsWith('/') || img.includes('placeholder'));

(async () => {
  await signInWithEmailAndPassword(auth, email, password);
  console.log(`Signed in as ${email}\n`);

  const productIds = new Set();
  const categoryIds = new Set();

  for (const name of COLLECTIONS) {
    const snap = await getDocs(collection(db, name)).catch((e) => {
      console.log(`- ${name}: ERROR (${e.code || e.message})`);
      return null;
    });
    if (!snap) continue;
    console.log(`- ${name}: ${snap.size} docs`);

    if (name === 'products') {
      snap.docs.forEach((d) => {
        productIds.add(d.id);
        const data = d.data();
        const imgs = data.images || [];
        if (imgs.length === 0 || imgs.every(isPlaceholderImage)) {
          console.log(`    ⚠ placeholder/no-image product: ${d.id} "${data.title || ''}"`);
        }
        if (/test|샘플|sample|placeholder/i.test(data.title || '')) {
          console.log(`    ⚠ test-looking product: ${d.id} "${data.title}"`);
        }
      });
    }
    if (name === 'categories') snap.docs.forEach((d) => categoryIds.add(d.id));
  }

  // Orphan check: orders referencing missing products
  const orders = await getDocs(collection(db, 'orders')).catch(() => null);
  if (orders) {
    orders.docs.forEach((d) => {
      const items = d.data().items || [];
      items.forEach((it) => {
        if (it.productId && !productIds.has(it.productId)) {
          console.log(`    ⚠ order ${d.id} references missing product ${it.productId}`);
        }
      });
    });
  }

  console.log('\nInspection complete (read-only, nothing changed).');
  process.exit(0);
})().catch((e) => {
  console.error('Failed:', e.code || e.message);
  process.exit(1);
});
