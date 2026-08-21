
"use strict";

const SAVE_KEY = "ardenia_grand_strategy_v1";
const VERSION = "0.4.0";

const NATIONS = {
  ARD:{name:"Ardenia",color:"#a8894d",capital:"Aurelia",pop:100000000,ideology:"Imperial Constitutionalism"},
  NOR:{name:"Norland",color:"#7d5b6d",capital:"Noren",pop:67000000,ideology:"Parliamentary Nationalism"},
  ALB:{name:"Albion",color:"#56789c",capital:"Whitehaven",pop:52000000,ideology:"Maritime Liberalism"},
  VAL:{name:"Valoria",color:"#5f8059",capital:"Valen",pop:41000000,ideology:"Republican Federalism"},
  DRA:{name:"Dravik Union",color:"#4f7774",capital:"Draz",pop:73000000,ideology:"Collectivist Unionism"},
  SUN:{name:"Sundara",color:"#aa9252",capital:"Suraj",pop:89000000,ideology:"Developmental Nationalism"},
  EST:{name:"Estavia",color:"#765f88",capital:"Estar",pop:28000000,ideology:"Constitutional Monarchism"},
  KAR:{name:"Karsovia",color:"#77736a",capital:"Karsk",pop:59000000,ideology:"Militarized Nationalism"}
};

const PROVINCES = [
  ["Aster Coast","ARD",70,70,150,100,"plains"],["Aurelia","ARD",220,80,150,110,"urban"],["Veyr","ARD",375,55,145,105,"hills"],
  ["Marais","ARD",80,190,150,115,"plains"],["Orsini","ARD",240,205,150,115,"forest"],["Meridian","ARD",400,175,145,120,"hills"],
  ["Sundar March","ARD",95,325,145,105,"desert"],["Crownlands","ARD",255,335,155,105,"plains"],["Eastmere","ARD",425,320,145,110,"forest"],
  ["High Vale","ARD",285,450,155,105,"mountains"],["Aster Border","ARD",445,445,150,105,"hills"],
  ["Norland West","NOR",615,70,150,105,"forest"],["Norland Capital","NOR",770,75,150,105,"urban"],["Norland South","NOR",610,185,150,110,"plains"],
  ["Norland East","NOR",770,195,150,110,"plains"],["Albion Coast","ALB",955,65,145,105,"coast"],["Albion North","ALB",955,180,145,105,"hills"],
  ["Valoria North","VAL",615,315,150,105,"forest"],["Valoria South","VAL",615,430,150,105,"plains"],
  ["Estavian Hills","EST",780,325,150,105,"hills"],["Estavian South","EST",780,440,150,105,"forest"],
  ["Karsovian Gate","KAR",955,315,145,105,"mountains"],["Karsovia Core","KAR",955,430,145,105,"plains"],
  ["Sundara North","SUN",70,555,150,95,"desert"],["Sundara Coast","SUN",230,560,155,90,"coast"],
  ["Dravik West","DRA",395,565,150,90,"plains"],["Dravik East","DRA",555,565,150,90,"forest"],
];

