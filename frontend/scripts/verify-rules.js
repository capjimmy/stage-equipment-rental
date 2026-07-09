/**
 * Live verification of the deployed Firestore rules using a throwaway customer.
 * Confirms a normal customer can do what the app needs and is blocked from the rest.
 * Cleans up everything it creates (order doc, user doc, auth account).
 *
 * Usage: node scripts/verify-rules.js <throwawayEmail> <throwawayPassword>
 */
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } = require('firebase/auth');
const { getFirestore, collection, getDocs, getDoc, doc, addDoc, setDoc, updateDoc, deleteDoc, limit, query, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyC5OQ8nhydwpM0CZUC7WZfswnoY8g3nnnc',
  authDomain: 'stagebox-49312.firebaseapp.com',
  projectId: 'stagebox-49312',
  storageBucket: 'stagebox-49312.firebasestorage.app',
  messagingSenderId: '1079653078758',
  appId: '1:1079653078758:web:1d83fcb22da40608dd4d27',
};
const ADMIN_UID = 'wmWflOFnT5N1Yh0aRPu9z0A9vzu2';

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error('Usage: node scripts/verify-rules.js <email> <password>');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const results = [];
async function check(label, expect, fn) {
  try {
    await fn();
    const ok = expect === 'ALLOW';
    results.push(`${ok ? 'PASS' : 'FAIL'}  ${label}  → ALLOWED (expected ${expect})`);
  } catch (e) {
    const denied = e.code === 'permission-denied' || /permission/i.test(e.message || '');
    const ok = expect === 'DENY' && denied;
    results.push(`${ok ? 'PASS' : 'FAIL'}  ${label}  → ${denied ? 'DENIED' : 'ERROR:' + (e.code || e.message)} (expected ${expect})`);
  }
}

(async () => {
  // Register throwaway customer (or sign in if it already exists)
  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') cred = await signInWithEmailAndPassword(auth, email, password);
    else throw e;
  }
  const uid = cred.user.uid;
  console.log(`Customer uid: ${uid}\n`);

  // Own profile doc (register flow does this) — isOwner
  await check('customer create own users/{uid}', 'ALLOW', () =>
    setDoc(doc(db, 'users', uid), { email, name: 'ruletest', role: 'customer', createdAt: Timestamp.now(), updatedAt: Timestamp.now() })
  );

  // Reads the app needs as a logged-in customer
  await check('customer read products', 'ALLOW', () => getDocs(query(collection(db, 'products'), limit(1))));
  await check('customer read categories', 'ALLOW', () => getDocs(query(collection(db, 'categories'), limit(1))));
  await check('customer read featuredSets', 'ALLOW', () => getDocs(query(collection(db, 'featuredSets'), limit(1))));

  // Order create with own userId — must be allowed
  let orderId = null;
  await check('customer create own order', 'ALLOW', async () => {
    const ref = await addDoc(collection(db, 'orders'), {
      userId: uid, items: [], status: 'requested', totalPrice: 0, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });
    orderId = ref.id;
  });
  if (orderId) {
    await check('customer read own order', 'ALLOW', () => getDoc(doc(db, 'orders', orderId)));
  }

  // Inquiry create — signed-in allowed
  let inqId = null;
  await check('customer create inquiry', 'ALLOW', async () => {
    const ref = await addDoc(collection(db, 'inquiries'), {
      name: 'ruletest', phone: '000', message: 'test', status: 'pending', createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });
    inqId = ref.id;
  });

  // ---- things that MUST be denied for a customer ----
  await check('customer write a product (catalog)', 'DENY', () =>
    setDoc(doc(db, 'products', 'ruletest-should-fail'), { title: 'x' })
  );
  await check('customer create order for ANOTHER user', 'DENY', () =>
    addDoc(collection(db, 'orders'), { userId: 'someone-else', status: 'requested', createdAt: Timestamp.now(), updatedAt: Timestamp.now() })
  );
  await check("customer read admin's user doc", 'DENY', () => getDoc(doc(db, 'users', ADMIN_UID)));
  await check('customer read all inquiries', 'DENY', () => getDocs(query(collection(db, 'inquiries'), limit(1))));

  // ---- cleanup ----
  console.log('--- results ---');
  results.forEach(r => console.log(r));
  const failed = results.filter(r => r.startsWith('FAIL')).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);

  console.log('\nCleaning up test data...');
  try { if (inqId) await deleteDoc(doc(db, 'inquiries', inqId)); } catch (e) { console.log('  (inquiry cleanup needs admin; leaving ' + inqId + ')'); }
  try { if (orderId) await deleteDoc(doc(db, 'orders', orderId)); } catch {}
  try { await deleteDoc(doc(db, 'users', uid)); } catch {}
  try { await deleteUser(auth.currentUser); console.log('  deleted throwaway auth account'); } catch (e) { console.log('  (auth account left: ' + email + ')'); }

  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('Fatal:', e.code || e.message); process.exit(1); });
