import { test } from "node:test";
import assert from "node:assert/strict";
import { decompressLCRLE1, parseLayer1Objects, loadSmwLevel } from "../src/smw-level.js";

test("LC-RLE1 decodes literal and repeated runs", () => {
  const result = decompressLCRLE1(Uint8Array.from([3,16,32,48,0x82,0xAA,0xFF,0xFF]), 0);
  assert.deepEqual([...result.data], [16,32,48,0xAA,0xAA]);
  assert.equal(result.bytesConsumed, 8);
});
test("LC-RLE1 rejects truncated runs and missing terminators", () => {
  assert.throws(() => decompressLCRLE1(Uint8Array.from([4,1,2]), 0), /outside the ROM/);
  assert.throws(() => decompressLCRLE1(Uint8Array.from([1,0xAA]), 0), /did not terminate/);
});
test("parses Layer 1 header, object positions and end marker", () => {
  const parsed = parseLayer1Objects(Uint8Array.from([0x10,0x20,0x30,0x40,0x50,0x01,0x23,0x99,0x81,0x45,0x22,0xFF]));
  assert.deepEqual([...parsed.header], [0x10,0x20,0x30,0x40,0x50]);
  assert.equal(parsed.objects.length, 2);
  assert.equal(parsed.objects[0].x, 3);
  assert.equal(parsed.objects[0].y, 1);
  assert.equal(parsed.objects[0].objectNumber, 2);
  assert.equal(parsed.objects[1].screen, 1);
  assert.equal(parsed.objects[1].x, 21);
});
test("loads a synthetic level through the vanilla Layer 1 pointer table", () => {
  const rom = new Uint8Array(0x80000);
  rom.set([0x00,0x80,0x05], 0x2E000); // Level 000 -> $05:8000 -> PC $028000
  rom.set([9,0x10,0x20,0x30,0x40,0x50,0x01,0x23,0x99,0xFF,0xFF,0xFF], 0x28000);
  const level = loadSmwLevel(rom, 0);
  assert.equal(level.objects.length, 1);
  assert.equal(level.objects[0].x, 3);
  assert.equal(level.objects[0].y, 1);
  assert.equal(level.objects[0].objectNumber, 2);
  assert.deepEqual([...level.header], [0x10,0x20,0x30,0x40,0x50]);
});
test("level IDs are bounds checked", () => {
  assert.throws(() => loadSmwLevel(new Uint8Array(0x40000), 0x200), /Level ID/);
});
