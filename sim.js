
"use strict";

const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];

function nextDay(){
  G.date.day++;
  const md=[31,28,31,30,31,30,31,31,30,31,30,31][G.date.month-1];
  if(G.date.day>md){G.date.day=1;G.date.month++;if(G.date.month>12){G.date.month=1;G.date.year++;}}
  economyTick();researchTick();productionTick();divisionTick();supplyTick();airTick();navalTick();aiTick();warTick();agendaTick();politicalTick();
  if(G.date.day===1) monthlyNews();
  renderAll();
  saveGame(true);
}
function economyTick(){
  const stabilityMod=(G.stability-50)/250;
  (G.resourceNodes||[]).forEach(node=>{const p=provinceByName(node.province);if(p?.owner===G.player) G.resourceStock[node.resource]=(G.resourceStock[node.resource]||0)+node.amount*0.05;});
  const resourceDemand=G.production.reduce((n,l)=>n+l.assigned,0);
  const steelNeed=resourceDemand*0.7, oilNeed=resourceDemand*0.25, electronicsNeed=resourceDemand*0.15;
  const steelAvail=Math.min(G.resourceStock.steel,steelNeed);
  const oilAvail=Math.min(G.resourceStock.oil,oilNeed);
  const elecAvail=Math.min(G.resourceStock.electronics,electronicsNeed);
  const resourceEfficiency=Math.min(
    steelNeed?steelAvail/steelNeed:1,
    oilNeed?oilAvail/oilNeed:1,
    electronicsNeed?elecAvail/electronicsNeed:1
  );
  G.resourceStock.steel=Math.max(0,G.resourceStock.steel-steelAvail);
  G.resourceStock.oil=Math.max(0,G.resourceStock.oil-oilAvail);
  G.resourceStock.electronics=Math.max(0,G.resourceStock.electronics-elecAvail);

  G.treasury=Math.max(0,G.treasury + 0.35 + stabilityMod - (G.factories*0.01));
  G.politicalPower=Math.min(250,G.politicalPower + (G.stability>40?0.85:0.45));
  G.fuel=Math.max(0,G.fuel + G.resourceStock.oil*0.03 - G.armies.filter(a=>a.owner===G.player).length*0.7);

  if(resourceEfficiency<0.75){
    G.stability=clamp(G.stability-0.05);
    G.news.unshift({date:dateText?.()||"",title:"Industrial Shortage",body:"Resource shortages are reducing factory efficiency."});
  }
  G.manpower=Math.max(0,G.manpower - G.armies.filter(a=>a.owner===G.player).reduce((n,a)=>n+Math.max(0,100-a.strength)*.03,0));
}