function makeState(){
  const provinces = PROVINCES.map((p,i)=>({
    id:"P"+i,name:p[0],owner:p[1],x:p[2],y:p[3],w:p[4],h:p[5],terrain:p[6],
    population:Math.round((NATIONS[p[1]].pop/100000000)*1800000),
    infrastructure:40+((i*7)%45), victory:0, fort:0
  }));
  const armies=[
    {id:"A1",name:"1st Royal Army",owner:"ARD",province:"Aurelia",strength:92,organization:86,equipment:78,mobility:52,order:null},
    {id:"A2",name:"2nd Border Army",owner:"ARD",province:"Eastmere",strength:80,organization:74,equipment:68,mobility:58,order:null},
    {id:"A3",name:"3rd Western Army",owner:"ARD",province:"Marais",strength:76,organization:81,equipment:72,mobility:49,order:null},
    {id:"N1",name:"Norland I Corps",owner:"NOR",province:"Norland Capital",strength:86,organization:84,equipment:82,mobility:55,order:null},
    {id:"K1",name:"Karsovian Field Army",owner:"KAR",province:"Karsovia Core",strength:90,organization:88,equipment:89,mobility:60,order:null},
    {id:"V1",name:"Valorian Defense Army",owner:"VAL",province:"Valoria North",strength:71,organization:77,equipment:70,mobility:48,order:null}
  ];
  return {
    version:VERSION, date:{year:1936,month:1,day:1}, paused:true, speed:1, selected:null,
    treasury:320,monthlyIncome:18,monthlyExpenses:12,warDebt:0,
    player:"ARD", treasury:320, politicalPower:85, stability:62, legitimacy:68, warSupport:34,
    manpower:1200, factories:18, civilianFactories:12, researchSlots:3,
    fuel:180, steel:90, oil:55, electronics:40,
    research:{infantry:null,industry:null,armor:null,radio:null},
    researchProgress:{infantry:0,industry:0,armor:0,radio:0},
    agenda:{id:"rebuild",name:"Rebuild the Crown",days:90,progress:0,effect:"stability"},
    diplomacy:Object.fromEntries(Object.keys(NATIONS).filter(k=>k!=="ARD").map(k=>[k,{relation:0,war:false,guarantee:false,bloc:null}])),
    wars:[],
    divisionTemplates:[
      {id:"line",name:"Line Infantry",width:24,softAttack:28,hardAttack:2,defense:42,breakthrough:12,supply:1,infantry:7,artillery:2,support:1},
      {id:"shock",name:"Shock Infantry",width:30,softAttack:39,hardAttack:4,defense:30,breakthrough:20,supply:1.3,infantry:8,artillery:4,support:2},
      {id:"motor",name:"Motor Infantry",width:24,softAttack:25,hardAttack:5,defense:34,breakthrough:25,supply:1.5,infantry:5,artillery:2,support:2},
      {id:"armor",name:"Light Armor",width:30,softAttack:34,hardAttack:22,defense:28,breakthrough:48,supply:2.1,infantry:3,artillery:2,support:2}
    ],
    divisions:[
      {id:"D1",army:"A1",template:"line",name:"12th Royal Infantry Division",strength:100,org:88,equipment:84,supply:100,morale:82},
      {id:"D2",army:"A1",template:"line",name:"18th Royal Infantry Division",strength:96,org:84,equipment:76,supply:100,morale:79},
      {id:"D3",army:"A2",template:"shock",name:"4th Border Guards",strength:91,org:72,equipment:82,supply:100,morale:76},
      {id:"D4",army:"A2",template:"motor",name:"2nd Mobile Group",strength:87,org:81,equipment:73,supply:100,morale:80},
      {id:"D5",army:"A3",template:"line",name:"7th Western Division",strength:89,org:85,equipment:78,supply:100,morale:84},
      {id:"D6",army:"N1",template:"line",name:"Norland 3rd Corps",strength:95,org:82,equipment:84,supply:100,morale:81},
      {id:"D7",army:"K1",template:"shock",name:"Karsovian 1st Guards",strength:94,org:86,equipment:91,supply:100,morale:88},
      {id:"D8",army:"V1",template:"line",name:"Valorian 6th Division",strength:83,org:75,equipment:69,supply:100,morale:77}
    ],
    supplyNodes:[
      {id:"S1",province:"Aurelia",capacity:18,stock:100},
      {id:"S2",province:"Eastmere",capacity:10,stock:100},
      {id:"S3",province:"Marais",capacity:9,stock:100},
      {id:"S4",province:"Aster Border",capacity:7,stock:100}
    ],
    supplyEdges:[
      ["Aurelia","Eastmere",18],["Aurelia","Marais",15],["Eastmere","Aster Border",10],
      ["Marais","Crownlands",12],["Crownlands","High Vale",8],["Eastmere","High Vale",8]
    ],
    supply:{nationalStock:1000,networkEfficiency:82,convoyLoss:0},

    adjacency:{
      "Aster Coast":["Aurelia","Marais","Albion Coast","Sundar March"],
      "Aurelia":["Aster Coast","Veyr","Marais","Orsini","Crownlands"],
      "Veyr":["Aurelia","Meridian","Norland West"],
      "Marais":["Aster Coast","Aurelia","Orsini","Sundar March","Crownlands"],
      "Orsini":["Aurelia","Marais","Meridian","Crownlands","Eastmere"],
      "Meridian":["Veyr","Orsini","Eastmere","Norland West"],
      "Sundar March":["Aster Coast","Marais","Crownlands","Sundara North"],
      "Crownlands":["Aurelia","Marais","Orsini","Sundar March","Eastmere","High Vale"],
      "Eastmere":["Orsini","Meridian","Crownlands","Aster Border","Estavian Hills"],
      "High Vale":["Crownlands","Aster Border"],
      "Aster Border":["High Vale","Eastmere","Valoria North"],
      "Norland West":["Veyr","Meridian","Norland Capital","Norland South"],
      "Norland Capital":["Norland West","Norland South","Norland East","Albion North"],
      "Norland South":["Norland West","Norland Capital","Valoria North"],
      "Norland East":["Norland Capital","Karsovian Gate","Estavian North"],
      "Albion Coast":["Aster Coast","Albion North"],
      "Albion North":["Albion Coast","Norland Capital"],
      "Valoria North":["Aster Border","Norland South","Valoria South","Estavian Hills"],
      "Valoria South":["Valoria North","Estavian South","Dravik West"],
      "Estavian Hills":["Eastmere","Valoria North","Estavian South","Norland East","Karsovian Gate"],
      "Estavian South":["Estavian Hills","Valoria South","Dravik West","Dravik East"],
      "Karsovian Gate":["Norland East","Estavian Hills","Karsovia Core"],
      "Karsovia Core":["Karsovian Gate","Dravik East"],
      "Sundara North":["Sundar March","Sundara Coast","Dravik West"],
      "Sundara Coast":["Sundara North","Dravik West"],
      "Dravik West":["Sundara North","Sundara Coast","Valoria South","Estavian South","Dravik East","Tavarian West"],
      "Dravik East":["Dravik West","Estavian South","Karsovia Core","Tavarian East"],
      "Tavarian West":["Dravik West","Tavarian East"],
      "Tavarian East":["Tavarian West","Dravik East","Karsovia Core"]
    },
    airWings:[
      {id:"W1",name:"1st Imperial Fighter Wing",owner:"ARD",base:"Aurelia",aircraft:72,readiness:89,mission:"air_superiority",target:null},
      {id:"W2",name:"2nd Close Air Wing",owner:"ARD",base:"Eastmere",aircraft:54,readiness:81,mission:"ground_attack",target:null},
      {id:"W3",name:"Norland Air Corps",owner:"NOR",base:"Norland Capital",aircraft:68,readiness:84,mission:"air_superiority",target:null},
      {id:"W4",name:"Karsovian Air Group",owner:"KAR",base:"Karsovia Core",aircraft:61,readiness:91,mission:"ground_attack",target:null}
    ],
    airZones:[
      {id:"AZ1",name:"Central Theater",provinces:["Aurelia","Veyr","Aster Border","Eastmere","Meridian"]},
      {id:"AZ2",name:"Northern Theater",provinces:["Norland West","Norland Capital","Norland South","Norland East"]},
      {id:"AZ3",name:"Southern Theater",provinces:["Marais","Sundar March","Sundara North","Sundara Coast"]},
      {id:"AZ4",name:"Eastern Theater",provinces:["Orsini","Estavian Hills","Estavian South","Karsovian Gate","Karsovia Core","Dravik East"]}
    ],
    seaZones:[
      {id:"SZ1",name:"Ardenian Sea",control:"ARD",navalPower:72},
      {id:"SZ2",name:"Northern Strait",control:"NEUTRAL",navalPower:36},
      {id:"SZ3",name:"Meridian Gulf",control:"ALB",navalPower:58},
      {id:"SZ4",name:"Southern Ocean",control:"NEUTRAL",navalPower:41}
    ],
    fleets:[
      {id:"F1",name:"Imperial 1st Fleet",owner:"ARD",zone:"SZ1",ships:24,readiness:83,mission:"patrol"},
      {id:"F2",name:"Imperial 2nd Fleet",owner:"ARD",zone:"SZ4",ships:12,readiness:69,mission:"patrol"},
      {id:"F3",name:"Albion Home Fleet",owner:"ALB",zone:"SZ3",ships:37,readiness:88,mission:"patrol"},
      {id:"F4",name:"Norland Flotilla",owner:"NOR",zone:"SZ2",ships:18,readiness:75,mission:"strike"}
    ],
    generals:[
      {id:"GEN1",name:"General Viktor Rane",rank:"Field Marshal",skill:4,attack:3,defense:4,logistics:3,army:"A1"},
      {id:"GEN2",name:"General Helena Voss",rank:"General",skill:3,attack:3,defense:2,logistics:4,army:"A2"},
      {id:"GEN3",name:"General Lucien Arendt",rank:"General",skill:3,attack:2,defense:4,logistics:2,army:"A3"},
      {id:"GEN4",name:"General Tomas Vale",rank:"General",skill:2,attack:2,defense:3,logistics:2,army:null}
    ],
    fronts:[],
    dragMode:"select",
    resourceNodes:[
      {province:"Veyr",resource:"steel",amount:35},
      {province:"Orsini",resource:"steel",amount:24},
      {province:"Eastmere",resource:"oil",amount:12},
      {province:"Sundar March",resource:"oil",amount:18},
      {province:"Meridian",resource:"electronics",amount:10},
      {province:"Asteria District",resource:"rubber",amount:6}
    ],
    resourceStock:{steel:90,oil:55,electronics:40,rubber:20},
    economy:{taxRate:18,tradeIncome:4,adminCost:2,industrialOutput:1,construction:1},
    strategicHq:{location:"Aurelia",capacity:4},
    ai:{
      NOR:{focus:"military",aggression:62,target:"ARD"},
      ALB:{focus:"trade",aggression:28,target:null},
      VAL:{focus:"defense",aggression:24,target:null},
      DRA:{focus:"industry",aggression:48,target:"KAR"},
      SUN:{focus:"industry",aggression:35,target:null},
      EST:{focus:"diplomacy",aggression:20,target:null},
      KAR:{focus:"military",aggression:74,target:"ARD"}
    },
    worldRules:{fogOfWar:false,ironman:false},
    provinces,armies,
    production:[
      {id:"rifle",name:"Service Rifles",type:"equipment",assigned:6,stock:120,output:5},
      {id:"support",name:"Support Equipment",type:"equipment",assigned:3,stock:65,output:2},
      {id:"truck",name:"Transport Vehicles",type:"equipment",assigned:2,stock:42,output:1},
      {id:"artillery",name:"Field Artillery",type:"equipment",assigned:3,stock:30,output:1},
      {id:"tank",name:"Light Armor",type:"equipment",assigned:2,stock:12,output:0}
    ],
    technologies:{
      infantry:[
        {id:"inf_weapons",name:"Modern Infantry Arms",cost:120,done:false,desc:"Improves infantry equipment output."},
        {id:"inf_training",name:"Professional Training",cost:150,done:false,desc:"Improves army organization."},
        {id:"motor_inf",name:"Motorized Logistics",cost:190,done:false,desc:"Improves movement and supply."}
      ],
      industry:[
        {id:"machine_tools",name:"Precision Machine Tools",cost:110,done:false,desc:"Improves factory output."},
        {id:"construction",name:"Standardized Construction",cost:140,done:false,desc:"Improves infrastructure construction."}
      ],
      armor:[
        {id:"armor_design",name:"Protected Vehicle Design",cost:180,done:false,desc:"Unlocks stronger armored formations."},
        {id:"anti_armor",name:"Anti-Armor Doctrine",cost:170,done:false,desc:"Improves defensive combat."}
      ],
      radio:[
        {id:"signals",name:"Signals Network",cost:130,done:false,desc:"Improves coordination and command."},
        {id:"recon",name:"Reconnaissance Corps",cost:160,done:false,desc:"Improves attack planning."}
      ]
    },
    laws:[
      {id:"conscription",name:"Expanded Service",cost:80,desc:"+300 manpower, -2 stability."},
      {id:"industry",name:"Emergency Industry Act",cost:100,desc:"+4 factories, -4 stability."},
      {id:"war_economy",name:"War Production Charter",cost:130,desc:"+6 military factories, -8 stability."}
    ],
    news:[
      {date:"1 Jan 1936",title:"The Crown Announces a National Reconstruction Program",body:"The government pledges to rebuild the armed forces and restore confidence after the civil war."}
    ],
    log:["Campaign established."]
  };
}

