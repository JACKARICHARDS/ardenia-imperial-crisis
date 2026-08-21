
"use strict";
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),1800)}
function fmt(n){return Number(n||0).toLocaleString()}
function dateText(){return `${G.date.day} ${MONTHS[G.date.month-1]} ${G.date.year}`}
function renderTop(){
  const stats=[
    ["TREASURY",G.treasury.toFixed(0),"good"],["POLITICAL",G.politicalPower.toFixed(0),""],["STABILITY",G.stability+"%",""],["LEGITIMACY",G.legitimacy+"%",""],
    ["WAR SUPPORT",G.warSupport+"%",""],["MANPOWER",fmt(G.manpower),"good"],["FACTORIES",G.factories,""]
  ];
  document.getElementById("topStats").innerHTML=stats.map(s=>`<div class="stat ${s[2]}"><small>${s[0]}</small><b>${s[1]}</b></div>`).join("");
  document.getElementById("dateLabel").textContent=dateText();
  document.getElementById("pauseBtn").textContent=G.paused?"PLAY":"PAUSE";
  document.getElementById("speedBtn").textContent=`SPEED ${G.speed}×`;
}
function renderAgenda(){
  const el=document.getElementById("agendaPanel");
  if(!G.agenda)el.innerHTML=`<div class="row"><small>No active agenda.</small></div>`;
  else el.innerHTML=`<div class="row"><div><b>${G.agenda.name}</b><small>${G.agenda.progress}/${G.agenda.days} days</small><div class="bar"><i style="width:${G.agenda.progress/G.agenda.days*100}%"></i></div></div></div>`;
  el.innerHTML+=`<div class="button-grid"><button class="button" onclick="startAgenda('rebuild')">Reconstruction</button><button class="button" onclick="startAgenda('industry')">Industry</button><button class="button" onclick="startAgenda('army')">Army Reform</button></div>`;
}
function renderArmies(){
  const el=document.getElementById("armyPanel");
  el.innerHTML=G.armies.filter(a=>a.owner===G.player).map(a=>`<div class="army-card ${G.selected?.id===a.id?"selected":""}" onclick="selectArmy('${a.id}')"><b>${a.name}</b><small>${a.province} · STR ${a.strength} · ORG ${a.organization}</small>${a.order?`<span class="pill">ORDER: ${provinceById(a.order.target)?.name||"?"}</span>`:""}</div>`).join("");
}
function renderProduction(){
  const used=G.production.reduce((n,l)=>n+l.assigned,0);
  document.getElementById("productionPanel").innerHTML=`<div class="row"><div><b>Factory Allocation</b><small>${Math.max(0,G.factories-used)} free of ${G.factories}</small></div></div>`+G.production.map(l=>`<div class="row"><div><b>${l.name}</b><small>${l.assigned} factories · stock ${l.stock}</small></div><div><button class="button tiny" onclick="assignFactory('${l.id}',-1)">−</button><button class="button tiny" onclick="assignFactory('${l.id}',1)">+</button></div></div>`).join("");
}
function renderWorld(){
  document.getElementById("worldPanel").innerHTML=Object.entries(G.diplomacy).map(([id,d])=>`<div class="row"><div><b>${nationName(id)}</b><small>${d.war?"AT WAR":d.relation>20?"FRIENDLY":d.relation<-20?"HOSTILE":"NEUTRAL"}</small></div><span class="pill ${d.war?"bad":d.relation>20?"good":""}">${d.relation}</span></div>`).join("");
  document.getElementById("newsPanel").innerHTML=G.news.slice(0,6).map(n=>`<div class="news"><b>${n.title}</b><small>${n.date}</small><div style="font:9px Arial;color:#8f989e;margin-top:3px">${n.body}</div></div>`).join("");
}
function renderSelection(){
  const el=document.getElementById("selectionPanel");
  if(!G.selected){el.innerHTML=`<div class="empty">Select a province, army, air wing or fleet to inspect it.</div>`;return}
  if(G.selected.type==="province"){
    const p=provinceById(G.selected.id);if(!p)return;
    const friendly=p.owner===G.player;
    el.innerHTML=`<div class="dossier"><h2>${p.name}</h2><p>${nationName(p.owner)} · ${p.terrain}</p><div class="grid3"><div class="mini">POPULATION<b>${p.population.toLocaleString()}</b></div><div class="mini">INFRASTRUCTURE<b>${p.infrastructure}%</b></div><div class="mini">FORTS<b>${p.fort}</b></div></div>${!friendly?`<div style="margin-top:10px"><button class="button" onclick="orderSelectedArmy('${p.id}')">Order Selected Army Here</button></div>`:""}</div>`;
  }else if(G.selected.type==="army"){
    const a=G.armies.find(x=>x.id===G.selected.id);if(!a)return;
    el.innerHTML=`<div class="dossier"><h2>${a.name}</h2><p>${a.province} · ${a.owner===G.player?"Under your command":"Foreign formation"}</p><div class="grid3"><div class="mini">STRENGTH<b>${a.strength}</b></div><div class="mini">ORGANIZATION<b>${a.organization}</b></div><div class="mini">EQUIPMENT<b>${a.equipment}%</b></div></div><div style="margin-top:10px"><b style="font-size:11px">Orders</b><div class="button-grid">${G.provinces.filter(p=>(p.owner!==G.player&&G.diplomacy[p.owner]?.war)&&((G.adjacency[a.province]||[]).includes(p.name))).map(p=>`<button class="button" onclick="issueOrder('${a.id}','${p.id}','attack')">Attack ${p.name}</button>`).join("")||"<span class='empty'>No adjacent hostile province.</span>"}</div></div></div>`;
  }else if(G.selected.type==="air"){
    const w=G.airWings.find(x=>x.id===G.selected.id);if(!w)return;
    const targets=G.airZones.flatMap(z=>z.provinces).filter(n=>G.provinces.some(p=>p.name===n&&(p.owner!==G.player)));
    el.innerHTML=`<div class="dossier"><h2>${w.name}</h2><p>Base: ${w.base} · Mission: ${w.mission.replaceAll("_"," ")}</p><div class="grid3"><div class="mini">AIRCRAFT<b>${Math.round(w.aircraft)}</b></div><div class="mini">READINESS<b>${w.readiness}%</b></div><div class="mini">STATUS<b>ACTIVE</b></div></div><div class="button-grid" style="margin-top:10px"><button class="button" onclick="setAirMission('${w.id}','air_superiority','${w.base}')">AIR SUPERIORITY</button><button class="button" onclick="setAirMission('${w.id}','ground_attack','${targets[0]||w.base}')">GROUND ATTACK</button><button class="button" onclick="setAirMission('${w.id}','recon','${w.base}')">RECON</button></div></div>`;
  }else if(G.selected.type==="fleet"){
    const f=G.fleets.find(x=>x.id===G.selected.id);if(!f)return;
    el.innerHTML=`<div class="dossier"><h2>${f.name}</h2><p>Zone: ${G.seaZones.find(z=>z.id===f.zone)?.name||f.zone} · Mission: ${f.mission}</p><div class="grid3"><div class="mini">SHIPS<b>${f.ships}</b></div><div class="mini">READINESS<b>${f.readiness}%</b></div><div class="mini">MISSION<b>${f.mission}</b></div></div><div class="button-grid" style="margin-top:10px">${G.seaZones.map(z=>`<button class="button" onclick="moveFleet('${f.id}','${z.id}')">${z.name}</button>`).join("")}</div></div>`;
  }
}
function renderPolitics(){
  document.getElementById("politicsTab").innerHTML=`<div class="dossier"><h2>Politics</h2><p>Manage the political foundations of the state. Political power is generated daily and spent on laws and national decisions.</p><div class="grid3"><div class="mini">STABILITY<b>${G.stability}%</b></div><div class="mini">LEGITIMACY<b>${G.legitimacy}%</b></div><div class="mini">POLITICAL POWER<b>${G.politicalPower.toFixed(0)}</b></div></div><h3 style="color:var(--gold2)">Available Laws</h3>${G.laws.map(l=>`<div class="row"><div><b>${l.name}</b><small>${l.desc}</small></div><button class="button" onclick="passLaw('${l.id}')">${l.cost} PP</button></div>`).join("")}</div>`;
}
function renderResearch(){
  const slots=["infantry","industry","armor","radio"];
  document.getElementById("researchTab").innerHTML=`<div class="dossier"><h2>Research Directorate</h2><p>Four independent research fields let you build a specialized national development path.</p>${slots.map(s=>`<h3 style="color:var(--gold2);text-transform:uppercase;font:700 11px Arial;letter-spacing:.1em">${s} · ${G.research[s]?"ACTIVE":"AVAILABLE"}</h3>${G.technologies[s].map(t=>`<div class="row"><div><b>${t.name}</b><small>${t.desc} · ${t.cost} days</small></div>${t.done?`<span class="pill good">COMPLETE</span>`:G.research[s]===t.id?`<span class="pill">IN PROGRESS ${G.researchProgress[s]}/${t.cost}</span>`:`<button class="button" onclick="selectResearch('${s}','${t.id}')">RESEARCH</button>`}</div>`).join("")}`).join("")}</div>`;
}
function renderIndustry(){
  document.getElementById("industryTab").innerHTML=`<div class="dossier"><h2>Industrial Command</h2><p>Military factories manufacture equipment while civilian industry supports the national economy.</p><div class="grid3"><div class="mini">MILITARY FACTORIES<b>${G.factories}</b></div><div class="mini">CIVILIAN FACTORIES<b>${G.civilianFactories}</b></div><div class="mini">FUEL<b>${G.fuel.toFixed(0)}</b></div></div>${G.production.map(l=>`<div class="row"><div><b>${l.name}</b><small>${l.assigned} factories · ${l.output}/day · stock ${l.stock}</small></div><div><button class="button tiny" onclick="assignFactory('${l.id}',-1)">−</button><button class="button tiny" onclick="assignFactory('${l.id}',1)">+</button></div></div>`).join("")}</div>`;
}
function renderDiplomacy(){
  document.getElementById("diplomacyTab").innerHTML=`<div class="dossier"><h2>Foreign Office</h2><p>Relations influence trade, alignment, guarantees and the political cost of war.</p>
  ${Object.entries(G.diplomacy).map(([id,d])=>`<div class="row"><div><b>${nationName(id)}</b><small>Relation ${Math.round(d.relation)} · ${d.war?"WAR":"Peace"} · ${G.ai?.[id]?.focus||"independent"}</small></div><div><button class="button tiny" onclick="improveRelations('${id}')">+REL</button>${d.war?"":"<button class='button tiny danger' onclick=\"declareWar('"+id+"')\">WAR</button>"}</div></div>`).join("")}</div>`;
}
function renderWar(){
  const wars=G.wars.map(w=>`<div class="row"><div><b>War with ${nationName(w.against)}</b><small>Started ${w.start}</small></div><span class="pill bad">ACTIVE</span></div>`).join("");
  document.getElementById("warTab").innerHTML=`<div class="dossier"><h2>War Room</h2><p>Armies move between provinces. Battles are resolved automatically when an ordered army reaches a hostile province.</p>${wars||'<div class="empty">No active wars.</div>'}<h3 style="color:var(--gold2)">Command principles</h3><p>1. Declare war through Diplomacy. 2. Select an army. 3. Click a hostile province. 4. Issue an attack order. 5. Advance the clock.</p></div>`;
}
function renderLedger(){
  document.getElementById("ledgerTab").innerHTML=`<div class="dossier"><h2>Campaign Ledger</h2>${G.log.slice(0,60).map(x=>`<div class="row"><small>${x}</small></div>`).join("")}</div>`;
}
function renderAll(){renderTop();renderAgenda();renderArmies();renderProduction();renderWorld();renderSelection();renderPolitics();renderResearch();renderIndustry();renderDiplomacy();renderWar();renderArmyDesign();renderAir();renderNavy();renderLedger();drawMap()}
function initTabs(){document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".tabview").forEach(x=>x.classList.remove("active"));document.getElementById(b.dataset.tab+"Tab").classList.add("active")})}
function initClock(){
  document.getElementById("pauseBtn").onclick=()=>{G.paused=!G.paused;renderTop()};
  document.getElementById("speedBtn").onclick=()=>{G.speed=G.speed===1?2:G.speed===2?4:1;renderTop()};
  document.getElementById("nextDayBtn").onclick=()=>nextDay();
  setInterval(()=>{if(!G.paused){for(let i=0;i<G.speed;i++)nextDay()}},1000);
}
function initPersistence(){
  document.getElementById("saveBtn").onclick=()=>saveGame();
  document.getElementById("loadBtn").onclick=()=>loadGame();
  document.getElementById("newBtn").onclick=()=>{if(confirm("Start a new campaign?")){G=makeState();saveGame(true);renderAll()}};
  document.getElementById("exportBtn").onclick=()=>exportGame();
  document.getElementById("importInput").onchange=e=>importGame(e.target.files[0]);
}
function showFatalError(err){
  console.error(err);
  const app=document.getElementById("app");
  if(app){const box=document.createElement("div");box.id="fatalError";box.innerHTML=`<div><h2>Game initialization failed</h2><p>The game loaded, but one of its systems failed to initialize.</p><pre>${String(err?.stack||err||"Unknown error").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]))}</pre><button class="button" onclick="location.reload()">RELOAD GAME</button></div>`;app.prepend(box);}
}
window.addEventListener("error",e=>showFatalError(e.error||e.message));
window.addEventListener("unhandledrejection",e=>showFatalError(e.reason));
window.addEventListener("load",()=>{try{ensureStateIntegrity();initTabs();initMap();initClock();initPersistence();renderAll();}catch(err){showFatalError(err)}});

