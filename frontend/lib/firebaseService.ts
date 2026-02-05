import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
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
import axios from 'axios';
import { db, storage, auth } from './firebase';

// Legacy axios instance for admin operations that still need the backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
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

// Products API
export const productApi = {
  getAll: async (options?: { includeUnavailable?: boolean }): Promise<Product[]> => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('status', '==', 'active'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const products: Product[] = [];
    for (const docSnap of snapshot.docs) {
      const product = convertDoc<Product>(docSnap);

      // Get category
      if (product.categoryId) {
        const categoryDoc = await getDoc(doc(db, 'categories', product.categoryId));
        if (categoryDoc.exists()) {
          product.category = convertDoc<Category>(categoryDoc);
        }
      }

      // Get tags
      const tagsRef = collection(db, 'products', docSnap.id, 'tags');
      const tagsSnapshot = await getDocs(tagsRef);
      product.tags = tagsSnapshot.docs.map(d => convertDoc<Tag>(d));

      // Get assets
      const assetsRef = collection(db, 'products', docSnap.id, 'assets');
      const assetsSnapshot = await getDocs(assetsRef);
      product.assets = assetsSnapshot.docs.map(d => convertDoc<Asset>(d));

      products.push(product);
    }

    // Filter out unavailable products unless includeUnavailable is true
    // Note: undefined availableCount means the product is available (not explicitly set to 0)
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
    let products: Product[] = [];

    for (const docSnap of snapshot.docs) {
      const product = convertDoc<Product>(docSnap);

      // Get category
      if (product.categoryId) {
        const categoryDoc = await getDoc(doc(db, 'categories', product.categoryId));
        if (categoryDoc.exists()) {
          product.category = convertDoc<Category>(categoryDoc);
        }
      }

      // Get tags
      const tagsRef = collection(db, 'products', docSnap.id, 'tags');
      const tagsSnapshot = await getDocs(tagsRef);
      product.tags = tagsSnapshot.docs.map(d => convertDoc<Tag>(d));

      // Get assets and calculate availability
      const assetsRef = collection(db, 'products', docSnap.id, 'assets');
      const assetsSnapshot = await getDocs(assetsRef);
      const totalAssets = assetsSnapshot.docs.length;

      // If dates are provided, calculate date-based availability
      if (params.startDate && params.endDate) {
        let availableCount = 0;

        for (const assetDoc of assetsSnapshot.docs) {
          const asset = assetDoc.data();
          if (asset.status !== 'available') continue;

          // Check blocked periods for this asset
          const blockedRef = collection(db, 'products', docSnap.id, 'assets', assetDoc.id, 'blockedPeriods');
          const blockedSnapshot = await getDocs(blockedRef);

          let isBlocked = false;
          for (const blockedDoc of blockedSnapshot.docs) {
            const blocked = blockedDoc.data();
            // Check for date overlap
            if (blocked.startDate <= params.endDate && blocked.endDate >= params.startDate) {
              isBlocked = true;
              break;
            }
          }

          if (!isBlocked) {
            availableCount++;
          }
        }

        product.availableCount = availableCount;
        product.isAvailable = availableCount > 0;
        if (availableCount === 0 && totalAssets > 0) {
          product.unavailableReason = '선택한 날짜에 모든 자산이 예약됨';
        }
      } else {
        // No dates provided - count available assets
        const availableAssets = assetsSnapshot.docs.filter(d => {
          const asset = d.data();
          return asset.status === 'available';
        });
        product.availableCount = availableAssets.length > 0 ? availableAssets.length : (totalAssets > 0 ? totalAssets : undefined);
        product.isAvailable = product.availableCount === undefined || product.availableCount > 0;
      }

      products.push(product);
    }

    // Client-side filtering for search query
    if (params.q) {
      const searchLower = params.q.toLowerCase();
      products = products.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.tags?.some(t => t.name.toLowerCase().includes(searchLower))
      );
    }

    // Filter by tags
    if (params.tags) {
      const tagNames = params.tags.split(',');
      products = products.filter(p =>
        p.tags?.some(t => tagNames.includes(t.name))
      );
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

    // Get category
    if (product.categoryId) {
      const categoryDoc = await getDoc(doc(db, 'categories', product.categoryId));
      if (categoryDoc.exists()) {
        product.category = convertDoc<Category>(categoryDoc);
      }
    }

    // Get supplier
    if (product.supplierId) {
      const supplierDoc = await getDoc(doc(db, 'users', product.supplierId));
      if (supplierDoc.exists()) {
        product.supplier = convertDoc<User>(supplierDoc) as any;
      }
    }

    // Get tags
    const tagsRef = collection(db, 'products', id, 'tags');
    const tagsSnapshot = await getDocs(tagsRef);
    product.tags = tagsSnapshot.docs.map(d => convertDoc<Tag>(d));

    // Get assets
    const assetsRef = collection(db, 'products', id, 'assets');
    const assetsSnapshot = await getDocs(assetsRef);
    product.assets = assetsSnapshot.docs.map(d => convertDoc<Asset>(d));

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
interface FeaturedSet {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  productIds: string[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
    await updateDoc(userRef, userData).catch(() =>
      addDoc(collection(db, 'users'), { id: userCredential.user.uid, ...userData })
    );

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
  },
};

// Cart API (using localStorage for now, can be moved to Firestore)
export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const cartData = localStorage.getItem('cart');
    if (cartData) {
      return JSON.parse(cartData);
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
  }): Promise<Order> => {
    const cart = await cartApi.getCart();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const ordersRef = collection(db, 'orders');
    const orderData = {
      userId: user.uid,
      items: cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        pricePerDay: item.product?.baseDailyPrice || '0',
      })),
      startDate: data.startDate,
      endDate: data.endDate,
      deliveryMethod: data.deliveryMethod,
      shippingAddress: data.shippingAddress,
      deliveryNotes: data.deliveryNotes || null,
      status: 'requested',
      totalPrice: cart.items.reduce((sum, item) => {
        const days = Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return sum + (parseFloat(item.product?.baseDailyPrice || '0') * item.quantity * days);
      }, 0),
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

    const orders: Order[] = [];
    for (const docSnap of snapshot.docs) {
      const order = convertDoc<Order>(docSnap);
      const orderData = docSnap.data();

      // Populate product info for each item
      if (orderData.items && Array.isArray(orderData.items)) {
        const populatedItems = await Promise.all(
          orderData.items.map(async (item: { productId: string; quantity: number; pricePerDay: string | number }) => {
            try {
              const productDoc = await getDoc(doc(db, 'products', item.productId));
              if (productDoc.exists()) {
                const productData = productDoc.data();
                return {
                  ...item,
                  product: {
                    id: productDoc.id,
                    title: productData.title,
                    baseDailyPrice: productData.baseDailyPrice,
                    images: productData.images || [],
                  },
                };
              }
            } catch (error) {
              console.error('Failed to load product:', item.productId, error);
            }
            return item;
          })
        );
        (order as any).items = populatedItems;
      }

      orders.push(order);
    }

    return orders;
  },

  getOrderById: async (id: string): Promise<Order> => {
    console.log('[firebaseService] getOrderById called with id:', id);
    const docRef = doc(db, 'orders', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error('[firebaseService] Order not found:', id);
      throw new Error('Order not found');
    }

    const order = convertDoc<Order>(docSnap);
    console.log('[firebaseService] Order found:', order);
    return order;
  },

  cancel: async (id: string, reason: string): Promise<Order> => {
    const docRef = doc(db, 'orders', id);
    await updateDoc(docRef, {
      status: 'cancelled',
      cancelReason: reason,
      updatedAt: Timestamp.now(),
    });

    const updatedDoc = await getDoc(docRef);
    return convertDoc<Order>(updatedDoc);
  },
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

  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
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

    const orders: AdminOrder[] = [];
    for (const docSnap of snapshot.docs) {
      const order = convertDoc<AdminOrder>(docSnap);
      const orderData = docSnap.data();

      // Get user info
      if (orderData.userId) {
        const userDoc = await getDoc(doc(db, 'users', orderData.userId));
        if (userDoc.exists()) {
          order.user = convertDoc<User>(userDoc) as any;
        }
      }

      // Populate product info for each item
      if (orderData.items && Array.isArray(orderData.items)) {
        const populatedItems = await Promise.all(
          orderData.items.map(async (item: { productId: string; quantity: number; pricePerDay: string | number }) => {
            try {
              const productDoc = await getDoc(doc(db, 'products', item.productId));
              if (productDoc.exists()) {
                const productData = productDoc.data();
                return {
                  id: item.productId,
                  quantity: item.quantity,
                  pricePerDay: Number(item.pricePerDay),
                  product: {
                    id: productDoc.id,
                    title: productData.title,
                    baseDailyPrice: productData.baseDailyPrice,
                    images: productData.images || [],
                  },
                };
              }
            } catch (error) {
              console.error('Failed to load product:', item.productId, error);
            }
            return {
              id: item.productId,
              quantity: item.quantity,
              pricePerDay: Number(item.pricePerDay),
              product: {
                id: item.productId,
                title: '상품 정보 없음',
                images: [],
              },
            };
          })
        );
        order.items = populatedItems;
      }

      orders.push(order);
    }

    return orders;
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
    const snapshot = await getDocs(usersRef);
    let users = snapshot.docs.map(d => convertDoc<User>(d));

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

  // 주문 승인 (입금 대기 상태로 변경)
  approveOrder: async (orderId: string): Promise<AdminOrder> => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: 'approved',
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    const updatedDoc = await getDoc(orderRef);
    return convertDoc<AdminOrder>(updatedDoc);
  },

  // 주문 거절
  rejectOrder: async (orderId: string, reason: string): Promise<AdminOrder> => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: 'rejected',
      rejectionReason: reason,
      rejectedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    const updatedDoc = await getDoc(orderRef);

    // TODO: 사용자에게 알림 전송

    return convertDoc<AdminOrder>(updatedDoc);
  },

  // 입금 확인 (예약 확정 + 날짜 차단)
  confirmPayment: async (orderId: string): Promise<AdminOrder> => {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    // 주문 상태 업데이트
    await updateDoc(orderRef, {
      status: 'confirmed',
      confirmedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // 각 주문 아이템의 자산에 대해 차단 기간 생성
    // TODO: 실제 자산 배정 및 차단 기간 생성 로직
    // 현재는 상품 레벨에서 처리, 추후 자산 레벨로 확장

    const updatedDoc = await getDoc(orderRef);
    return convertDoc<AdminOrder>(updatedDoc);
  },

  // 주문 취소
  cancelOrder: async (orderId: string): Promise<AdminOrder> => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: 'cancelled',
      cancelledAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // TODO: 자산 차단 기간 해제 로직

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

    let availableCount = 0;

    for (const assetDoc of assetsSnapshot.docs) {
      const asset = assetDoc.data();

      // 사용 가능 상태가 아니면 스킵
      if (asset.status !== 'available') continue;

      // 해당 자산의 차단 기간 확인
      const blockedRef = collection(db, 'products', productId, 'assets', assetDoc.id, 'blockedPeriods');
      const blockedSnapshot = await getDocs(blockedRef);

      let isBlocked = false;
      for (const blockedDoc of blockedSnapshot.docs) {
        const blocked = blockedDoc.data();
        // 날짜 범위 겹침 확인
        if (blocked.startDate <= endDate && blocked.endDate >= startDate) {
          isBlocked = true;
          break;
        }
      }

      if (!isBlocked) {
        availableCount++;
      }
    }

    return availableCount;
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