function researchTick(){
  const r=G.research;
  Object.entries(r).forEach(([slot,id])=>{
    if(!id)return;
    const tech=G.technologies[slot].find(t=>t.id===id);if(!tech)return;
    G.researchProgress[slot]+=1;
    if(G.researchProgress[slot]>=tech.cost){tech.done=true;r[slot]=null;G.researchProgress[slot]=0;addNews("Research Completed",`${tech.name} is now available to the armed forces and industry.`);}
  });
}
function productionTick(){
  G.production.forEach(line=>{line.output=Math.max(0,Math.floor(line.assigned*(1+(G.technologies.industry.some(t=>t.done)?0.2:0))*.08));line.stock+=line.output});
}
function agendaTick(){
  if(!G.agenda)return;
  G.agenda.progress++;
  if(G.agenda.progress>=G.agenda.days){
    if(G.agenda.effect==="stability")G.stability=clamp(G.stability+8);
    if(G.agenda.effect==="industry")G.factories+=3;
    if(G.agenda.effect==="army")G.armies.filter(a=>a.owner===G.player).forEach(a=>a.organization=clamp(a.organization+10));
    addNews("National Agenda Completed",G.agenda.name+" has delivered its promised results.");
    G.agenda=null;
  }
}
function politicalTick(){
  if(G.stability<25 && Math.random()<.02){G.stability=clamp(G.stability-4);addNews("Domestic Unrest","Strikes and demonstrations are spreading in several cities.");}
}
function monthlyNews(){
  const messages=[
    ["Continental Dispatch","Foreign ministries across the continent report rising military expenditures."],
    ["Industrial Review","Manufacturers call for predictable orders as factories expand production."],
    ["Parliamentary Chronicle","Opposition deputies demand greater transparency over emergency powers."],
    ["Border Report","Border commanders report increased patrol activity along contested frontiers."]
  ];
  const m=messages[Math.floor(Math.random()*messages.length)];addNews(m[0],m[1]);
}
function startAgenda(id){
  const a={
    rebuild:{name:"Rebuild the Crown",days:90,effect:"stability"},
    industry:{name:"National Industrial Drive",days:120,effect:"industry"},
    army:{name:"Reform the Field Armies",days:100,effect:"army"}
  }[id];if(!a)return;
  if(G.agenda){toast("An agenda is already underway.");return}
  G.agenda={...a,progress:0};addNews("Agenda Set",a.name+" is now the government's central priority.");renderAll();
}
function selectResearch(slot,id){
  const tech=G.technologies[slot].find(t=>t.id===id);if(!tech||tech.done)return;
  if(G.research[slot]){toast("That research slot is occupied.");return}
  G.research[slot]=id;addNews("Research Started",tech.name+" has entered active development.");renderAll();
}
function passLaw(id){
  const l=G.laws.find(x=>x.id===id);if(!l||G.politicalPower<l.cost){toast("Not enough political power.");return}
  G.politicalPower-=l.cost;
  if(id==="conscription")G.manpower+=300;
  if(id==="industry")G.factories+=4;
  if(id==="war_economy"){G.factories+=6;G.stability=clamp(G.stability-8)}
  G.stability=clamp(G.stability-(id==="conscription"?2:3));
  addNews("Law Enacted",l.name+" has been enacted by the government.");renderAll();
}
function assignFactory(id,delta){
  const l=G.production.find(x=>x.id===id);if(!l)return;
  const total=G.production.reduce((n,x)=>n+x.assigned,0);
  if(delta>0 && total>=G.factories){toast("No free military factories.");return}
  l.assigned=Math.max(0,l.assigned+delta);renderAll();
}
function improveRelations(id){
  const d=G.diplomacy[id];if(!d||G.politicalPower<10)return toast("Not enough political power.");
  G.politicalPower-=10;d.relation=clamp(d.relation+8,-100,100);addNews("Diplomatic Outreach",`Relations with ${nationName(id)} have improved.`);renderAll();
}
function declareWar(id){
  const d=G.diplomacy[id];if(!d||d.war)return;
  if(G.warSupport<20){toast("War support is too low.");return}
  d.war=true;G.warSupport=clamp(G.warSupport-8);G.wars.push({against:id,start:`${G.date.year}-${G.date.month}-${G.date.day}`});
  addNews("War Declared",`Ardenia has declared war on ${nationName(id)}.`);renderAll();
}
function issueOrder(armyId,targetId,type){
  const a=G.armies.find(x=>x.id===armyId),p=provinceById(targetId);if(!a||!p)return;
  if(a.owner!==G.player){toast("You do not command this army.");return}
  const current=provinceByName(a.province);
  const legal=(G.adjacency?.[current?.name]||[]).includes(p.name);
  if(!legal && current?.name!==p.name){toast("That province is not adjacent to the army's current position.");return}
  if(p.owner!==G.player && !G.diplomacy[p.owner]?.war){toast("You are not at war with this country.");return}
  a.order={type,target:targetId,days:Math.max(2,Math.round(5-a.mobility/30))};
  addNews("Field Order Issued",`${a.name} ordered to ${p.name}.`);renderAll();
}

