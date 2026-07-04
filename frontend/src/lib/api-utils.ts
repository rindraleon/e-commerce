/**
 * Utility functions for handling API responses
 */

/**
 * Normalize API response to array format
 * Handles various response structures from the backend
 */
export function toArray<T = any>(result: any): T[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.data)) return result.data.data;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

/**
 * Normalize API response to single object
 * Handles various response structures from the backend
 */
export function toObject<T = any>(result: any): T | null {
  if (!result) return null;
  if (result?.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
    return result.data;
  }
  if (typeof result === 'object' && !Array.isArray(result)) {
    return result;
  }
  return null;
}

/**
 * Get product image URL
 * Handles different image structure formats
 */
export function getProductImageUrl(product: any): string | undefined {
  if (!product) return undefined;
  
  const images = product.product_images || product.productImages || [];
  const primaryImage = images.find((img: any) => img.is_primary || img.isPrimary);
  
  if (primaryImage?.image_url || primaryImage?.imageUrl) {
    return primaryImage.image_url || primaryImage.imageUrl;
  }
  
  if (images[0]?.image_url || images[0]?.imageUrl) {
    return images[0].image_url || images[0].imageUrl;
  }
  
  return product.image_url || product.imageUrl;
}

/**
 * Get localized product name
 */
export function getProductName(product: any, lang: string): string {
  if (!product) return '';
  if (lang === 'en' && product.name_en) return product.name_en;
  return product.name || '';
}

/**
 * Get localized product description
 */
export function getProductDescription(product: any, lang: string): string {
  if (!product) return '';
  if (lang === 'en' && product.description_en) return product.description_en;
  return product.description || '';
}

/**
 * Get localized category name
 */
export function getCategoryName(category: any, lang: string): string {
  if (!category) return '';
  if (lang === 'en' && category.name_en) return category.name_en;
  return category.name || '';
}

/**
 * Normalize product ID field
 */
export function getProductId(item: any): string {
  return item.product_id || item.productId || item.id || '';
}

/**
 * Normalize category ID field
 */
export function getCategoryId(item: any): string {
  return item.category_id || item.categoryId || '';
}
