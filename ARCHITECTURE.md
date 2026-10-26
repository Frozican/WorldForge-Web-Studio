# Architecture

- `src/rom.js`: local ROM header inspection, copier-header detection, hex dump and LoROM address conversion.
- `src/smw-level.js`: bounds-checked vanilla SMW pointer-table lookup, LC-RLE1 decompression and Layer 1 object-position parsing. Read-only; expanded object geometry and graphics are not implemented.
- `src/editor.js`: original prototype grid rendering; placeholder artwork only.
- `src/main.js`: UI lifecycle, local file loading, navigation, grid editing and JSON export.
- `index.html` / `styles.css`: responsive app shell.

## Target model
Keep original ROM bytes immutable. Parse into a `RomImage`, supported `SmwRomLayout`, `LevelRecord`, semantic `LevelObject` values and a `RomPatch` containing changed ranges. Preserve unknown data byte-for-byte.

## Safe editing pipeline
1. Validate ROM revision and mapping.
2. Decode level streams with bounds checks.
3. Preserve unknown records and original encoding metadata.
4. Apply edits to a model.
5. Encode into a new buffer and allocate free space without overwriting unrelated data.
6. Update pointers only after validation.
7. Re-open and validate exported ROMs with automated tests.

Never advertise ROM export until round-trip tests pass on supported revisions. ROM data remains local; no upload endpoints exist.