function adjacentProvince(fromName,toName){
  return (G.adjacency?.[fromName]||[]).includes(toName);
}
function aiTick(){
  Object.entries(G.ai||{}).forEach(([id,ai])=>{
    const nation=G.diplomacy[id]; if(!nation)return;
    const armies=G.armies.filter(a=>a.owner===id);
    if(ai.focus==="military"){
      armies.forEach(a=>{
        const targets=G.provinces.filter(p=>p.owner===G.player && adjacentProvince(a.province,p.name));
        if(targets.length && ai.aggression>55 && nation.war){
          const t=targets[Math.floor(Math.random()*targets.length)];
          a.order={type:"attack",target:t.id,days:2};
        }
      });
    }
    if(ai.focus==="trade" && nation.relation<30) nation.relation+=0.25;
    if(ai.focus==="industry") G.ai[id].aggression=Math.max(15,ai.aggression-0.02);
    if(nation.war && ai.aggression>70 && Math.random()<0.015){
      addNews("Foreign Mobilization",`${nationName(id)} has intensified its military mobilization.`);
    }
  });
}
function combatScore(armyId,enemyId){
  const own=(G.divisions||[]).filter(d=>d.army===armyId);
  const enemy=(G.divisions||[]).filter(d=>d.army===enemyId);
  const score=list=>list.reduce((sum,d)=>{
    const t=G.divisionTemplates.find(x=>x.id===d.template)||{};
    return sum + (t.softAttack||10)*(d.equipment/100)*(d.org/100)*(d.morale/100);
  },0);
  return score(own)-score(enemy);
}
function warTick(){
  G.armies.forEach(a=>{
    if(!a.order)return;
    const target=provinceById(a.order.target);
    if(!target){a.order=null;return}
    if(!adjacentProvince(a.province,target.name) && a.province!==target.name){a.order=null;return}
    a.order.days--;
    if(a.order.days>0)return;
    if(target.owner!==a.owner){
      const allowed = a.owner===G.player ? !!G.diplomacy[target.owner]?.war : (target.owner===G.player ? !!G.diplomacy[a.owner]?.war : false);
      if(!allowed){a.order=null;return}
    }
    const enemy=G.armies.find(x=>x.province===target.name&&x.owner!==a.owner&&G.diplomacy[x.owner]?.war);
    if(enemy){
      const score=combatScore(a.id,enemy.id)+(G.airWings.filter(w=>w.owner===G.player&&w.mission==="ground_attack"&&w.base===a.province).length*8);
      if(score>0){
        target.owner=a.owner;a.province=target.name;
        a.organization=clamp(a.organization-10);a.strength=clamp(a.strength-3);
        enemy.organization=clamp(enemy.organization-20);enemy.strength=clamp(enemy.strength-10);
        addNews("Battle Won",`${a.name} captured ${target.name}.`);
      }else{
        a.organization=clamp(a.organization-16);a.strength=clamp(a.strength-6);
        enemy.organization=clamp(enemy.organization-7);
        addNews("Battle Repulsed",`${a.name} was repulsed at ${target.name}.`);
      }
    }else{
      target.owner=a.owner;a.province=target.name;a.organization=clamp(a.organization-6);
      addNews("Advance",`${a.name} advanced into ${target.name}.`);
    }
    a.order=null;
  });
  ensurePeaceAfterCollapse();
}
function ensurePeaceAfterCollapse(){
  G.wars=G.wars.filter(w=>G.provinces.some(p=>p.owner===w.against));
  G.wars.forEach(w=>{
    if(!G.provinces.some(p=>p.owner===w.against)){
      if(G.diplomacy[w.against])G.diplomacy[w.against].war=false;
    }
  });
}

function orderSelectedArmy(targetId){
  if(G.selected?.type!=="army")return toast("Select one of your armies first.");
  issueOrder(G.selected.id,targetId,"move");
}

