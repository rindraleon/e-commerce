import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

export const uploadsRoot = join(process.cwd(), 'storage', 'uploads');
export const productUploadsDir = join(uploadsRoot, 'products');
export const articleUploadsDir = join(uploadsRoot, 'articles');
export const paymentUploadsDir = join(uploadsRoot, 'payments');

interface UploadCandidateFile {
  originalname: string;
  mimetype: string;
}

const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
]);

const allowedProofMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

function ensureDirectory(directory: string) {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

export function ensureUploadDirectories() {
  ensureDirectory(uploadsRoot);
  ensureDirectory(productUploadsDir);
  ensureDirectory(articleUploadsDir);
  ensureDirectory(paymentUploadsDir);
}

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function createImageUploadOptions(
  destinationDir: string,
  fallbackName: string,
) {
  return {
    storage: diskStorage({
      destination: (_request, _file, callback) => {
        ensureUploadDirectories();
        callback(null, destinationDir);
      },
      filename: (_request, file, callback) => {
        const extension = extname(file.originalname) || '.jpg';
        const baseName = sanitizeFileName(file.originalname) || fallbackName;
        callback(null, `${Date.now()}-${baseName}${extension}`);
      },
    }),
    fileFilter: (
      _request: Express.Request,
      file: UploadCandidateFile,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!allowedImageMimeTypes.has(file.mimetype)) {
        callback(new Error('Only JPG, PNG and WEBP images are allowed'), false);
        return;
      }

      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 10,
    },
  };
}

export const productImageMulterOptions = createImageUploadOptions(
  productUploadsDir,
  'product-image',
);

export const articleImageMulterOptions = createImageUploadOptions(
  articleUploadsDir,
  'article-cover',
);

export const paymentProofMulterOptions = {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      ensureUploadDirectories();
      callback(null, paymentUploadsDir);
    },
    filename: (_request, file, callback) => {
      const extension = extname(file.originalname) || '.jpg';
      const baseName = sanitizeFileName(file.originalname) || 'payment-proof';
      callback(null, `${Date.now()}-${baseName}${extension}`);
    },
  }),
  fileFilter: (
    _request: Express.Request,
    file: UploadCandidateFile,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!allowedProofMimeTypes.has(file.mimetype)) {
      callback(
        new Error('Only JPG, PNG, WEBP images and PDF proofs are allowed'),
        false,
      );
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
  },
};

export function buildProductImagePublicPath(fileName: string) {
  return `/uploads/products/${fileName}`;
}

export function buildArticleImagePublicPath(fileName: string) {
  return `/uploads/articles/${fileName}`;
}

export function buildPaymentProofPublicPath(fileName: string) {
  return `/uploads/payments/${fileName}`;
}

export function resolveUploadPath(publicPath: string) {
  const normalizedPath = publicPath.replace(/^\/+/, '');
  if (!normalizedPath.startsWith('uploads/')) {
    return null;
  }

  return join(process.cwd(), 'storage', normalizedPath);
}
