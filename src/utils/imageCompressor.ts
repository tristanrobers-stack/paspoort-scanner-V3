/**
 * Automatically compress and downscale images on the client side
 * to prevent Vercel 413 (Payload Too Large) and speed up OCR analysis.
 */
export async function compressImageForOcr(
  fileOrBase64: File | string,
  maxDimension = 1800,
  quality = 0.82
): Promise<{ base64: string; mimeType: string }> {
  // If it's a PDF, we cannot downscale via canvas; return raw base64
  if (typeof fileOrBase64 === 'string') {
    if (
      fileOrBase64.startsWith('data:application/pdf') ||
      fileOrBase64.includes('application/pdf')
    ) {
      return { base64: fileOrBase64, mimeType: 'application/pdf' };
    }
  } else if (
    fileOrBase64.type === 'application/pdf' ||
    fileOrBase64.name.toLowerCase().endsWith('.pdf')
  ) {
    const base64 = await fileToBase64(fileOrBase64);
    return { base64, mimeType: 'application/pdf' };
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({
            base64: typeof fileOrBase64 === 'string' ? fileOrBase64 : '',
            mimeType: 'image/jpeg',
          });
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          base64: compressedDataUrl,
          mimeType: 'image/jpeg',
        });
      } catch (err) {
        console.warn('Canvas compression error, using fallback:', err);
        resolve({
          base64: typeof fileOrBase64 === 'string' ? fileOrBase64 : '',
          mimeType: 'image/jpeg',
        });
      }
    };

    img.onerror = () => {
      if (typeof fileOrBase64 === 'string') {
        resolve({ base64: fileOrBase64, mimeType: 'image/jpeg' });
      } else {
        fileToBase64(fileOrBase64)
          .then((b64) => resolve({ base64: b64, mimeType: fileOrBase64.type || 'image/jpeg' }))
          .catch(() => resolve({ base64: '', mimeType: 'image/jpeg' }));
      }
    };

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        resolve({ base64: '', mimeType: 'image/jpeg' });
      };
      reader.readAsDataURL(fileOrBase64);
    }
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