let G = makeState();
ensureStateIntegrity();

function clamp(v,a=0,b=100){return Math.max(a,Math.min(b,Number(v)||0))}
function nationName(id){return NATIONS[id]?.name||id}
function provinceById(id){return G.provinces.find(p=>p.id===id)}
function provinceByName(name){return G.provinces.find(p=>p.name===name)}
function playerProvinces(){return G.provinces.filter(p=>p.owner===G.player)}
function addNews(title,body){
  G.news.unshift({date:`${G.date.day} ${G.date.month}/${G.date.year}`,title,body});
  G.news=G.news.slice(0,40);
  G.log.unshift(`${title}: ${body}`);
  G.log=G.log.slice(0,100);
}

function ensureStateIntegrity(){
  G.version=VERSION;
  G.diplomacy ||= {};
  G.wars ||= [];
  G.armies ||= [];
  G.divisions ||= [];
  G.airWings ||= [];
  G.fleets ||= [];
  G.generals ||= [];
  G.fronts ||= [];
  G.supply ||= {nationalStock:1000,networkEfficiency:75,convoyLoss:0};
  G.resourceStock ||= {steel:0,oil:0,electronics:0,rubber:0};
  G.ai ||= {};
  G.worldRules ||= {fogOfWar:false,ironman:false};
  G.economy ||= {taxRate:18,tradeIncome:4,adminCost:2,industrialOutput:1,construction:1};
  G.economy.taxRate=Number.isFinite(G.economy.taxRate)?G.economy.taxRate:18;
  G.economy.tradeIncome=Number.isFinite(G.economy.tradeIncome)?G.economy.tradeIncome:4;
  G.economy.adminCost=Number.isFinite(G.economy.adminCost)?G.economy.adminCost:2;
  G.frontSelection ||= [];
  G.production ||= [];
  G.research ||= {infantry:null,industry:null,armor:null,radio:null};
  G.researchProgress ||= {infantry:0,industry:0,armor:0,radio:0};
  G.provinces.forEach(p=>{
    p.infrastructure=clamp(p.infrastructure);
    p.fort=Number.isFinite(p.fort)?p.fort:0;
    p.victory=Number.isFinite(p.victory)?p.victory:0;
  });
  G.armies.forEach(a=>{
    a.strength=clamp(a.strength);a.organization=clamp(a.organization);
    a.equipment=clamp(a.equipment);a.mobility=clamp(a.mobility);
    a.order ??= null;
    a.general ??= null;
    a.fuelUse ??= 0.15;
  });
  G.divisions.forEach(d=>{
    d.strength=clamp(d.strength);d.org=clamp(d.org);d.equipment=clamp(d.equipment);
    d.supply=clamp(d.supply);d.morale=clamp(d.morale);
  });
  return G;
}

function saveGame(silent=false){
  ensureStateIntegrity();
  localStorage.setItem(SAVE_KEY,JSON.stringify(G));
  if(!silent) toast("Campaign saved.");
}
function loadGame(){
  try{const x=JSON.parse(localStorage.getItem(SAVE_KEY));if(!x?.provinces)throw new Error("bad");G=x;ensureStateIntegrity();renderAll();toast("Campaign loaded.");}
  catch(e){toast("No valid campaign save found.");}
}
function exportGame(){
  const blob=new Blob([JSON.stringify(G,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="ardenia-campaign.json";a.click();URL.revokeObjectURL(a.href);
}
function importGame(file){
  if(!file)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x?.provinces)throw 0;G=x;ensureStateIntegrity();saveGame(true);renderAll();toast("Campaign imported.");}catch(e){toast("Invalid Ardenia save.");}};r.readAsText(file);
}
