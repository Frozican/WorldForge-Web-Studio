import { detectRom, inspectHeader, hexDump, loRomToOffset } from "./rom.js";
import { createGrid, drawGrid, drawDecodedLevel, COLS, ROWS } from "./editor.js";
import { loadSmwLevel, formatLevelId } from "./smw-level.js";

const $ = id => document.getElementById(id);
const state = { rom: null, filename: "", grid: createGrid(), tool: "select", zoom: 1, history: [], painting: false, decodedLevel: null };
const canvas = $("level-canvas");
function status(message, ready = false) {
  $("rom-status").textContent = message;
  $("rom-status").classList.toggle("ready", ready);
}
function panel(name) {
  document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.panel === name));
  ["level", "rom", "project"].forEach(key => $("panel-" + key).classList.toggle("hidden", key !== name));
  const titles = { level: ["EDITOR", "Level workspace"], rom: ["INSPECTION", "ROM inspector"], project: ["PROJECT", "Project & export"] };
  $("panel-kicker").textContent = titles[name][0]; $("panel-title").textContent = titles[name][1];
}
function render() {
  $("zoom-label").textContent = Math.round(state.zoom * 100) + "%";
  if (state.decodedLevel) drawDecodedLevel(canvas, state.decodedLevel, state.zoom);
  else drawGrid(canvas, state.grid, state.zoom);
}
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  const units = ["KB", "MB", "GB"]; let index = -1;
  do { bytes /= 1024; index++; } while (bytes >= 1024 && index < units.length - 1);
  return bytes.toFixed(2) + " " + units[index];
}
function pickRom() { $("rom-file").click(); }
$("open-rom").onclick = $("open-rom-hero").onclick = pickRom;
async function loadRomFile(file) {
  if (!file) return;
  if (!/\.(smc|sfc|bin)$/i.test(file.name)) { status("Unsupported file"); alert("Choose a .smc, .sfc, or .bin ROM file."); return; }
  if (file.size < 0x8000) { status("Invalid ROM"); alert("This file is too small to be a valid SNES ROM."); return; }
  try {
    status("Reading ROM…");
    const originalBytes = new Uint8Array(await file.arrayBuffer());
    const info = detectRom(originalBytes);
    if (!info?.bytes?.length) throw new Error("The ROM data is empty.");
    state.rom = { ...info, bytes: info.bytes }; state.filename = file.name; state.history = []; state.decodedLevel = null;
    $("undo").disabled = true; $("welcome").classList.add("hidden"); $("workspace").classList.remove("hidden");
    $("sidebar-rom").textContent = file.name; $("sidebar-size").textContent = formatBytes(file.size) + " · " + info.mapping;
    $("rom-size").textContent = formatBytes(file.size); $("header-state").textContent = info.headerConfidence;
    $("mapping-state").textContent = info.mapping; $("internal-title").textContent = info.title;
    $("header-details").innerHTML = inspectHeader(info); $("hex-view").textContent = hexDump(info.bytes);
    $("canvas-hint").textContent = info.isLikelySMW ? "SMW title match — choose a level ID and decode its Layer 1 objects." : "ROM loaded for inspection. Level decoding targets the original SMW LoROM pointer layout; results may be invalid for other ROMs.";
    $("level-note").textContent = "Read-only decoded object positions; actual Map16 tile expansion and graphics rendering are not implemented yet.";
    $("rom-loaded-name").textContent = file.name;
    $("rom-loaded-meta").textContent = formatBytes(file.size) + " · " + info.mapping + " · " + info.headerConfidence + " header";
    $("rom-loaded-banner").classList.remove("hidden"); $("level-loader").classList.remove("hidden");
    $("level-select").innerHTML = Array.from({length: 0x200}, (_, id) => '<option value="' + id + '">' + formatLevelId(id) + '</option>').join("");
    $("level-load-status").textContent = "ROM loaded. Select an ID and decode its Layer 1 data.";
    status("ROM loaded", true); panel("level"); render();
  } catch (error) { status("ROM load failed"); alert("Could not read this ROM: " + error.message); }
}
$("rom-file").onchange = async event => { await loadRomFile(event.target.files?.[0]); event.target.value = ""; };
$("load-demo").onclick = () => {
  state.rom = null; state.filename = ""; state.grid = createGrid(); state.history = []; state.decodedLevel = null; $("undo").disabled = true;
  $("welcome").classList.add("hidden"); $("workspace").classList.remove("hidden"); $("sidebar-rom").textContent = "Demo project";
  $("sidebar-size").textContent = "No ROM data"; $("rom-loaded-banner").classList.add("hidden"); $("level-loader").classList.add("hidden");
  $("canvas-hint").textContent = "Demo grid — choose a tool and tap/click cells."; $("level-note").textContent = "Demo grid only; no ROM level is loaded.";
  status("Demo mode"); panel("level"); render();
};
$("load-level").onclick = () => {
  if (!state.rom) { $("level-load-status").textContent = "Load a ROM first."; return; }
  const id = Number($("level-select").value);
  try {
    const level = loadSmwLevel(state.rom.bytes, id);
    state.decodedLevel = level;
    $("canvas-hint").textContent = "Decoded level " + formatLevelId(id) + " — " + level.objects.length + " Layer 1 objects. This is a structural preview, not authentic game graphics.";
    $("level-note").textContent = "Level " + formatLevelId(id) + " · " + level.objects.length + " objects · " + level.decodedBytes + " decompressed bytes · read-only.";
    $("level-load-status").textContent = "Decoded " + level.objects.length + " Layer 1 objects; header: " + [...level.header].map(v => v.toString(16).toUpperCase().padStart(2,"0")).join(" ");
    status("Level decoded", true); render();
  } catch (error) {
    state.decodedLevel = null; render();
    $("level-load-status").textContent = "Could not decode level " + formatLevelId(id) + ": " + error.message;
    $("canvas-hint").textContent = "Level decode failed. Check the ROM revision and pointer table layout.";
    $("level-note").textContent = "No decoded level is active.";
  }
};
$("inspect-rom").onclick = () => panel("rom");
document.querySelectorAll(".nav-item").forEach(button => button.onclick = () => panel(button.dataset.panel));
document.querySelectorAll(".tool").forEach(button => button.onclick = () => {
  state.tool = button.dataset.tool; state.decodedLevel = null;
  document.querySelectorAll(".tool").forEach(tool => tool.classList.toggle("active", tool === button)); render();
});
function cellAt(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: Math.floor((event.clientX - rect.left) * canvas.width / rect.width / (16 * state.zoom)), y: Math.floor((event.clientY - rect.top) * canvas.height / rect.height / (16 * state.zoom)) };
}
function paint(event) {
  const {x,y} = cellAt(event); $("cursor-pos").textContent = "X: " + x + " / Y: " + y;
  if (state.decodedLevel || x < 0 || y < 0 || x >= COLS || y >= ROWS || state.tool === "select" || !state.painting) return;
  state.grid[y][x] = ({ground:1,block:2,coin:3,erase:0})[state.tool] ?? 0; render();
}
canvas.onpointerdown = event => {
  if (state.decodedLevel) return;
  state.painting = true; state.history.push(state.grid.map(row => row.slice())); $("undo").disabled = false;
  canvas.setPointerCapture(event.pointerId); paint(event);
};
canvas.onpointermove = paint; canvas.onpointerup = canvas.onpointercancel = () => { state.painting = false; };
$("undo").onclick = () => { const previous = state.history.pop(); if (previous) state.grid = previous; $("undo").disabled = !state.history.length; render(); };
$("zoom-in").onclick = () => { state.zoom = Math.min(2, state.zoom + .25); render(); };
$("zoom-out").onclick = () => { state.zoom = Math.max(.5, state.zoom - .25); render(); };
$("read-hex").onclick = () => {
  if (!state.rom) { $("hex-view").textContent = "Load a ROM first."; return; }
  const offset = parseInt($("hex-offset").value.trim().replace(/^0x|\$/i, "") || "0", 16);
  $("hex-view").textContent = Number.isSafeInteger(offset) && offset >= 0 && offset < state.rom.bytes.length ? hexDump(state.rom.bytes, offset) : "Invalid offset.";
};
function project() {
  return { format:"worldforge-project", schemaVersion:1, createdAt:new Date().toISOString(),
    baseRom:state.rom ? {filename:state.filename,size:state.rom.originalSize,title:state.rom.title,mapping:state.rom.mapping}:null,
    editor:{columns:COLS,rows:ROWS,grid:state.grid},
    decodedLevel:state.decodedLevel ? {levelId:state.decodedLevel.levelId,header:[...state.decodedLevel.header],objects:state.decodedLevel.objects}:null,
    notes:"Decoded level data is read-only. The preview displays object positions, not expanded Map16 geometry or original graphics." };
}
function download(name,data,type) { const url=URL.createObjectURL(new Blob([data],{type})); const a=document.createElement("a"); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
function saveProject() { download("worldforge-project.json",JSON.stringify(project(),null,2),"application/json"); }
$("save-project").onclick = $("export-project").onclick = saveProject;
for (const target of [canvas, $("panel-level")]) {
  target.addEventListener("dragover", event => { if (event.dataTransfer?.types.includes("Files")) event.preventDefault(); });
  target.addEventListener("drop", async event => { const file=Array.from(event.dataTransfer?.files||[]).find(item=>/\.(smc|sfc|bin)$/i.test(item.name)); if (!file) return; event.preventDefault(); await loadRomFile(file); });
}
render();
window.WorldForge = { detectRom, loRomToOffset, loadSmwLevel, formatLevelId, project };
