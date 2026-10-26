import{test}from"node:test";import assert from"node:assert/strict";import{stripSMCHeader,loRomToOffset,detectRom}from"../src/rom.js";
test("detects a 512-byte copier header",()=>{const r=stripSMCHeader(new Uint8Array(0x8000+512));assert.equal(r.headerBytes,512);assert.equal(r.bytes.length,0x8000)});
test("leaves normal ROM untouched",()=>{const r=stripSMCHeader(new Uint8Array(0x8000));assert.equal(r.headerBytes,0)});
test("maps LoROM addresses",()=>{assert.equal(loRomToOffset(0x008000),0);assert.equal(loRomToOffset(0x018000),0x8000);assert.equal(loRomToOffset(0x00ffff),0x7fff)});
test("rejects LoROM addresses below $8000",()=>assert.throws(()=>loRomToOffset(0x007fff),RangeError));
test("small files fail safely",()=>{const i=detectRom(new Uint8Array(100));assert.equal(i.headerConfidence,"Unverified");assert.equal(i.isLikelySMW,false)});
