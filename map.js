
"use strict";
let mapZoom=1, mapPan={x:0,y:0};

function nationColor(id){return NATIONS[id]?.color||"#777"}
function drawMap(){
  const svg=document.getElementById("worldMap"); if(!svg)return;
  svg.innerHTML="";
  const terrain=document.createElementNS("http://www.w3.org/2000/svg","g");
  terrain.classList.add("terrain");
  terrain.innerHTML=`<path d="M0 500 Q140 390 280 500 T560 480 T840 510 T1200 450 V720 H0Z" fill="#7a8c70"/>
    <path d="M0 120 Q180 60 360 130 T720 100 T1200 140" fill="none" stroke="#c4d1b7" stroke-width="40" opacity=".18"/>
    <path d="M700 600 L760 430 L820 600 L900 420 L980 610" fill="none" stroke="#d6d3b4" stroke-width="32" opacity=".15"/>`;
  svg.appendChild(terrain);
  const borderLayer=document.createElementNS("http://www.w3.org/2000/svg","g");
  G.provinces.forEach(p=>{
    const g=document.createElementNS("http://www.w3.org/2000/svg","g");
    g.classList.add("province");g.dataset.id=p.id;
    const r=document.createElementNS("http://www.w3.org/2000/svg","rect");
    r.setAttribute("x",p.x);r.setAttribute("y",p.y);r.setAttribute("width",p.w);r.setAttribute("height",p.h);
    r.setAttribute("rx","14");r.setAttribute("fill",nationColor(p.owner));r.setAttribute("stroke","#171b1e");r.setAttribute("stroke-width","3");
    const t=document.createElementNS("http://www.w3.org/2000/svg","text");
    t.setAttribute("x",p.x+p.w/2);t.setAttribute("y",p.y+p.h/2);t.setAttribute("text-anchor","middle");t.setAttribute("fill","#eee7d5");t.setAttribute("font-size","14");t.setAttribute("font-family","Georgia");t.textContent=p.name;
    g.append(r,t);
    g.addEventListener("click",()=>selectProvince(p.id));
    g.addEventListener("mousemove",e=>showMapTip(e,p));
    g.addEventListener("mouseleave",hideMapTip);
    borderLayer.appendChild(g);
  });
  svg.appendChild(borderLayer);

  G.armies.forEach(a=>{
    const p=provinceByName(a.province);if(!p)return;
    const g=document.createElementNS("http://www.w3.org/2000/svg","g");
    const x=p.x+p.w/2,y=p.y+p.h/2+22;
    const c=document.createElementNS("http://www.w3.org/2000/svg","circle");c.setAttribute("cx",x);c.setAttribute("cy",y);c.setAttribute("r","16");c.setAttribute("fill",a.owner===G.player?"#111":"#7b2e2a");c.setAttribute("stroke",a.owner===G.player?"#e0c77f":"#e88b84");c.setAttribute("stroke-width","2");
    const tx=document.createElementNS("http://www.w3.org/2000/svg","text");tx.setAttribute("x",x);tx.setAttribute("y",y+5);tx.setAttribute("text-anchor","middle");tx.setAttribute("fill","#fff");tx.setAttribute("font-size","12");tx.textContent="✦";
    g.append(c,tx);g.style.cursor="pointer";g.addEventListener("click",e=>{e.stopPropagation();selectArmy(a.id)});svg.appendChild(g);

  (G.airWings||[]).forEach(w=>{
    const p=provinceByName(w.base);if(!p)return;
    const g=document.createElementNS("http://www.w3.org/2000/svg","g");
    const x=p.x+p.w/2+24,y=p.y+p.h/2-22;
    const c=document.createElementNS("http://www.w3.org/2000/svg","rect");c.setAttribute("x",x-10);c.setAttribute("y",y-10);c.setAttribute("width","20");c.setAttribute("height","20");c.setAttribute("rx","4");c.setAttribute("fill","#1c2330");c.setAttribute("stroke","#d2c084");
    const tx=document.createElementNS("http://www.w3.org/2000/svg","text");tx.setAttribute("x",x);tx.setAttribute("y",y+5);tx.setAttribute("text-anchor","middle");tx.setAttribute("fill","#fff");tx.setAttribute("font-size","11");tx.textContent="✈";
    g.append(c,tx);g.style.cursor="pointer";g.addEventListener("click",e=>{e.stopPropagation();selectAirWing(w.id)});svg.appendChild(g);
  });
  (G.fleets||[]).forEach(f=>{
    const z=G.seaZones.find(x=>x.id===f.zone);if(!z)return;
    const points={"SZ1":[200,650],"SZ2":[650,60],"SZ3":[1040,120],"SZ4":[520,680]}[f.zone]||[600,600];
    const [x,y]=points;
    const g=document.createElementNS("http://www.w3.org/2000/svg","g");
    const c=document.createElementNS("http://www.w3.org/2000/svg","circle");c.setAttribute("cx",x);c.setAttribute("cy",y);c.setAttribute("r","13");c.setAttribute("fill","#101820");c.setAttribute("stroke","#82a7d0");c.setAttribute("stroke-width","2");
    const tx=document.createElementNS("http://www.w3.org/2000/svg","text");tx.setAttribute("x",x);tx.setAttribute("y",y+4);tx.setAttribute("text-anchor","middle");tx.setAttribute("fill","#fff");tx.setAttribute("font-size","10");tx.textContent="⚓";
    g.append(c,tx);g.style.cursor="pointer";g.addEventListener("click",e=>{e.stopPropagation();selectFleet(f.id)});svg.appendChild(g);
  });
  });
  drawFrontLines();
  applyMapView();
}
function applyMapView(){
  const svg=document.getElementById("worldMap");
  svg.style.transform=`translate(${mapPan.x}px,${mapPan.y}px) scale(${mapZoom})`;
  document.querySelectorAll("#worldMap .terrain").forEach(x=>x.style.display=document.getElementById("showTerrain")?.checked?"":"none");
  document.querySelectorAll("#worldMap .province text").forEach(x=>x.style.display=document.getElementById("showNames")?.checked?"":"none");
  document.querySelectorAll("#worldMap .supply-layer").forEach(x=>x.remove());
  if(document.getElementById("showSupply")?.checked) drawSupplyOverlay();
}
function showMapTip(e,p){
  const t=document.getElementById("mapTooltip");t.style.display="block";t.style.left=(e.offsetX+12)+"px";t.style.top=(e.offsetY+12)+"px";
  t.innerHTML=`<b>${p.name}</b>${nationName(p.owner)}<br>Population: ${p.population.toLocaleString()}<br>Infrastructure: ${p.infrastructure}%<br>Terrain: ${p.terrain}`;
}
function hideMapTip(){document.getElementById("mapTooltip").style.display="none"}
function selectProvince(id){G.selected={type:"province",id};renderSelection();drawMap()}
function selectArmy(id){G.selected={type:"army",id};renderSelection();drawMap()}
function resetMap(){mapZoom=1;mapPan={x:0,y:0};applyMapView()}
function initMap(){
  document.getElementById("resetMap").onclick=resetMap;
  document.getElementById("showTerrain").onchange=applyMapView;
  document.getElementById("showNames").onchange=applyMapView;
  document.getElementById("showSupply")?.addEventListener("change",drawMap);
  let dragging=false,last=null;
  const svg=document.getElementById("worldMap");
  svg.addEventListener("wheel",e=>{e.preventDefault();mapZoom=clamp(mapZoom*(e.deltaY<0?1.08:.92),.75,2.2);applyMapView()},{passive:false});
  svg.addEventListener("mousedown",e=>{dragging=true;last={x:e.clientX,y:e.clientY}});
  window.addEventListener("mouseup",()=>dragging=false);
  window.addEventListener("mousemove",e=>{if(!dragging)return;mapPan.x+=e.clientX-last.x;mapPan.y+=e.clientY-last.y;last={x:e.clientX,y:e.clientY};applyMapView()});
}

