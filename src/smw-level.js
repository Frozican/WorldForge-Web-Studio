// Read-only vanilla SMW LoROM level reader. Original ROM bytes are never mutated.
const LAYER1_POINTER_TABLE = 0x2E000; // $05:E000, headerless ROM file offset
const LAYER2_POINTER_TABLE = 0x2E600; // $05:E600
const SPRITE_POINTER_TABLE = 0x2EC00; // $05:EC00; vanilla sprite data uses bank $07
const MAX_DECOMPRESSED_BYTES = 0x10000;

function assertRange(bytes, offset, length, label = "ROM read") {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) ||
      offset < 0 || length < 0 || offset + length > bytes.length) {
    throw new RangeError(label + " is outside the ROM (offset $" +
      Number(offset).toString(16).toUpperCase() + ", length " + length + ").");
  }
}
function snesLoRomToOffset(address) {
  const bank = (address >>> 16) & 0xFF, within = address & 0xFFFF;
  if (within < 0x8000) throw new RangeError("Invalid LoROM data address $" + address.toString(16));
  return ((bank & 0x7F) * 0x8000) + (within & 0x7FFF);
}
function readPointer(bytes, levelId, tableOffset, width, sprite = false) {
  if (!Number.isInteger(levelId) || levelId < 0 || levelId > 0x1FF) throw new RangeError("Level ID must be between 000 and 1FF.");
  const entry = tableOffset + levelId * width;
  assertRange(bytes, entry, width, "Level pointer table");
  const address = sprite
    ? (0x070000 | (bytes[entry] | (bytes[entry + 1] << 8)))
    : (bytes[entry] | (bytes[entry + 1] << 8) | (bytes[entry + 2] << 16));
  // Vanilla Layer 2 uses bank FF as a sentinel for a BG tilemap stored in bank 0C.
  if (!sprite && ((address >>> 16) & 0xFF) === 0xFF) return { address, offset: null };
  const offset = snesLoRomToOffset(address);
  assertRange(bytes, offset, 1, "Level data pointer");
  return { address, offset };
}

/** Decode LC-RLE1, which terminates with FF FF. */
export function decompressLCRLE1(bytes, start, maxOutput = MAX_DECOMPRESSED_BYTES) {
  assertRange(bytes, start, 1, "Compressed stream");
  const output = [];
  let cursor = start, terminated = false;
  while (cursor < bytes.length && output.length < maxOutput) {
    const command = bytes[cursor++];
    if (command === 0xFF) {
      assertRange(bytes, cursor, 1, "RLE terminator");
      if (bytes[cursor] !== 0xFF) throw new Error("Malformed LC-RLE1 terminator at $" + (cursor - 1).toString(16));
      cursor++; terminated = true; break;
    }
    const length = command & 0x7F;
    if (length === 0) throw new Error("Invalid zero-length LC-RLE1 command at $" + (cursor - 1).toString(16));
    if (output.length + length > maxOutput) throw new RangeError("Decompressed level exceeds safety limit.");
    if (command & 0x80) {
      assertRange(bytes, cursor, 1, "RLE repeated byte");
      const value = bytes[cursor++];
      for (let i = 0; i < length; i++) output.push(value);
    } else {
      assertRange(bytes, cursor, length, "RLE literal run");
      for (let i = 0; i < length; i++) output.push(bytes[cursor++]);
    }
  }
  if (!terminated) throw new Error("LC-RLE1 stream did not terminate within ROM bounds.");
  return { data: Uint8Array.from(output), bytesConsumed: cursor - start };
}

export function parseLayer1Objects(decoded) {
  const bytes = decoded instanceof Uint8Array ? decoded : Uint8Array.from(decoded);
  if (bytes.length < 6) throw new Error("Layer 1 data is too short to contain a header and object terminator.");
  const header = bytes.slice(0, 5), objects = [];
  let cursor = 5, screen = 0, terminated = false;
  while (cursor < bytes.length) {
    const first = bytes[cursor];
    if (first === 0xFF) { terminated = true; break; }
    if (cursor + 2 >= bytes.length) throw new Error("Truncated Layer 1 object at decoded offset $" + cursor.toString(16));
    const second = bytes[cursor + 1], settings = bytes[cursor + 2], newScreen = (first & 0x80) !== 0;
    if (newScreen) screen++;
    const objectNumber = ((first & 0x60) >>> 1) | ((second & 0xF0) >>> 4);
    objects.push({
      index: objects.length, offset: cursor, raw: [first, second, settings], newScreen, screen,
      x: screen * 16 + (second & 0x0F), y: first & 0x0F, objectNumber, settings,
      kind: objectNumber < 0x10 ? "extended" : "standard"
    });
    cursor += 3;
    if (objects.length > 8192) throw new Error("Object count exceeded safety limit.");
  }
  if (!terminated) throw new Error("Layer 1 object list has no FF terminator.");
  return { header, objects, terminatorOffset: cursor, trailingBytes: bytes.length - cursor - 1 };
}

export function loadSmwLevel(romBytes, levelId) {
  const bytes = romBytes instanceof Uint8Array ? romBytes : new Uint8Array(romBytes);
  const layer1Pointer = readPointer(bytes, levelId, LAYER1_POINTER_TABLE, 3);
  const layer1Stream = decompressLCRLE1(bytes, layer1Pointer.offset);
  const parsed = parseLayer1Objects(layer1Stream.data);
  let layer2 = null, layer2Error = null, sprite = null, spriteError = null;
  try {
    const pointer = readPointer(bytes, levelId, LAYER2_POINTER_TABLE, 3);
    if (((pointer.address >>> 16) & 0xFF) !== 0xFF) {
      const stream = decompressLCRLE1(bytes, pointer.offset);
      layer2 = { pointer, decodedBytes: stream.data.length };
    } else layer2 = { pointer, tilemap: true, decodedBytes: null };
  } catch (error) { layer2Error = error.message; }
  try {
    const pointer = readPointer(bytes, levelId, SPRITE_POINTER_TABLE, 2, true);
    const stream = decompressLCRLE1(bytes, pointer.offset);
    sprite = { pointer, decodedBytes: stream.data.length, data: stream.data };
  } catch (error) { spriteError = error.message; }
  return {
    levelId, layer1Pointer, compressedBytes: layer1Stream.bytesConsumed, decodedBytes: layer1Stream.data.length,
    header: parsed.header, objects: parsed.objects, rawLayer1: layer1Stream.data, layer2, layer2Error, sprite, spriteError,
    warnings: [
      "Layer 1 objects are decoded and positioned, but object-specific geometry is not expanded into Map16 tiles.",
      "Layer 2 BG tilemaps, sprite record variants and custom Lunar Magic pointer layouts are not fully supported."
    ]
  };
}
export function formatLevelId(id) { return Number(id).toString(16).toUpperCase().padStart(3, "0"); }
