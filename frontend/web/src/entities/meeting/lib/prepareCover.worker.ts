import {
  imageDimensions,
  checkImageBounds,
} from '@/entities/meeting/lib/imageDimensions';

self.onmessage = async (event: MessageEvent<File>) => {
  try {
    const file = event.data;

    if (file.size > 20 * 1024 * 1024) {
      throw new Error('Фото слишком большое. Выберите другое.');
    }

    const bytes = await file.arrayBuffer();
    const dimensions = imageDimensions(bytes, file.type);
    checkImageBounds(dimensions.width, dimensions.height);
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

    try {
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = new OffscreenCanvas(
        Math.max(1, Math.round(bitmap.width * scale)),
        Math.max(1, Math.round(bitmap.height * scale)),
      );

      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error();
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 });

      if (blob.size > 2 * 1024 * 1024) {
        throw new Error('Фото слишком большое. Выберите другое.');
      }

      const result = new Uint8Array(await blob.arrayBuffer());
      let binary = '';

      for (let offset = 0; offset < result.length; offset += 8192) {
        binary += String.fromCharCode(...result.subarray(offset, offset + 8192));
      }

      self.postMessage({ cover: { media_type: 'image/jpeg', data: btoa(binary) } });
    } finally {
      bitmap.close();
    }
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error &&
        error.message === 'Фото слишком большое. Выберите другое.'
          ? error.message
          : 'Не удалось открыть фото. Выберите другое.',
    });
  }
};
