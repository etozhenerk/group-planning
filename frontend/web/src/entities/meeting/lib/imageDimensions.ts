const invalid = () => new Error('Не удалось открыть фото. Выберите другое.');

export const imageDimensions = (buffer: ArrayBuffer, type: string) => {
  const view = new DataView(buffer);

  if (
    type === 'image/png' &&
    view.byteLength >= 33 &&
    view.getUint32(0) === 0x89504e47 &&
    view.getUint32(4) === 0x0d0a1a0a
  ) {
    for (let offset = 8; offset + 12 <= view.byteLength;) {
      if (view.getUint32(offset + 4) === 0x6163544c) {
        throw invalid();
      }

      offset += view.getUint32(offset) + 12;
    }

    return { width: view.getUint32(16), height: view.getUint32(20) };
  }

  if (type === 'image/jpeg' && view.byteLength >= 4 && view.getUint16(0) === 0xffd8) {
    let offset = 2;

    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset++) !== 0xff) {
        throw invalid();
      }

      while (offset < view.byteLength && view.getUint8(offset) === 0xff) {
        offset++;
      }

      if (offset + 3 > view.byteLength) {
        break;
      }

      const marker = view.getUint8(offset++);
      const length = view.getUint16(offset);

      if (length < 2 || offset + length > view.byteLength || marker === 0xda) {
        break;
      }

      if ([0xc0, 0xc1, 0xc2].includes(marker) && length >= 8) {
        return { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) };
      }

      offset += length;
    }
  }

  throw invalid();
};

export const checkImageBounds = (width: number, height: number) => {
  if (
    !width ||
    !height ||
    width * height > 64_000_000 ||
    width > 32768 ||
    height > 32768
  ) {
    throw new Error('Фото слишком большое. Выберите другое.');
  }
};
