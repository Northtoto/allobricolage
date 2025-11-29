import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'technicians');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

export async function processProfilePicture(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const processedFilename = `processed-${Date.now()}-${filename}`;
  const outputPath = path.join(UPLOAD_DIR, processedFilename);

  await sharp(buffer)
    .resize(500, 500, { fit: 'cover' })
    .toFile(outputPath);

  return `/uploads/technicians/${processedFilename}`;
}

