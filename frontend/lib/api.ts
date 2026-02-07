// Re-export all API functions from Firebase service
// This allows the rest of the app to continue using the same imports

export {
  productApi,
  categoryApi,
  tagApi,
  authApi,
  cartApi,
  orderApi,
  adminApi,
  featuredSetApi,
  inquiryApi,
  uploadImage,
  deleteImage,
} from './firebaseService';

// Export Firebase instances for direct access if needed
export { db, storage, auth } from './firebase';