function renderArmyDesign(){
  const el=document.getElementById("armyTab");
  if(!el)return;
  el.innerHTML=`<div class="dossier"><h2>Army Design & Supply</h2>
    <p>Build division templates, raise new units and monitor the supply network. This is an original system rather than a copy of any commercial game's code or data.</p>
    <h3 style="color:var(--gold2)">Templates</h3>
    ${G.divisionTemplates.map(t=>`<div class="row"><div><b>${t.name}</b><small>${t.width}-width · SA ${t.softAttack} · DEF ${t.defense} · BRK ${t.breakthrough}</small></div><button class="button" onclick="createDivisionFromTemplate('${t.id}','A1')">RAISE</button></div>`).join("")}
    <h3 style="color:var(--gold2)">Divisions</h3>
    ${(G.divisions||[]).map(d=>{const t=G.divisionTemplates.find(x=>x.id===d.template);return `<div class="row"><div><b>${d.name}</b><small>${t?.name||d.template} · STR ${d.strength} · ORG ${d.org} · SUPPLY ${Math.round(d.supply)}%</small><div class="bar"><i style="width:${d.supply}%"></i></div></div><span class="pill ${d.supply<40?"bad":d.supply>80?"good":""}">${d.supply>80?"SUPPLIED":d.supply<40?"SHORT":"LIMITED"}</span></div>`}).join("")}
    <h3 style="color:var(--gold2)">Supply Network</h3>
    <div class="grid3">
      <div class="mini">NATIONAL STOCK<b>${Math.round(G.supply.nationalStock)}</b></div>
      <div class="mini">NETWORK EFFICIENCY<b>${G.supply.networkEfficiency}%</b></div>
      <div class="mini">CONVOY LOSS<b>${G.supply.convoyLoss}%</b></div>
    </div>
    <div style="margin-top:10px" class="button-grid">
      <button class="button" onclick="toast('Supply overlay toggled with the map control.')">MAP SUPPLY</button>
      <button class="button" onclick="addNews('Supply Review','Logistics officers report the current network is functioning within planned capacity.')">REQUEST REPORT</button>
    </div>
  </div>`;
}