function divisionTick(){
  (G.divisions||[]).forEach(d=>{
    const t=G.divisionTemplates.find(x=>x.id===d.template);
    if(!t)return;
    const supplyFactor=(d.supply||0)/100;
    d.org=clamp(d.org + (supplyFactor>.7?0.35:-0.7));
    d.morale=clamp(d.morale + (G.stability>50?.05:-.08));
    if(supplyFactor<.35)d.equipment=clamp(d.equipment-.22);
  });
}
function supplyTick(){
  const nodes=G.supplyNodes||[];
  const supplyMap=new Map();
  nodes.forEach(n=>supplyMap.set(n.province,Math.min(100,n.stock+2)));
  const queue=[...nodes.map(n=>n.province)];
  const seen=new Set(queue);
  while(queue.length){
    const cur=queue.shift();
    const value=(supplyMap.get(cur)||35)*0.92;
    (G.adjacency?.[cur]||[]).forEach(next=>{
      if(!seen.has(next)){
        seen.add(next);
        supplyMap.set(next,value);
        queue.push(next);
      }else{
        supplyMap.set(next,Math.max(supplyMap.get(next)||0,value));
      }
    });
  }
  (G.divisions||[]).forEach(d=>{
    const a=G.armies.find(x=>x.id===d.army);if(!a)return;
    d.supply=clamp(supplyMap.get(a.province)||28);
    if(d.supply<35)d.org=clamp(d.org-0.8);
    if(d.supply<20)d.strength=clamp(d.strength-0.15);
  });
  G.supply.networkEfficiency=clamp(70 + G.provinces.filter(p=>p.owner===G.player).reduce((n,p)=>n+p.infrastructure,0)/Math.max(1,G.provinces.length));
  G.supply.nationalStock=Math.max(0,G.supply.nationalStock + G.factories*.02 - G.divisions.length*.04);
}

function createDivisionFromTemplate(templateId, armyId){
  const t=G.divisionTemplates.find(x=>x.id===templateId),a=G.armies.find(x=>x.id===armyId);
  if(!t||!a||G.manpower<50)return toast("Not enough manpower.");
  G.manpower-=50;
  const id="D"+Math.floor(Math.random()*90000+10000);
  G.divisions.push({id,army:armyId,template:templateId,name:`New ${t.name}`,strength:60,org:60,equipment:45,supply:100,morale:70});
  addNews("Division Raised",`${t.name} has been organized under ${a.name}.`);
  renderAll();
}
function deployDivision(divId,provinceName){
  const d=G.divisions.find(x=>x.id===divId),p=provinceByName(provinceName);
  if(!d||!p||p.owner!==G.player)return toast("That deployment is not possible.");
  const a=G.armies.find(x=>x.id===d.army);
  if(!a)return;
  a.province=provinceName;addNews("Division Redeployed",`${d.name} is now operating from ${provinceName}.`);renderAll();
}

function airTick(){
  (G.airWings||[]).forEach(w=>{
    w.readiness=clamp(w.readiness + (w.mission==="air_superiority"?0.12:0.06));
    if(w.owner===G.player && w.targetProvince){
      const target=provinceByName(w.targetProvince);
      if(target && target.owner!==G.player && G.diplomacy[target.owner]?.war){
        w.aircraft=Math.max(0,w.aircraft-0.03);
        if(w.mission==="ground_attack"){
          const hostile=G.armies.filter(a=>a.owner===target.owner && a.province===w.targetProvince);
          hostile.forEach(a=>a.organization=clamp(a.organization-0.15));
        }
      }
    }
  });
}
function navalTick(){
  (G.fleets||[]).forEach(f=>{f.readiness=clamp(f.readiness+0.05)});
  const zones=G.seaZones||[];
  zones.forEach(z=>{
    const fleets=G.fleets.filter(f=>f.zone===z.id);
    if(!fleets.length)return;
    const allied=fleets.filter(f=>f.owner===G.player).reduce((a,f)=>a+f.ships*f.readiness/100,0);
    const foreign=fleets.filter(f=>f.owner!==G.player).reduce((a,f)=>a+f.ships*f.readiness/100,0);
    if(allied>foreign*1.15)z.control=G.player;
    else if(foreign>allied*1.15)z.control="FOREIGN";
  });
}
function setAirMission(id,mission,province){
  const w=G.airWings.find(x=>x.id===id);if(!w)return;
  w.mission=mission;w.targetProvince=province||null;
  addNews("Air Order Issued",`${w.name} assigned ${mission.replaceAll("_"," ")} over ${province||"its home zone"}.`);renderAll();
}
function moveFleet(id,zoneId){
  const f=G.fleets.find(x=>x.id===id),z=G.seaZones.find(x=>x.id===zoneId);
  if(!f||!z)return;
  f.zone=zoneId;addNews("Fleet Redeployed",`${f.name} redeployed to ${z.name}.`);renderAll();
}
