
"use strict";
let mapZoom=1, mapPan={x:0,y:0};

function nationColor(id){return NATIONS[id]?.color||"#777"}
function drawMap(){
  const svg=document.getElementById("worldMap"); if(!svg)return;
  svg.innerHTML="";
  // Stylized original continent silhouette: irregular coastline + internal province polygons.
  const bg=document.createElementNS("http://www.w3.org/2000/svg","rect");
  bg.setAttribute("width","1200");bg.setAttribute("height","720");bg.setAttribute("fill","#284a52");svg.appendChild(bg);

  const coast=document.createElementNS("http://www.w3.org/2000/svg","path");
  coast.setAttribute("d","M60 120 Q130 65 230 92 T390 80 Q510 40 610 98 T760 76 Q860 55 1010 120 Q1110 175 1135 255 L1100 345 Q1150 430 1080 515 Q1000 580 920 610 Q800 650 690 622 Q580 680 450 630 Q330 665 225 600 Q110 585 65 490 Q90 390 55 300 Q30 205 60 120Z");
  coast.setAttribute("fill","#475f54");coast.setAttribute("stroke","#b9b78d");coast.setAttribute("stroke-width","6");svg.appendChild(coast);

  const labels=document.createElementNS("http://www.w3.org/2000/svg","g");
  const title=document.createElementNS("http://www.w3.org/2000/svg","text");
  title.setAttribute("x","600");title.setAttribute("y","38");title.setAttribute("text-anchor","middle");title.setAttribute("fill","#d6c89f");title.setAttribute("font-family","Georgia");title.setAttribute("font-size","22");title.setAttribute("letter-spacing","6");title.textContent="THE CONTINENT";
  labels.appendChild(title);svg.appendChild(labels);

  const terrain=document.createElementNS("http://www.w3.org/2000/svg","g");terrain.classList.add("terrain");
  terrain.innerHTML=`<path d="M560 160 l65 90 -50 85 30 100 -65 110" fill="none" stroke="#d3d0ad" stroke-width="28" opacity=".18"/>
    <path d="M180 160 l75 55 -30 85 70 45" fill="none" stroke="#d3d0ad" stroke-width="22" opacity=".13"/>
    <path d="M790 160 q85 45 120 120 t-40 170" fill="none" stroke="#c1ceb2" stroke-width="42" opacity=".15"/>`;
  svg.appendChild(terrain);

  // Province blocks are now clipped visually into the continent silhouette.
  const clip=document.createElementNS("http://www.w3.org/2000/svg","clipPath");
  clip.setAttribute("id","continentClip"); const cp=coast.cloneNode(); clip.appendChild(cp);
  const defs=document.createElementNS("http://www.w3.org/2000/svg","defs");defs.appendChild(clip);svg.appendChild(defs);

  const layer=document.createElementNS("http://www.w3.org/2000/svg","g");layer.setAttribute("clip-path","url(#continentClip)");
  G.provinces.forEach(p=>{
    const g=document.createElementNS("http://www.w3.org/2000/svg","g");g.classList.add("province");g.dataset.id=p.id;
    const r=document.createElementNS("http://www.w3.org/2000/svg","path");
    const j=(Number(String(p.id).replace(/\D/g,""))||0)%7;
    const x=p.x,y=p.y,w=p.w,h=p.h;
    const pts=[
      [x+8+j,y+4],[x+w-18,y+7+j%4],[x+w-5,y+h*.34],
      [x+w-12,y+h-8-j%5],[x+w*.52,y+h-4],[x+12+j%4,y+h-13],[x+4,y+h*.43]
    ].map(v=>v.join(",")).join(" ");
    r.setAttribute("d","M"+pts+"Z");
    r.setAttribute("fill",nationColor(p.owner));
    r.setAttribute("stroke",G.frontSelection?.includes(p.id)?"#e8cb82":"#1b201f");
    r.setAttribute("stroke-width",G.frontSelection?.includes(p.id)?"5":"3");
    const t=document.createElementNS("http://www.w3.org/2000/svg","text");t.setAttribute("x",p.x+p.w/2);t.setAttribute("y",p.y+p.h/2);t.setAttribute("text-anchor","middle");t.setAttribute("fill","#f2ead5");t.setAttribute("font-size","13");t.setAttribute("font-family","Georgia");t.textContent=p.name;
    g.append(r,t);
    g.addEventListener("click",()=>selectProvince(p.id));
    g.addEventListener("mousemove",e=>showMapTip(e,p));g.addEventListener("mouseleave",hideMapTip);
    layer.appendChild(g);
  });
  svg.appendChild(layer);

  drawFrontLines();
  drawUnits();
  drawSupplyOverlayIfEnabled();
  applyMapView();
}

