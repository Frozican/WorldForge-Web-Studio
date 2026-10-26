export const COLS=60,ROWS=30;
export function createGrid(){return Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},()=>y>23?1:0))}
export function drawGrid(canvas,grid,zoom=1){const c=canvas.getContext("2d"),cell=16*zoom;canvas.width=COLS*cell;canvas.height=ROWS*cell;const sky=c.createLinearGradient(0,0,0,canvas.height);sky.addColorStop(0,"#77c7f1");sky.addColorStop(1,"#d5f4ff");c.fillStyle=sky;c.fillRect(0,0,canvas.width,canvas.height);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const t=grid[y][x],px=x*cell,py=y*cell;if(t===1){c.fillStyle="#9c5b36";c.fillRect(px,py,cell,cell);c.fillStyle="#60b95c";c.fillRect(px,py,cell,Math.max(3,cell*.25));c.fillStyle="#c88350";c.fillRect(px+1,py+cell*.32,cell-2,1)}else if(t===2){c.fillStyle="#e5a343";c.fillRect(px+1,py+1,cell-2,cell-2);c.strokeStyle="#7d4d20";c.strokeRect(px+1.5,py+1.5,cell-3,cell-3);c.fillStyle="#fff0a8";c.font="bold "+Math.max(8,cell*.7)+"px sans-serif";c.textAlign="center";c.fillText("?",px+cell/2,py+cell*.75)}else if(t===3){c.fillStyle="#ffe45e";c.beginPath();c.arc(px+cell/2,py+cell/2,cell*.28,0,Math.PI*2);c.fill();c.strokeStyle="#d69e25";c.stroke()}c.strokeStyle="rgba(20,55,85,.10)";c.strokeRect(px+.5,py+.5,cell,cell)}c.fillStyle="rgba(255,255,255,.75)";for(let i=0;i<5;i++){const x=(i*173+47)%canvas.width,y=36+(i%3)*39;c.beginPath();c.ellipse(x,y,22*zoom,9*zoom,0,0,Math.PI*2);c.ellipse(x+12*zoom,y-6*zoom,15*zoom,10*zoom,0,0,Math.PI*2);c.fill()}}

export function drawDecodedLevel(canvas, level, zoom = 1) {
  const cell = 16 * zoom;
  const maxX = Math.max(60, Math.min(128, Math.ceil((Math.max(0, ...level.objects.map(o => o.x)) + 1) / 16) * 16));
  const cols = maxX;
  const rows = 16;
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const c = canvas.getContext("2d");
  const sky = c.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#78c8f1");
  sky.addColorStop(1, "#d9f4ff");
  c.fillStyle = sky;
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.strokeStyle = "rgba(20,55,85,.15)";
  for (let x = 0; x <= cols; x++) { c.beginPath(); c.moveTo(x * cell, 0); c.lineTo(x * cell, canvas.height); c.stroke(); }
  for (let y = 0; y <= rows; y++) { c.beginPath(); c.moveTo(0, y * cell); c.lineTo(canvas.width, y * cell); c.stroke(); }
  level.objects.forEach(o => {
    const x = o.x * cell, y = o.y * cell;
    c.fillStyle = o.kind === "extended" ? "#a66cf0" : "#df9b37";
    c.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    c.strokeStyle = "#263548";
    c.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
    c.fillStyle = "#101722";
    c.font = "bold " + Math.max(7, Math.min(10, cell * .55)) + "px monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(o.objectNumber.toString(16).toUpperCase().padStart(2, "0"), x + cell / 2, y + cell / 2);
  });
  c.fillStyle = "#102033";
  c.font = "12px monospace";
  c.textAlign = "left";
  c.fillText("Level " + level.levelId.toString(16).toUpperCase().padStart(3, "0") + " · " + level.objects.length + " decoded objects", 8, 14);
}
