import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  runTransaction,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { db, storage, auth } from './firebase';

import {
  Product,
  Category,
  Tag,
  Cart,
  CartItem,
  Order,
  User,
  BlockedPeriod,
  Asset,
  SearchParams,
  AuthResponse,
  LoginData,
  RegisterData,
  DashboardStats,
  AdminOrder,
  FeaturedSet,
  Inquiry,
} from '@/types';

// Helper function to convert Firestore document to typed object
const convertDoc = <T>(doc: DocumentData): T => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
  } as T;
};

// Batch-fetch helpers — dedupe IDs and read in parallel to avoid N+1 queries
type ProductBrief = { id: string; title: string; baseDailyPrice?: string; images: string[] };

const fetchProductBriefs = async (ids: string[]): Promise<Map<string, ProductBrief>> => {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, ProductBrief>();
  await Promise.all(
    unique.map(async (pid) => {
      try {
        const snap = await getDoc(doc(db, 'products', pid));
        if (snap.exists()) {
          const d = snap.data();
          map.set(pid, { id: snap.id, title: d.title, baseDailyPrice: d.baseDailyPrice, images: d.images || [] });
        }
      } catch (error) {
        console.error('Failed to load product:', pid, error);
      }
    })
  );
  return map;
};

const fetchUsersByIds = async (ids: string[]): Promise<Map<string, User>> => {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, User>();
  await Promise.all(
    unique.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          map.set(uid, convertDoc<User>(snap));
        }
      } catch (error) {
        console.error('Failed to load user:', uid, error);
      }
    })
  );
  return map;
};

// Products API
export const productApi = {
  getAll: async (options?: { includeUnavailable?: boolean }): Promise<Product[]> => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('status', '==', 'active'));
    const snapshot = await getDocs(q);

    // Batch fetch all categories once (instead of N queries)
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categoryMap = new Map<string, Category>();
    categoriesSnapshot.docs.forEach(d => {
      categoryMap.set(d.id, convertDoc<Category>(d));
    });

    // Convert products without fetching subcollections (fast)
    const products: Product[] = snapshot.docs.map(docSnap => {
      const product = convertDoc<Product>(docSnap);

      // Map category from cache
      if (product.categoryId && categoryMap.has(product.categoryId)) {
        product.category = categoryMap.get(product.categoryId);
      }

      // For listing, assume available (details fetched on product page)
      product.isAvailable = true;

      return product;
    });

    // Sort by createdAt descending
    products.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });

    // Filter out unavailable products unless includeUnavailable is true
    if (!options?.includeUnavailable) {
      return products.filter(p => p.availableCount === undefined || p.availableCount > 0);
    }

    return products;
  },

  search: async (params: SearchParams): Promise<Product[]> => {
    const productsRef = collection(db, 'products');
    let q = query(productsRef, where('status', '==', 'active'));

    if (params.categoryId) {
      q = query(q, where('categoryId', '==', params.categoryId));
    }

    const snapshot = await getDocs(q);

    // Batch fetch all categories once
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categoryMap = new Map<string, Category>();
    categoriesSnapshot.docs.forEach(d => {
      categoryMap.set(d.id, convertDoc<Category>(d));
    });

    // Convert products without fetching subcollections (fast)
    let products: Product[] = snapshot.docs.map(docSnap => {
      const product = convertDoc<Product>(docSnap);

      // Map category from cache
      if (product.categoryId && categoryMap.has(product.categoryId)) {
        product.category = categoryMap.get(product.categoryId);
      }

      // For search listing, assume all products are available
      // Detailed availability is checked on product detail page
      product.isAvailable = true;

      return product;
    });

    // Client-side filtering for search query
    if (params.q) {
      const searchLower = params.q.toLowerCase();
      products = products.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    // When a rental period is given, compute real per-product availability for those dates
    if (params.startDate && params.endDate) {
      const counts = await Promise.all(
        products.map(p => adminApi.getAvailableAssetCount(p.id, params.startDate!, params.endDate!))
      );
      products.forEach((p, i) => {
        p.availableCount = counts[i];
        p.isAvailable = counts[i] > 0;
      });
    }

    // Filter out unavailable products unless includeUnavailable is true
    if (!params.includeUnavailable) {
      products = products.filter(p => p.availableCount === undefined || p.availableCount > 0);
    }

    return products;
  },

  getById: async (id: string): Promise<Product> => {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Product not found');
    }

    const product = convertDoc<Product>(docSnap);

    // Fetch category, supplier, tags, and assets in parallel (independent reads)
    const [categoryDoc, supplierDoc, tagsSnapshot, assetsSnapshot] = await Promise.all([
      product.categoryId ? getDoc(doc(db, 'categories', product.categoryId)) : Promise.resolve(null),
      product.supplierId ? getDoc(doc(db, 'users', product.supplierId)) : Promise.resolve(null),
      getDocs(collection(db, 'products', id, 'tags')),
      getDocs(collection(db, 'products', id, 'assets')),
    ]);

    if (categoryDoc?.exists()) {
      product.category = convertDoc<Category>(categoryDoc);
    }
    if (supplierDoc?.exists()) {
      product.supplier = convertDoc<User>(supplierDoc) as any;
    }
    product.tags = tagsSnapshot.docs.map(d => convertDoc<Tag>(d));
    product.assets = assetsSnapshot.docs.map(d => convertDoc<Asset>(d));
    product.availableCount = product.assets.filter(a => a.status === 'available').length;

    return product;
  },

  getBlockedPeriods: async (id: string): Promise<BlockedPeriod[]> => {
    const blockedRef = collection(db, 'products', id, 'blockedPeriods');
    const snapshot = await getDocs(blockedRef);
    return snapshot.docs.map(d => convertDoc<BlockedPeriod>(d));
  },
};