function drawFrontLines(){
  const svg=document.getElementById("worldMap"); if(!svg)return;
  const g=document.createElementNS("http://www.w3.org/2000/svg","g");
  g.classList.add("front-layer");
  const hostileOwned=G.provinces.filter(p=>p.owner!==G.player && G.diplomacy[p.owner]?.war);
  hostileOwned.forEach(enemyProv=>{
    const neighbors=G.provinces.filter(f=>f.owner===G.player && Math.abs((f.x+f.w/2)-(enemyProv.x+enemyProv.w/2))<190 && Math.abs((f.y+f.h/2)-(enemyProv.y+enemyProv.h/2))<150);
    neighbors.slice(0,1).forEach(friend=>{
      const x1=friend.x+friend.w/2,y1=friend.y+friend.h/2;
      const x2=enemyProv.x+enemyProv.w/2,y2=enemyProv.y+enemyProv.h/2;
      const line=document.createElementNS("http://www.w3.org/2000/svg","line");
      line.setAttribute("x1",x1);line.setAttribute("y1",y1);line.setAttribute("x2",x2);line.setAttribute("y2",y2);
      line.setAttribute("stroke","#efb0a7");line.setAttribute("stroke-width","5");line.setAttribute("stroke-dasharray","12 8");line.setAttribute("opacity",".9");
      g.appendChild(line);
    });
  });
  svg.appendChild(g);
}

function drawSupplyOverlay(){
  const svg=document.getElementById("worldMap"); if(!svg)return;
  const g=document.createElementNS("http://www.w3.org/2000/svg","g");
  g.classList.add("supply-layer");
  (G.supplyNodes||[]).forEach(n=>{
    const p=provinceByName(n.province);if(!p)return;
    const c=document.createElementNS("http://www.w3.org/2000/svg","circle");
    c.setAttribute("cx",p.x+p.w/2);c.setAttribute("cy",p.y+p.h/2);c.setAttribute("r","9");
    c.setAttribute("fill","#7db6d8");c.setAttribute("stroke","#dcefff");c.setAttribute("stroke-width","2");
    const t=document.createElementNS("http://www.w3.org/2000/svg","text");
    t.setAttribute("x",p.x+p.w/2);t.setAttribute("y",p.y+p.h/2+4);t.setAttribute("text-anchor","middle");t.setAttribute("fill","#071117");t.setAttribute("font-size","9");t.textContent="S";
    g.append(c,t);
  });
  (G.supplyEdges||[]).forEach(e=>{
    const a=provinceByName(e[0]),b=provinceByName(e[1]);if(!a||!b)return;
    const line=document.createElementNS("http://www.w3.org/2000/svg","line");
    line.setAttribute("x1",a.x+a.w/2);line.setAttribute("y1",a.y+a.h/2);line.setAttribute("x2",b.x+b.w/2);line.setAttribute("y2",b.y+b.h/2);
    line.setAttribute("stroke","#7db6d8");line.setAttribute("stroke-width","3");line.setAttribute("opacity",".75");
    g.appendChild(line);
  });
  svg.appendChild(g);
}


function selectAirWing(id){G.selected={type:"air",id};renderSelection();drawMap()}
function selectFleet(id){G.selected={type:"fleet",id};renderSelection();drawMap()}
