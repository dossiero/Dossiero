export type ExifEntry = { label: string; value: string };

const exifCache = new Map<string, Promise<ExifEntry[]>>();

const TIFF_TAGS: Record<number, string> = {
  0x0100: 'Image width', 0x0101: 'Image height', 0x0102: 'Bits per sample',
  0x0103: 'Compression', 0x0106: 'Photometric interpretation', 0x010e: 'Image description',
  0x010f: 'Camera make', 0x0110: 'Camera model', 0x0112: 'Orientation',
  0x011a: 'X resolution', 0x011b: 'Y resolution', 0x0128: 'Resolution unit',
  0x0131: 'Software', 0x0132: 'Modified date', 0x013b: 'Artist', 0x8298: 'Copyright',
};

const EXIF_TAGS: Record<number, string> = {
  0x829a: 'Exposure time', 0x829d: 'F-number', 0x8822: 'Exposure program',
  0x8827: 'ISO speed', 0x8830: 'Sensitivity type', 0x9000: 'EXIF version',
  0x9003: 'Date taken', 0x9004: 'Digitized date', 0x9101: 'Component configuration',
  0x9102: 'Compressed bits per pixel', 0x9201: 'Shutter speed', 0x9202: 'Aperture',
  0x9203: 'Brightness', 0x9204: 'Exposure compensation', 0x9205: 'Maximum aperture',
  0x9206: 'Subject distance', 0x9207: 'Metering mode', 0x9208: 'Light source',
  0x9209: 'Flash', 0x920a: 'Focal length', 0x927c: 'Maker note', 0x9286: 'User comment',
  0x9290: 'Subsecond time', 0x9291: 'Subsecond time taken', 0x9292: 'Subsecond time digitized',
  0xa000: 'Flashpix version', 0xa001: 'Color space', 0xa002: 'Pixel width',
  0xa003: 'Pixel height', 0xa004: 'Related sound file', 0xa20b: 'Flash energy',
  0xa20e: 'Focal plane X resolution', 0xa20f: 'Focal plane Y resolution',
  0xa210: 'Focal plane resolution unit', 0xa217: 'Sensing method', 0xa300: 'File source',
  0xa301: 'Scene type', 0xa401: 'Custom rendering', 0xa402: 'Exposure mode',
  0xa403: 'White balance', 0xa404: 'Digital zoom ratio', 0xa405: '35mm equivalent focal length',
  0xa406: 'Scene capture type', 0xa407: 'Gain control', 0xa408: 'Contrast',
  0xa409: 'Saturation', 0xa40a: 'Sharpness', 0xa40c: 'Subject distance range',
  0xa420: 'Image unique ID', 0xa430: 'Camera owner', 0xa431: 'Camera serial number',
  0xa432: 'Lens specification', 0xa433: 'Lens make', 0xa434: 'Lens model',
  0xa435: 'Lens serial number', 0xa460: 'Composite image',
};

const GPS_TAGS: Record<number, string> = {
  0x0000: 'GPS version', 0x0001: 'Latitude reference', 0x0002: 'Latitude',
  0x0003: 'Longitude reference', 0x0004: 'Longitude', 0x0005: 'Altitude reference',
  0x0006: 'Altitude', 0x0007: 'GPS time', 0x0008: 'Satellites', 0x0009: 'GPS status',
  0x000a: 'Measurement mode', 0x000b: 'DOP', 0x000c: 'Speed reference',
  0x000d: 'Speed', 0x000e: 'Track reference', 0x000f: 'Track', 0x0010: 'Image direction reference',
  0x0011: 'Image direction', 0x0012: 'Map datum', 0x001d: 'GPS date', 0x001f: 'Horizontal positioning error',
};

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };
const POINTER_EXIF = 0x8769;
const POINTER_GPS = 0x8825;

export async function readExif(cacheKey: string, load: () => Promise<Uint8Array>): Promise<ExifEntry[]> {
  const cached = exifCache.get(cacheKey);
  if (cached) return cached;
  const pending = load().then((bytes) => parseExif(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer))
    .catch((error) => { exifCache.delete(cacheKey); throw error; });
  exifCache.set(cacheKey, pending);
  return pending;
}