// Categories API
export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);
    const categories = snapshot.docs.map(d => convertDoc<Category>(d));

    // Count products per category
    const productsRef = collection(db, 'products');
    const productsQuery = query(productsRef, where('status', '==', 'active'));
    const productsSnapshot = await getDocs(productsQuery);

    const productCountMap: Record<string, number> = {};
    productsSnapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (data.categoryId) {
        productCountMap[data.categoryId] = (productCountMap[data.categoryId] || 0) + 1;
      }
    });

    // Add productCount to each category
    return categories.map(cat => ({
      ...cat,
      productCount: productCountMap[cat.id] || 0,
    }));
  },

  getByName: async (name: string): Promise<Category | undefined> => {
    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef, where('name', '==', name));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    return convertDoc<Category>(snapshot.docs[0]);
  },

  create: async (data: { name: string; slug: string; parentId?: string | null }): Promise<Category> => {
    const categoriesRef = collection(db, 'categories');
    const level = data.parentId ? 2 : 1;
    const docRef = await addDoc(categoriesRef, {
      name: data.name,
      slug: data.slug,
      parentId: data.parentId || null,
      level,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    const newDoc = await getDoc(docRef);
    return convertDoc<Category>(newDoc);
  },

  update: async (id: string, data: { name?: string; slug?: string; parentId?: string | null }): Promise<Category> => {
    const categoryRef = doc(db, 'categories', id);
    await updateDoc(categoryRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    const updatedDoc = await getDoc(categoryRef);
    return convertDoc<Category>(updatedDoc);
  },

  delete: async (id: string): Promise<void> => {
    const categoryRef = doc(db, 'categories', id);
    await deleteDoc(categoryRef);
  },
};

// Featured Sets API
export const featuredSetApi = {
  getAll: async (): Promise<FeaturedSet[]> => {
    const setsRef = collection(db, 'featuredSets');
    const q = query(setsRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => convertDoc<FeaturedSet>(d));
  },

  getActive: async (): Promise<FeaturedSet[]> => {
    const setsRef = collection(db, 'featuredSets');
    const q = query(setsRef, where('isActive', '==', true), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => convertDoc<FeaturedSet>(d));
  },

  create: async (data: Omit<FeaturedSet, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeaturedSet> => {
    const setsRef = collection(db, 'featuredSets');
    const docRef = await addDoc(setsRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    const newDoc = await getDoc(docRef);
    return convertDoc<FeaturedSet>(newDoc);
  },

  update: async (id: string, data: Partial<Omit<FeaturedSet, 'id' | 'createdAt' | 'updatedAt'>>): Promise<FeaturedSet> => {
    const setRef = doc(db, 'featuredSets', id);
    await updateDoc(setRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    const updatedDoc = await getDoc(setRef);
    return convertDoc<FeaturedSet>(updatedDoc);
  },

  delete: async (id: string): Promise<void> => {
    const setRef = doc(db, 'featuredSets', id);
    await deleteDoc(setRef);
  },
};

// Inquiry API
export const inquiryApi = {
  create: async (data: {
    featuredSetId?: string;
    featuredSetTitle?: string;
    name: string;
    phone: string;
    email?: string;
    message: string;
  }): Promise<Inquiry> => {
    const inquiriesRef = collection(db, 'inquiries');
    const docRef = await addDoc(inquiriesRef, {
      ...data,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    const newDoc = await getDoc(docRef);
    return convertDoc<Inquiry>(newDoc);
  },

  getAll: async (): Promise<Inquiry[]> => {
    const inquiriesRef = collection(db, 'inquiries');
    const q = query(inquiriesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => convertDoc<Inquiry>(d));
  },

  updateStatus: async (id: string, status: Inquiry['status']): Promise<Inquiry> => {
    const docRef = doc(db, 'inquiries', id);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });
    const updatedDoc = await getDoc(docRef);
    return convertDoc<Inquiry>(updatedDoc);
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'inquiries', id));
  },
};

// Tags API
export const tagApi = {
  getAll: async (): Promise<Tag[]> => {
    const tagsRef = collection(db, 'tags');
    const snapshot = await getDocs(tagsRef);
    return snapshot.docs.map(d => convertDoc<Tag>(d));
  },

  create: async (data: { name: string; type?: string }): Promise<Tag> => {
    const tagsRef = collection(db, 'tags');
    const docRef = await addDoc(tagsRef, {
      ...data,
      type: data.type || 'other',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    const newDoc = await getDoc(docRef);
    return convertDoc<Tag>(newDoc);
  },
};

// Auth API
export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);

    // Create user document in Firestore
    const userRef = doc(db, 'users', userCredential.user.uid);
    const userData = {
      email: data.email,
      name: data.name,
      phone: data.phone || null,
      role: 'customer',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    // Create-or-overwrite the profile doc keyed by uid so login can read users/{uid}
    await setDoc(userRef, userData);

    const token = await userCredential.user.getIdToken();

    return {
      accessToken: token,
      user: {
        id: userCredential.user.uid,
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    const token = await userCredential.user.getIdToken();

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    let userData: User;

    if (userDoc.exists()) {
      userData = convertDoc<User>(userDoc);
    } else {
      userData = {
        id: userCredential.user.uid,
        email: userCredential.user.email || data.email,
        name: userCredential.user.displayName || 'User',
        role: 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    localStorage.setItem('accessToken', token);

    return {
      accessToken: token,
      user: userData,
    };
  },

  logout: (): void => {
    signOut(auth);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};

// Cart API (using localStorage for now, can be moved to Firestore)
export const cartApi = {
  getCart: async (): Promise<Cart> => {
    try {
      const cartData = localStorage.getItem('cart');
      if (cartData) {
        return JSON.parse(cartData);
      }
    } catch {
      // Invalid cart data, return empty cart
    }
    return {
      id: 'local-cart',
      userId: 'local',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  addItem: async (data: {
    productId: string;
    quantity: number;
    startDate: string;
    endDate: string;
  }): Promise<Cart> => {
    const cart = await cartApi.getCart();

    // Get product details
    const product = await productApi.getById(data.productId);

    const newItem: CartItem = {
      id: `item-${Date.now()}`,
      cartId: cart.id,
      productId: data.productId,
      product,
      quantity: data.quantity,
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cart.items.push(newItem);
    cart.updatedAt = new Date().toISOString();
    localStorage.setItem('cart', JSON.stringify(cart));

    return cart;
  },

  updateQuantity: async (itemId: string, quantity: number): Promise<Cart> => {
    const cart = await cartApi.getCart();
    const item = cart.items.find(i => i.id === itemId);
    if (item) {
      item.quantity = quantity;
      item.updatedAt = new Date().toISOString();
    }
    cart.updatedAt = new Date().toISOString();
    localStorage.setItem('cart', JSON.stringify(cart));
    return cart;
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    const cart = await cartApi.getCart();
    cart.items = cart.items.filter(i => i.id !== itemId);
    cart.updatedAt = new Date().toISOString();
    localStorage.setItem('cart', JSON.stringify(cart));
    return cart;
  },

  clearCart: async (): Promise<void> => {
    localStorage.removeItem('cart');
  },
};

// Orders API
export const orderApi = {
  create: async (data: {
    startDate: string;
    endDate: string;
    deliveryMethod: string;
    shippingAddress: string;
    deliveryNotes?: string;
    deliveryFee?: number;
  }): Promise<Order> => {
    const cart = await cartApi.getCart();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const rentalDays = (start: string, end: string) => {
      const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
      return Math.max(1, Math.ceil(diff) + 1);
    };

    // Keep each item's own rental dates so per-item periods aren't lost
    const items = cart.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      pricePerDay: item.product?.baseDailyPrice || '0',
      startDate: item.startDate || data.startDate,
      endDate: item.endDate || data.endDate,
    }));

    // Order-level window spans every item (min start … max end), not just item[0]
    const starts = items.map(i => i.startDate).filter(Boolean);
    const ends = items.map(i => i.endDate).filter(Boolean);
    const orderStart = starts.length ? starts.reduce((a, b) => (a < b ? a : b)) : data.startDate;
    const orderEnd = ends.length ? ends.reduce((a, b) => (a > b ? a : b)) : data.endDate;

    const itemsTotal = items.reduce((sum, item) => {
      const price = parseFloat(String(item.pricePerDay || '0'));
      return sum + price * item.quantity * rentalDays(item.startDate, item.endDate);
    }, 0);
    const deliveryFee = data.deliveryFee || 0;

    const ordersRef = collection(db, 'orders');
    const orderData = {
      userId: user.uid,
      items,
      startDate: orderStart,
      endDate: orderEnd,
      deliveryMethod: data.deliveryMethod,
      shippingAddress: data.shippingAddress,
      deliveryNotes: data.deliveryNotes || null,
      deliveryFee,
      status: 'requested',
      totalPrice: itemsTotal + deliveryFee,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(ordersRef, orderData);
    await cartApi.clearCart();

    const newDoc = await getDoc(docRef);
    return convertDoc<Order>(newDoc);
  },

  getMyOrders: async (): Promise<Order[]> => {
    const user = auth.currentUser;
    if (!user) {
      return [];
    }

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const raw = snapshot.docs.map(docSnap => ({ order: convertDoc<Order>(docSnap), data: docSnap.data() }));

    // Collect every referenced product ID and fetch them once (deduped, parallel)
    const productIds = raw.flatMap(({ data }) =>
      Array.isArray(data.items) ? data.items.map((i: { productId: string }) => i.productId) : []
    );
    const productMap = await fetchProductBriefs(productIds);

    return raw.map(({ order, data }) => {
      if (Array.isArray(data.items)) {
        (order as any).items = data.items.map((item: { productId: string }) => {
          const product = productMap.get(item.productId);
          return product ? { ...item, product } : item;
        });
      }
      return order;
    });
  },

  getOrderById: async (id: string): Promise<Order> => {
    const docRef = doc(db, 'orders', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Order not found');
    }

    return convertDoc<Order>(docSnap);
  },

  cancel: async (id: string, reason: string): Promise<Order> => {
    const docRef = doc(db, 'orders', id);
    const snap = await getDoc(docRef);
    // After approval an asset is locked to this order; releasing it needs admin
    // rights, so customers may only self-cancel while still 'requested'.
    if (snap.exists() && snap.data().status !== 'requested') {
      throw new Error('승인된 예약은 직접 취소할 수 없습니다. 관리자에게 문의해주세요.');
    }
    await updateDoc(docRef, {
      status: 'cancelled',
      cancelReason: reason,
      updatedAt: Timestamp.now(),
    });

    const updatedDoc = await getDoc(docRef);
    return convertDoc<Order>(updatedDoc);
  },
};

// === Asset booking (double-booking prevention) ===
// A booking is stored as an element of the `bookings` array on each asset doc.
// Assignment happens in a per-asset transaction, so two concurrent orders can
// never lock the same asset for overlapping dates (Firestore serializes the
// read+write and the loser sees the winner's booking and is rejected).
type Booking = { startDate: string; endDate: string; orderId: string };

const datesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  aStart <= bEnd && aEnd >= bStart;

// Lock `quantity` available assets of a product for [startDate, endDate] to orderId.
// Throws '재고 부족...' (rolling back any partial locks) if not enough assets are free.
const lockAssetsForItem = async (
  productId: string,
  quantity: number,
  startDate: string,
  endDate: string,
  orderId: string
): Promise<string[]> => {
  const assetsSnap = await getDocs(collection(db, 'products', productId, 'assets'));

  // Candidates: 'available' status and no overlapping manual maintenance block.
  const candidates: string[] = [];
  await Promise.all(
    assetsSnap.docs.map(async (a) => {
      if (a.data().status !== 'available') return;
      const blocked = await getDocs(collection(db, 'products', productId, 'assets', a.id, 'blockedPeriods'));
      const manualOverlap = blocked.docs.some((b) => {
        const x = b.data();
        return datesOverlap(x.startDate, x.endDate, startDate, endDate);
      });
      if (!manualOverlap) candidates.push(a.id);
    })
  );

  const locked: string[] = [];
  for (const assetId of candidates) {
    if (locked.length >= quantity) break;
    const assetRef = doc(db, 'products', productId, 'assets', assetId);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(assetRef);
        const bookings: Booking[] = snap.data()?.bookings || [];
        if (bookings.some((b) => datesOverlap(b.startDate, b.endDate, startDate, endDate))) {
          throw new Error('ASSET_TAKEN');
        }
        tx.update(assetRef, {
          bookings: [...bookings, { startDate, endDate, orderId }],
          updatedAt: Timestamp.now(),
        });
      });
      locked.push(assetId);
    } catch (e) {
      if (e instanceof Error && e.message === 'ASSET_TAKEN') continue; // taken concurrently, try next
      throw e;
    }
  }

  if (locked.length < quantity) {
    await Promise.all(locked.map((id) => releaseAssetBooking(productId, id, orderId)));
    throw new Error(`재고 부족: 해당 기간에 예약 가능한 자산이 부족합니다 (확보 ${locked.length}/${quantity})`);
  }
  return locked;
};

// Remove all bookings made by orderId from a specific asset.
const releaseAssetBooking = async (productId: string, assetId: string, orderId: string): Promise<void> => {
  const assetRef = doc(db, 'products', productId, 'assets', assetId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(assetRef);
    if (!snap.exists()) return;
    const bookings: Booking[] = (snap.data().bookings || []).filter((b: Booking) => b.orderId !== orderId);
    tx.update(assetRef, { bookings, updatedAt: Timestamp.now() });
  });
};

type OrderAssignment = { productId: string; assetId: string; startDate: string; endDate: string };

// Create an in-app notification for a user and (best-effort) send an email copy.
// Email only fires when RESEND_API_KEY is configured on the server; failures
// never block the order action.
const notifyCustomer = async (
  userId: string | undefined,
  type: string,
  title: string,
  message: string,
  metadata: Record<string, unknown> = {}
): Promise<void> => {
  if (!userId) return;
  try {
    await addDoc(collection(db, 'notifications'), {
      userId, type, title, message, metadata, isRead: false,
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });
  } catch (e) {
    console.error('createNotification failed:', e);
  }
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    const email = userSnap.exists() ? (userSnap.data().email as string | undefined) : undefined;
    if (email) {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, subject: `[Stage Rental] ${title}`, text: message }),
      });
    }
  } catch (e) {
    console.error('email notify failed:', e);
  }
};