function drawUnits(){
  const svg=document.getElementById("worldMap");if(!svg)return;
  G.armies.forEach(a=>{
    const p=provinceByName(a.province);if(!p)return;
    const g=document.createElementNS("http://www.w3.org/2000/svg","g");g.classList.add("unit-marker");g.dataset.id=a.id;
    const x=p.x+p.w/2,y=p.y+p.h/2+22;
    const c=document.createElementNS("http://www.w3.org/2000/svg","rect");
    c.setAttribute("x",x-15);c.setAttribute("y",y-12);c.setAttribute("width","30");c.setAttribute("height","24");c.setAttribute("rx","5");
    c.setAttribute("fill",a.owner===G.player?"#10161b":"#602e2c");c.setAttribute("stroke",a.owner===G.player?"#e3cb82":"#e89087");c.setAttribute("stroke-width","2");
    const tx=document.createElementNS("http://www.w3.org/2000/svg","text");tx.setAttribute("x",x);tx.setAttribute("y",y+5);tx.setAttribute("text-anchor","middle");tx.setAttribute("fill","#fff");tx.setAttribute("font-size","12");tx.textContent="ARMY";
    g.append(c,tx);g.style.cursor="grab";g.addEventListener("click",e=>{e.stopPropagation();selectArmy(a.id)});
    let dragging=false;
    g.addEventListener("mousedown",e=>{
      if(a.owner!==G.player)return;
      draggingUnit=true;e.preventDefault();
      g.style.cursor="grabbing";
      const move=ev=>{
        if(!draggingUnit)return;
        const pt=svg.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;
        const ctm=svg.getScreenCTM();if(!ctm)return;
        const local=pt.matrixTransform(ctm.inverse());
        const over=G.provinces.find(p=>local.x>=p.x&&local.x<=p.x+p.w&&local.y>=p.y&&local.y<=p.y+p.h);
        if(over){const tip=document.getElementById("mapTip");tip.style.display="block";tip.style.left=(ev.offsetX+14)+"px";tip.style.top=(ev.offsetY+14)+"px";tip.innerHTML=`<b>Move ${a.name}</b>→ ${over.name}<br>Release to order movement.`}
      };
      const up=ev=>{
        draggingUnit=false;g.style.cursor="grab";document.removeEventListener("mousemove",move);document.removeEventListener("mouseup",up);
        const pt=svg.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;const ctm=svg.getScreenCTM();if(!ctm)return;
        const local=pt.matrixTransform(ctm.inverse());
        const over=G.provinces.find(p=>local.x>=p.x&&local.x<=p.x+p.w&&local.y>=p.y&&local.y<=p.y+p.h);
        if(over && typeof moveArmyToProvince==="function")moveArmyToProvince(a.id,over.id);
        hideMapTip();
      };
      document.addEventListener("mousemove",move);document.addEventListener("mouseup",up);
    });
    svg.appendChild(g);
  });
  (G.airWings||[]).forEach(w=>{
    const p=provinceByName(w.base);if(!p)return;
    const g=document.createElementNS("http://www.w3.org/2000/svg","g");
    const x=p.x+p.w/2+26,y=p.y+p.h/2-24;
    const c=document.createElementNS("http://www.w3.org/2000/svg","rect");c.setAttribute("x",x-11);c.setAttribute("y",y-10);c.setAttribute("width","22");c.setAttribute("height","20");c.setAttribute("rx","4");c.setAttribute("fill","#1c2531");c.setAttribute("stroke","#e1cd88");c.setAttribute("stroke-width","2");
    const tx=document.createElementNS("http://www.w3.org/2000/svg","text");tx.setAttribute("x",x);tx.setAttribute("y",y+5);tx.setAttribute("text-anchor","middle");tx.setAttribute("fill","#fff");tx.setAttribute("font-size","11");tx.textContent="✈";
    g.append(c,tx);g.addEventListener("click",e=>{e.stopPropagation();selectAirWing(w.id)});svg.appendChild(g);
  });
  (G.fleets||[]).forEach(f=>{
    const points={"SZ1":[180,665],"SZ2":[650,62],"SZ3":[1040,115],"SZ4":[520,675]}[f.zone]||[600,650];
    const g=document.createElementNS("http://www.w3.org/2000/svg","g");
    const c=document.createElementNS("http://www.w3.org/2000/svg","circle");c.setAttribute("cx",points[0]);c.setAttribute("cy",points[1]);c.setAttribute("r","14");c.setAttribute("fill","#101820");c.setAttribute("stroke","#7faad0");c.setAttribute("stroke-width","2");
    const tx=document.createElementNS("http://www.w3.org/2000/svg","text");tx.setAttribute("x",points[0]);tx.setAttribute("y",points[1]+5);tx.setAttribute("text-anchor","middle");tx.setAttribute("fill","#fff");tx.setAttribute("font-size","10");tx.textContent="⚓";
    g.append(c,tx);g.addEventListener("click",e=>{e.stopPropagation();selectFleet(f.id)});svg.appendChild(g);
  });
}