export function parseExif(buffer: ArrayBuffer): ExifEntry[] {
  const bytes = new Uint8Array(buffer);
  const tiffOffset = locateTiff(bytes);
  if (tiffOffset < 0) return [];
  const view = new DataView(buffer);
  const byteOrder = String.fromCharCode(bytes[tiffOffset], bytes[tiffOffset + 1]);
  const little = byteOrder === 'II';
  if (!little && byteOrder !== 'MM') return [];
  if (readU16(view, tiffOffset + 2, little) !== 42) return [];
  const firstIfd = readU32(view, tiffOffset + 4, little);
  const entries: ExifEntry[] = [];
  const gpsValues = new Map<number, unknown>();
  const visited = new Set<number>();

  const readIfd = (relativeOffset: number, names: Record<number, string>, prefix = '') => {
    const start = tiffOffset + relativeOffset;
    if (relativeOffset <= 0 || start + 2 > view.byteLength || visited.has(start)) return;
    visited.add(start);
    const count = Math.min(readU16(view, start, little), 2048);
    for (let index = 0; index < count; index += 1) {
      const entry = start + 2 + index * 12;
      if (entry + 12 > view.byteLength) break;
      const tag = readU16(view, entry, little);
      const type = readU16(view, entry + 2, little);
      const amount = readU32(view, entry + 4, little);
      const size = TYPE_SIZE[type];
      if (!size || amount > 100_000) continue;
      const byteLength = size * amount;
      const valueAt = byteLength <= 4 ? entry + 8 : tiffOffset + readU32(view, entry + 8, little);
      if (valueAt < 0 || valueAt + byteLength > view.byteLength) continue;
      if (tag === POINTER_EXIF || tag === POINTER_GPS) {
        const pointer = readU32(view, valueAt, little);
        readIfd(pointer, tag === POINTER_GPS ? GPS_TAGS : EXIF_TAGS, tag === POINTER_GPS ? 'GPS ' : '');
        continue;
      }
      const value = readValue(view, bytes, valueAt, type, amount, little);
      if (prefix === 'GPS ') gpsValues.set(tag, value);
      const label = names[tag] ?? `${prefix}Tag 0x${tag.toString(16).toUpperCase().padStart(4, '0')}`;
      entries.push({ label, value: formatValue(value, tag) });
    }
  };

  readIfd(firstIfd, TIFF_TAGS);
  const latitude = coordinate(gpsValues.get(2), gpsValues.get(1));
  const longitude = coordinate(gpsValues.get(4), gpsValues.get(3));
  if (latitude !== null && longitude !== null) entries.unshift({ label: 'GPS coordinates', value: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
  return entries.filter((entry) => entry.value.length > 0);
}

function locateTiff(bytes: Uint8Array) {
  if (bytes.length < 8) return -1;
  if ((bytes[0] === 0x49 && bytes[1] === 0x49) || (bytes[0] === 0x4d && bytes[1] === 0x4d)) return 0;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 10 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      if (marker === 0xda || marker === 0xd9) break;
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (marker === 0xe1 && ascii(bytes, offset + 4, 6) === 'Exif\0\0') return offset + 10;
      if (length < 2) break;
      offset += length + 2;
    }
  }
  if (ascii(bytes, 0, 8) === '\u0089PNG\r\n\u001a\n') {
    let offset = 8;
    while (offset + 12 <= bytes.length) {
      const length = ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
      if (ascii(bytes, offset + 4, 4) === 'eXIf') return offset + 8;
      offset += 12 + length;
    }
  }
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const length = bytes[offset + 4] | (bytes[offset + 5] << 8) | (bytes[offset + 6] << 16) | (bytes[offset + 7] << 24);
      if (ascii(bytes, offset, 4) === 'EXIF') {
        const data = offset + 8;
        return ascii(bytes, data, 6) === 'Exif\0\0' ? data + 6 : data;
      }
      offset += 8 + length + (length % 2);
    }
  }
  return -1;
}

function readValue(view: DataView, bytes: Uint8Array, offset: number, type: number, count: number, little: boolean): unknown {
  if (type === 2) return ascii(bytes, offset, Math.min(count, 8192)).replace(/\0+$/, '').trim();
  if (type === 7) {
    const raw = bytes.slice(offset, offset + Math.min(count, 1024));
    const text = new TextDecoder('utf-8', { fatal: false }).decode(raw).replace(/^ASCII\0{3}|^UNICODE\0/, '').replace(/\0/g, '').trim();
    return text || `[${count} bytes]`;
  }
  const values: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const at = offset + index * (TYPE_SIZE[type] ?? 1);
    if (type === 1) values.push(view.getUint8(at));
    else if (type === 3) values.push(view.getUint16(at, little));
    else if (type === 4) values.push(view.getUint32(at, little));
    else if (type === 5) { const denominator = view.getUint32(at + 4, little); values.push(denominator ? view.getUint32(at, little) / denominator : 0); }
    else if (type === 6) values.push(view.getInt8(at));
    else if (type === 8) values.push(view.getInt16(at, little));
    else if (type === 9) values.push(view.getInt32(at, little));
    else if (type === 10) { const denominator = view.getInt32(at + 4, little); values.push(denominator ? view.getInt32(at, little) / denominator : 0); }
    else if (type === 11) values.push(view.getFloat32(at, little));
    else if (type === 12) values.push(view.getFloat64(at, little));
  }
  return values.length === 1 ? values[0] : values;
}

function formatValue(value: unknown, tag: number) {
  if (typeof value === 'string') return value;
  const values = Array.isArray(value) ? value : [value];
  const formatted = values.map((part) => typeof part === 'number' ? Number(part.toFixed(6)).toString() : String(part));
  if (tag === 0x829a && typeof values[0] === 'number' && values[0] > 0 && values[0] < 1) return `1/${Math.round(1 / values[0])} s`;
  if (tag === 0x829d && typeof values[0] === 'number') return `f/${Number(values[0].toFixed(1))}`;
  if (tag === 0x920a && typeof values[0] === 'number') return `${Number(values[0].toFixed(2))} mm`;
  if (tag === 0x8827 && typeof values[0] === 'number') return `ISO ${values[0]}`;
  return formatted.join(', ');
}

function coordinate(value: unknown, reference: unknown) {
  if (!Array.isArray(value) || value.length < 3) return null;
  const decimal = Number(value[0]) + Number(value[1]) / 60 + Number(value[2]) / 3600;
  return reference === 'S' || reference === 'W' ? -decimal : decimal;
}

function readU16(view: DataView, offset: number, little: boolean) { return view.getUint16(offset, little); }
function readU32(view: DataView, offset: number, little: boolean) { return view.getUint32(offset, little); }
function ascii(bytes: Uint8Array, offset: number, length: number) { return String.fromCharCode(...bytes.slice(offset, offset + length)); }
