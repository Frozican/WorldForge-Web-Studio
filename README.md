# WorldForge — SMW Web Studio

An original browser-based foundation for a Lunar Magic-inspired Super Mario World editor. Static hosting on GitHub Pages; ROM bytes stay local in the browser.

## Current milestone
- Load .smc/.sfc/.bin files locally.
- Detect likely 512-byte copier header, inspect likely LoROM/HiROM internal headers, title, mapping byte and checksum/complement pair.
- Inspect raw bytes in a hex viewer.
- Original grid editor prototype with select, ground, block, coin, erase, zoom and undo.
- Export the editor grid as JSON.

## Limitations
This is not yet a functional ROM level editor. The canvas is a prototype and does not render actual levels from the ROM. ROM writing is intentionally disabled until SMW pointer tables, compressed level streams, free-space allocation, pointer updates and checksum handling are implemented and tested.

## GitHub Pages
The repository includes a Pages workflow. In Settings → Pages, select GitHub Actions as the deployment source. Pushes to main deploy the static site.

## Roadmap
1. Identify supported SMW revisions and map ROM addresses.
2. Parse vanilla SMW level pointer tables.
3. Decode compressed level streams into semantic objects and sprites.
4. Extract original graphics and palettes from the user's ROM and render authentic tiles.
5. Edit objects and sprites with undo/redo.
6. Encode streams, allocate safe free space, update pointers and validate ROM output.
7. Overworld, Map16, palettes and graphics.

## References
- [SMW ROM format documentation](https://smw-editor.github.io/docs/smw-rom/home/)
- [SMW-Editor source (MIT)](https://github.com/SMW-Editor/smw-editor)
- [Pipe Dream](https://pipedream.nexus/) — desktop editor reference; not a browser loader.

No third-party source is copied in this initial milestone. Bring your own legally obtained ROM; no game ROMs or copyrighted assets are included.
