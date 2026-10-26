# WorldForge — SMW Web Studio

An original browser-based foundation for a Lunar Magic-inspired Super Mario World editor. Static hosting on GitHub Pages; ROM bytes stay local in the browser.

## Current milestone
- Load .smc/.sfc/.bin files locally.
- Detect likely 512-byte copier header, inspect likely LoROM/HiROM internal headers, title, mapping byte and checksum/complement pair.
- Inspect raw bytes in a hex viewer.
- Experimental read-only Layer 1 decoder for the original SMW LoROM pointer tables, with LC-RLE1 decompression and a structural object-position preview.
- Original grid editor prototype with select, ground, block, coin, erase, zoom and undo.
- Export the editor grid as JSON.

## Limitations
This is not yet a full ROM level editor. The decoder targets the original SMW LoROM pointer-table layout and renders decoded Layer 1 object positions, not authentic game graphics or fully expanded Map16 geometry. Layer 2 BG tilemaps, sprite variants, and Lunar Magic custom layouts are not fully supported. ROM writing is intentionally disabled until SMW pointer tables, compressed level streams, free-space allocation, pointer updates and checksum handling are implemented and tested.

## GitHub Pages
The repository includes a Pages workflow. In Settings → Pages, select GitHub Actions as the deployment source. Pushes to main deploy the static site.

## Roadmap
1. Identify supported SMW revisions and map ROM addresses.
2. Expand object definitions into accurate geometry and decode all supported sprite records.
3. Decode Layer 2 BG tilemaps and support documented Lunar Magic pointer layouts.
4. Extract original graphics and palettes from the user's ROM and render authentic tiles.
5. Edit objects and sprites with undo/redo.
6. Encode streams, allocate safe free space, update pointers and validate ROM output.
7. Overworld, Map16, palettes and graphics.

## References
- [SMW ROM format documentation](https://smw-editor.github.io/docs/smw-rom/home/)
- [SMW-Editor source (MIT)](https://github.com/SMW-Editor/smw-editor)
- [Pipe Dream](https://pipedream.nexus/) — desktop editor reference; not a browser loader.

No third-party source is copied in this initial milestone. Bring your own legally obtained ROM; no game ROMs or copyrighted assets are included.