function renderAir(){
  const el=document.getElementById("airTab");if(!el)return;
  el.innerHTML=`<div class="dossier"><h2>Air Command</h2><p>Assign wings to air-superiority, ground-attack or reconnaissance missions. Air operations affect organization and battlefield pressure.</p>
  ${(G.airWings||[]).map(w=>`<div class="row"><div><b>${w.name}</b><small>${w.base} · ${Math.round(w.aircraft)} aircraft · readiness ${w.readiness}%</small></div><span class="pill">${w.mission.replaceAll("_"," ")}</span></div>`).join("")}
  <h3 style="color:var(--gold2)">Air Zones</h3>${G.airZones.map(z=>`<div class="row"><div><b>${z.name}</b><small>${z.provinces.join(", ")}</small></div><span class="pill">AIR THEATER</span></div>`).join("")}</div>`;
}
function renderNavy(){
  const el=document.getElementById("navyTab");if(!el)return;
  el.innerHTML=`<div class="dossier"><h2>Naval Command</h2><p>Move fleets between sea zones to contest control, protect shipping and create strategic pressure.</p>
  ${(G.fleets||[]).map(f=>`<div class="row"><div><b>${f.name}</b><small>${G.seaZones.find(z=>z.id===f.zone)?.name||f.zone} · ${f.ships} ships · readiness ${f.readiness}%</small></div><span class="pill">${f.mission}</span></div>`).join("")}
  <h3 style="color:var(--gold2)">Sea Zones</h3>${G.seaZones.map(z=>`<div class="row"><div><b>${z.name}</b><small>Control: ${z.control} · Naval power ${z.navalPower}</small></div><span class="pill">${z.control===G.player?"CONTROLLED":"CONTESTED"}</span></div>`).join("")}</div>`;
}
