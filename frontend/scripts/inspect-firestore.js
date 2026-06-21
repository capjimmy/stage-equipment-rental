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
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

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

  // === Deep cleanup checks ===
  console.log('\n--- Deep checks ---');

  // 1) Duplicate products by title
  const prodSnap = await getDocs(collection(db, 'products'));
  const byTitle = new Map();
  prodSnap.docs.forEach((d) => {
    const t = (d.data().title || '').trim();
    if (!byTitle.has(t)) byTitle.set(t, []);
    byTitle.get(t).push(d.id);
  });
  let dupCount = 0;
  for (const [title, ids] of byTitle) {
    if (ids.length > 1) {
      dupCount++;
      console.log(`  ⚠ duplicate title "${title}" → ${ids.length} products: ${ids.join(', ')}`);
    }
  }
  if (!dupCount) console.log('  ✓ no duplicate product titles');

  // 2) Products with zero assets (cannot be rented) + collect referenced tag ids
  const referencedTagIds = new Set();
  let noAsset = 0;
  await Promise.all(
    prodSnap.docs.map(async (d) => {
      const [assets, tags] = await Promise.all([
        getDocs(collection(db, 'products', d.id, 'assets')),
        getDocs(collection(db, 'products', d.id, 'tags')),
      ]);
      tags.docs.forEach((t) => referencedTagIds.add(t.data().id || t.id));
      if (assets.size === 0) {
        noAsset++;
        console.log(`  ⚠ product without assets: ${d.id} "${d.data().title || ''}"`);
      }
    })
  );
  if (!noAsset) console.log('  ✓ every product has at least one asset');

  // 3) Unused tags (defined but never attached to a product)
  const tagSnap = await getDocs(collection(db, 'tags'));
  const unused = tagSnap.docs.filter((t) => !referencedTagIds.has(t.id) && !referencedTagIds.has(t.data().id));
  console.log(`  tags: ${tagSnap.size} total, ${referencedTagIds.size} referenced, ${unused.length} unused`);
  if (unused.length) {
    console.log('    unused tag ids: ' + unused.map((t) => `${t.id}(${t.data().name || '?'})`).join(', '));
  }

  // 4) Settings presence
  const settings = await getDocs(collection(db, 'settings'));
  if (settings.size === 0) console.log('  ⚠ no settings doc (bank account for transfer-payment flow is unset)');

  console.log('\nInspection complete (read-only, nothing changed).');
  process.exit(0);
})().catch((e) => {
  console.error('Failed:', e.code || e.message);
  process.exit(1);
});