function drawSupplyOverlayIfEnabled(){
  if(document.getElementById("showSupply")?.checked) drawSupplyOverlay();
}

function applyMapView(){
  const svg=document.getElementById("worldMap");
  svg.style.transform=`translate(${mapPan.x}px,${mapPan.y}px) scale(${mapZoom})`;
  document.querySelectorAll("#worldMap .terrain").forEach(x=>x.style.display=document.getElementById("showTerrain")?.checked?"":"none");
  document.querySelectorAll("#worldMap .province text").forEach(x=>x.style.display=document.getElementById("showNames")?.checked?"":"none");
  document.querySelectorAll("#worldMap .supply-layer").forEach(x=>x.remove());
  drawSupplyOverlayIfEnabled();
}
function showMapTip(e,p){
  const t=document.getElementById("mapTooltip");t.style.display="block";t.style.left=(e.offsetX+12)+"px";t.style.top=(e.offsetY+12)+"px";
  t.innerHTML=`<b>${p.name}</b>${nationName(p.owner)}<br>Population: ${p.population.toLocaleString()}<br>Infrastructure: ${p.infrastructure}%<br>Terrain: ${p.terrain}`;
}
function hideMapTip(){document.getElementById("mapTooltip").style.display="none"}
function selectProvince(id){
  const frontBtn=document.getElementById("frontModeBtn");
  const frontActive=frontBtn?.dataset.active==="1";
  if(frontActive){
    if(!G.frontSelection)G.frontSelection=[];
    if(!G.frontSelection.includes(id))G.frontSelection.push(id);
    toast(`${G.frontSelection.length} province${G.frontSelection.length===1?"":"s"} selected for front`);
    if(G.frontSelection.length>=2 && document.getElementById("frontNameInput")?.value){
      setFront(document.getElementById("frontNameInput").value,G.frontSelection);
      frontBtn.dataset.active="0";
      frontBtn.textContent="FRONT MODE";
    }
  }
  G.selected={type:"province",id};renderSelection();drawMap();
}
function selectArmy(id){G.selected={type:"army",id};renderSelection();drawMap()}
function resetMap(){mapZoom=1;mapPan={x:0,y:0};applyMapView()}
function initMap(){
  document.getElementById("resetMap").onclick=resetMap;
  document.getElementById("showTerrain").onchange=applyMapView;
  document.getElementById("frontModeBtn")?.addEventListener("click",()=>{
    const el=document.getElementById("frontModeBtn");
    const active=el.dataset.active==="1";
    el.dataset.active=active?"0":"1";
    el.textContent=active?"FRONT MODE":"FRONT MODE ON";
    G.frontSelection=[];
    toast(active?"Front mode disabled":"Click provinces on the map to build a front");
  });
  document.getElementById("showNames").onchange=applyMapView;
  document.getElementById("showSupply")?.addEventListener("change",drawMap);
  let dragging=false,last=null;
  let draggingUnit=false;
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
