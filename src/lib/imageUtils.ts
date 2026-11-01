/**
 * USKI STORE - Client-side Image Optimization & WebP Conversion
 * Automatically resizes and converts images to WebP format for fast web delivery.
 */

export interface WebPConversionResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalName: string;
  originalSize: number;
  webpSize: number;
}

/**
 * Convert any supported image file (PNG, JPG, JPEG, BMP, etc.) directly into WebP format
 */
export async function convertImageToWebP(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<WebPConversionResult> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak valid atau tidak didukung.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize down proportionally if exceeds maximum bounds
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Gagal menginisialisasi canvas context.'));
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP
        const dataUrl = canvas.toDataURL('image/webp', quality);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Konversi ke format WebP gagal.'));
            }
            const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const webpFileName = `${baseName}.webp`;
            const webpFile = new File([blob], webpFileName, { type: 'image/webp' });

            resolve({
              file: webpFile,
              blob,
              dataUrl,
              originalName: file.name,
              originalSize: file.size,
              webpSize: blob.size,
            });
          },
          'image/webp',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