// Assign & lock one asset per unit for every item of an order. Rolls back all
// locks and rethrows (e.g. '재고 부족') if any item can't be fully satisfied.
const assignAssetsToOrder = async (
  orderId: string,
  data: { items?: Array<{ productId: string; quantity?: number; startDate?: string; endDate?: string }>; startDate?: string; endDate?: string }
): Promise<OrderAssignment[]> => {
  const items = data.items || [];
  const assignments: OrderAssignment[] = [];
  try {
    for (const item of items) {
      const qty = item.quantity || 1;
      const start = item.startDate || data.startDate || '';
      const end = item.endDate || data.endDate || '';
      const ids = await lockAssetsForItem(item.productId, qty, start, end, orderId);
      ids.forEach((assetId) => assignments.push({ productId: item.productId, assetId, startDate: start, endDate: end }));
    }
  } catch (e) {
    await Promise.all(assignments.map((a) => releaseAssetBooking(a.productId, a.assetId, orderId)));
    throw e;
  }
  return assignments;
};

// Admin API
export const adminApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const usersSnapshot = await getDocs(collection(db, 'users'));

    const products = productsSnapshot.docs.map(d => convertDoc<Product>(d));
    const orders = ordersSnapshot.docs.map(d => convertDoc<AdminOrder>(d));

    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'requested' || o.status === 'approved').length,
      confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      totalUsers: usersSnapshot.size,
      totalRevenue: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
      recentOrders: orders.slice(0, 5),
      recentProducts: products.slice(0, 5),
    };
  },

  getAllProducts: async (params?: { status?: string; categoryId?: string }): Promise<Product[]> => {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    let products = snapshot.docs.map(d => convertDoc<Product>(d));

    // Client-side filtering
    if (params?.status) {
      products = products.filter(p => p.status === params.status);
    }
    if (params?.categoryId) {
      products = products.filter(p => p.categoryId === params.categoryId);
    }

    return products;
  },

  createProduct: async (data: {
    title: string;
    description: string;
    categoryId: string;
    baseDailyPrice: number;
    tagIds?: string[];
    images?: string[];
    detailImages?: string[];
    status?: string;
  }): Promise<Product> => {
    const productsRef = collection(db, 'products');
    const productData = {
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      baseDailyPrice: data.baseDailyPrice,
      images: data.images || [],
      detailImages: data.detailImages || [],
      status: data.status || 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(productsRef, productData);

    // Add tags as subcollection if provided
    if (data.tagIds && data.tagIds.length > 0) {
      const tagsRef = collection(db, 'products', docRef.id, 'tags');
      for (const tagId of data.tagIds) {
        const tagDoc = await getDoc(doc(db, 'tags', tagId));
        if (tagDoc.exists()) {
          const tagData = tagDoc.data();
          await addDoc(tagsRef, {
            id: tagId,
            name: tagData.name,
            type: tagData.type || 'other',
          });
        }
      }
    }

    const newDoc = await getDoc(docRef);
    return convertDoc<Product>(newDoc);
  },

  updateProduct: async (id: string, data: Partial<Product> & { tagIds?: string[] }): Promise<Product> => {
    const docRef = doc(db, 'products', id);
    // tagIds / tags are not plain doc fields — handle separately, don't write them onto the product doc
    const { tagIds, tags, ...rest } = data;

    const payload: Record<string, unknown> = { ...rest, updatedAt: Timestamp.now() };
    if (rest.baseDailyPrice !== undefined) {
      payload.baseDailyPrice = Number(rest.baseDailyPrice); // store numeric, consistent with createProduct
    }
    await updateDoc(docRef, payload);

    // If tagIds is explicitly provided, resync the tags subcollection
    if (tagIds) {
      const tagsRef = collection(db, 'products', id, 'tags');
      const existing = await getDocs(tagsRef);
      await Promise.all(existing.docs.map(d => deleteDoc(d.ref)));
      await Promise.all(
        tagIds.map(async (tagId) => {
          const tagDoc = await getDoc(doc(db, 'tags', tagId));
          if (tagDoc.exists()) {
            const tagData = tagDoc.data();
            await addDoc(tagsRef, { id: tagId, name: tagData.name, type: tagData.type || 'other' });
          }
        })
      );
    }

    const updatedDoc = await getDoc(docRef);
    return convertDoc<Product>(updatedDoc);
  },

  deleteProduct: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'products', id));
  },

  updateProductStatus: async (id: string, status: string): Promise<Product> => {
    return adminApi.updateProduct(id, { status: status as 'active' | 'inactive' });
  },

  getAllOrders: async (): Promise<AdminOrder[]> => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const raw = snapshot.docs.map(docSnap => ({ order: convertDoc<AdminOrder>(docSnap), data: docSnap.data() }));

    // Batch-fetch all referenced users and products once (deduped, parallel)
    const userMap = await fetchUsersByIds(raw.map(({ data }) => data.userId));
    const productIds = raw.flatMap(({ data }) =>
      Array.isArray(data.items) ? data.items.map((i: { productId: string }) => i.productId) : []
    );
    const productMap = await fetchProductBriefs(productIds);

    return raw.map(({ order, data }) => {
      const user = data.userId ? userMap.get(data.userId) : undefined;
      if (user) {
        order.user = user as any;
      }

      if (Array.isArray(data.items)) {
        order.items = data.items.map((item: { productId: string; quantity: number; pricePerDay: string | number }) => {
          const product = productMap.get(item.productId);
          return {
            id: item.productId,
            quantity: item.quantity,
            pricePerDay: Number(item.pricePerDay),
            product: product
              ? {
                  id: product.id,
                  title: product.title,
                  baseDailyPrice: product.baseDailyPrice,
                  images: product.images,
                }
              : {
                  id: item.productId,
                  title: '상품 정보 없음',
                  images: [],
                },
          };
        });
      }

      return order;
    });
  },

  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const docRef = doc(db, 'orders', id);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });
    const updatedDoc = await getDoc(docRef);
    return convertDoc<Order>(updatedDoc);
  },

  getAllUsers: async (params?: { role?: string }): Promise<User[]> => {
    const usersRef = collection(db, 'users');
    const [snapshot, ordersSnapshot] = await Promise.all([
      getDocs(usersRef),
      getDocs(collection(db, 'orders')),
    ]);

    // Tally order counts per user once
    const orderCounts = new Map<string, number>();
    ordersSnapshot.docs.forEach(d => {
      const uid = d.data().userId;
      if (uid) orderCounts.set(uid, (orderCounts.get(uid) || 0) + 1);
    });

    let users = snapshot.docs.map(d => {
      const user = convertDoc<User>(d);
      (user as User & { _count?: { orders: number } })._count = { orders: orderCounts.get(user.id) || 0 };
      return user;
    });

    // Client-side filtering
    if (params?.role) {
      users = users.filter(u => u.role === params.role);
    }

    return users;
  },

  updateUserRole: async (id: string, role: string): Promise<User> => {
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, {
      role,
      updatedAt: Timestamp.now(),
    });
    const updatedDoc = await getDoc(docRef);
    return convertDoc<User>(updatedDoc);
  },

  deleteUser: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', id));
  },

  // Assets management
  getAssets: async (productId: string): Promise<Asset[]> => {
    const assetsRef = collection(db, 'products', productId, 'assets');
    const snapshot = await getDocs(assetsRef);
    return snapshot.docs.map(d => convertDoc<Asset>(d));
  },

  createAsset: async (productId: string, data: { serialNumber: string; condition?: string }): Promise<Asset> => {
    const assetsRef = collection(db, 'products', productId, 'assets');
    const docRef = await addDoc(assetsRef, {
      ...data,
      productId,
      status: 'available',
      conditionGrade: data.condition || 'A',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    const newDoc = await getDoc(docRef);
    return convertDoc<Asset>(newDoc);
  },

  updateAsset: async (assetId: string, data: Partial<Asset>): Promise<Asset> => {
    // Note: This requires knowing the productId for the subcollection path
    // For now, we'll need to store assets in a top-level collection or pass productId
    throw new Error('Not implemented - need productId for subcollection');
  },

  deleteAsset: async (assetId: string): Promise<void> => {
    // Same issue as updateAsset
    throw new Error('Not implemented - need productId for subcollection');
  },

  // Blocked periods management
  getBlockedPeriods: async (productId: string): Promise<BlockedPeriod[]> => {
    const blockedRef = collection(db, 'products', productId, 'blockedPeriods');
    const snapshot = await getDocs(blockedRef);
    return snapshot.docs.map(d => convertDoc<BlockedPeriod>(d));
  },

  createBlockedPeriod: async (productId: string, data: { startDate: string; endDate: string; reason: string }): Promise<BlockedPeriod> => {
    const blockedRef = collection(db, 'products', productId, 'blockedPeriods');
    const docRef = await addDoc(blockedRef, {
      productId,
      blockedStart: data.startDate,
      blockedEnd: data.endDate,
      reason: data.reason,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    const newDoc = await getDoc(docRef);
    return convertDoc<BlockedPeriod>(newDoc);
  },

  deleteBlockedPeriod: async (productId: string, periodId: string): Promise<void> => {
    await deleteDoc(doc(db, 'products', productId, 'blockedPeriods', periodId));
  },

  // === Enhanced Asset Management ===

  // 자산 생성 (고유 코드 포함)
  createAssetWithCode: async (productId: string, data: {
    assetCode: string;
    serialNumber?: string;
    conditionGrade?: string;
    images?: string[];
    notes?: string;
  }): Promise<Asset> => {
    const assetsRef = collection(db, 'products', productId, 'assets');
    const docRef = await addDoc(assetsRef, {
      productId,
      assetCode: data.assetCode,
      serialNumber: data.serialNumber || null,
      conditionGrade: data.conditionGrade || 'A',
      images: data.images || [],
      notes: data.notes || null,
      status: 'available',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    const newDoc = await getDoc(docRef);
    return convertDoc<Asset>(newDoc);
  },

  // 자산 수정
  updateAssetById: async (productId: string, assetId: string, data: Partial<Asset>): Promise<Asset> => {
    const assetRef = doc(db, 'products', productId, 'assets', assetId);
    await updateDoc(assetRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    const updatedDoc = await getDoc(assetRef);
    return convertDoc<Asset>(updatedDoc);
  },

  // 자산 삭제
  deleteAssetById: async (productId: string, assetId: string): Promise<void> => {
    await deleteDoc(doc(db, 'products', productId, 'assets', assetId));
  },

  // 자산의 차단 기간 조회
  getAssetBlockedPeriods: async (productId: string, assetId: string): Promise<AssetBlockedPeriod[]> => {
    const blockedRef = collection(db, 'products', productId, 'assets', assetId, 'blockedPeriods');
    const snapshot = await getDocs(blockedRef);
    return snapshot.docs.map(d => convertDoc<AssetBlockedPeriod>(d));
  },

  // 자산에 차단 기간 추가
  createAssetBlockedPeriod: async (
    productId: string,
    assetId: string,
    data: { startDate: string; endDate: string; reason: 'order' | 'maintenance' | 'manual'; orderId?: string; notes?: string }
  ): Promise<AssetBlockedPeriod> => {
    const blockedRef = collection(db, 'products', productId, 'assets', assetId, 'blockedPeriods');
    const docRef = await addDoc(blockedRef, {
      assetId,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      orderId: data.orderId || null,
      notes: data.notes || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    const newDoc = await getDoc(docRef);
    return convertDoc<AssetBlockedPeriod>(newDoc);
  },

  // 자산의 차단 기간 삭제
  deleteAssetBlockedPeriod: async (productId: string, assetId: string, periodId: string): Promise<void> => {
    await deleteDoc(doc(db, 'products', productId, 'assets', assetId, 'blockedPeriods', periodId));
  },

  // === Order Workflow ===

  // 주문 승인 (1차 승인): 각 아이템에 실물 자산을 배정하고 해당 기간을 잠금.
  // 예약 가능한 자산이 부족하면 승인하지 않고 '재고 부족'으로 실패 → 이중예약 원천 차단.
  approveOrder: async (orderId: string): Promise<AdminOrder> => {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const data = orderDoc.data();
    // Assign & lock assets now; throws 재고 부족 (and rolls back) if unavailable.
    const assignments = (data.assignments && data.assignments.length)
      ? data.assignments
      : await assignAssetsToOrder(orderId, data);

    await updateDoc(orderRef, {
      status: 'approved',
      assignments,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await notifyCustomer(data.userId, 'order_approved', '주문이 승인되었습니다',
      '입금 안내에 따라 기한 내 입금해 주세요. 입금 확인 후 예약이 확정됩니다.', { orderId });
    const updatedDoc = await getDoc(orderRef);
    return convertDoc<AdminOrder>(updatedDoc);
  },

  // 주문 거절: 배정된 자산 잠금 해제
  rejectOrder: async (orderId: string, reason: string): Promise<AdminOrder> => {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    const assignments: OrderAssignment[] = orderDoc.exists() ? (orderDoc.data().assignments || []) : [];
    await Promise.all(assignments.map((a) => releaseAssetBooking(a.productId, a.assetId, orderId)));

    await updateDoc(orderRef, {
      status: 'rejected',
      rejectionReason: reason,
      assignments: [],
      rejectedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await notifyCustomer(orderDoc.exists() ? orderDoc.data().userId : undefined, 'order_rejected',
      '주문이 거절되었습니다', `사유: ${reason}`, { orderId });
    const updatedDoc = await getDoc(orderRef);
    return convertDoc<AdminOrder>(updatedDoc);
  },

  // 입금 확인 (2차 승인 / 예약 확정): 승인 단계에서 이미 자산이 잠겼으면 상태만 확정.
  // 승인을 건너뛴 경로로 들어와 미배정이면 여기서 안전망으로 자산을 잠근다(부족 시 실패).
  confirmPayment: async (orderId: string): Promise<AdminOrder> => {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const data = orderDoc.data();
    const assignments = (data.assignments && data.assignments.length)
      ? data.assignments
      : await assignAssetsToOrder(orderId, data);

    await updateDoc(orderRef, {
      status: 'confirmed',
      assignments,
      confirmedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await notifyCustomer(data.userId, 'order_confirmed', '예약이 확정되었습니다',
      '입금이 확인되어 예약이 확정되었습니다. 이용해 주셔서 감사합니다.', { orderId });
    const updatedDoc = await getDoc(orderRef);
    return convertDoc<AdminOrder>(updatedDoc);
  },

  // 주문 취소(관리자): 배정된 자산 잠금 해제
  cancelOrder: async (orderId: string): Promise<AdminOrder> => {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    const assignments: OrderAssignment[] = orderDoc.exists() ? (orderDoc.data().assignments || []) : [];
    await Promise.all(assignments.map((a) => releaseAssetBooking(a.productId, a.assetId, orderId)));

    await updateDoc(orderRef, {
      status: 'cancelled',
      assignments: [],
      cancelledAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await notifyCustomer(orderDoc.exists() ? orderDoc.data().userId : undefined, 'order_cancelled',
      '예약이 취소되었습니다', '예약이 취소되었습니다. 문의사항은 고객센터로 연락 주세요.', { orderId });
    const updatedDoc = await getDoc(orderRef);
    return convertDoc<AdminOrder>(updatedDoc);
  },

  // === Settings Management ===

  // 설정 조회
  getSettings: async (): Promise<Settings | null> => {
    const settingsRef = doc(db, 'settings', 'general');
    const settingsDoc = await getDoc(settingsRef);
    if (!settingsDoc.exists()) {
      return null;
    }
    return convertDoc<Settings>(settingsDoc);
  },

  // 설정 업데이트
  updateSettings: async (data: Partial<Settings>): Promise<Settings> => {
    const settingsRef = doc(db, 'settings', 'general');
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      await updateDoc(settingsRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } else {
      // 설정 문서가 없으면 생성
      const { setDoc } = await import('firebase/firestore');
      await setDoc(settingsRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    }

    const updatedDoc = await getDoc(settingsRef);
    return convertDoc<Settings>(updatedDoc);
  },

  // === Availability Checking ===

  // 특정 날짜 범위에 상품의 가용 자산 수 확인
  getAvailableAssetCount: async (productId: string, startDate: string, endDate: string): Promise<number> => {
    // 상품의 모든 자산 조회
    const assetsRef = collection(db, 'products', productId, 'assets');
    const assetsSnapshot = await getDocs(assetsRef);

    // Only 'available' assets are candidates
    const candidates = assetsSnapshot.docs.filter(d => d.data().status === 'available');

    // An asset is unavailable for the range if an order booking OR a manual
    // maintenance block overlaps it. Check both, in parallel.
    const blockedFlags = await Promise.all(
      candidates.map(async (assetDoc) => {
        const bookings: Booking[] = assetDoc.data().bookings || [];
        if (bookings.some(b => datesOverlap(b.startDate, b.endDate, startDate, endDate))) {
          return true;
        }
        const blockedSnapshot = await getDocs(collection(db, 'products', productId, 'assets', assetDoc.id, 'blockedPeriods'));
        return blockedSnapshot.docs.some(b => {
          const blocked = b.data();
          return datesOverlap(blocked.startDate, blocked.endDate, startDate, endDate);
        });
      })
    );

    return blockedFlags.filter(isBlocked => !isBlocked).length;
  },
};

// Import Settings type
import type { Settings, AssetBlockedPeriod } from '@/types';

// Image upload helper
export const uploadImage = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const deleteImage = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};
