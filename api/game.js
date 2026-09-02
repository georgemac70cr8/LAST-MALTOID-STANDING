const TEAMS = [
  "AFC Bournemouth","Arsenal","Aston Villa","Brentford","Brighton & Hove Albion",
  "Chelsea","Coventry City","Crystal Palace","Everton","Fulham","Hull City",
  "Ipswich Town","Leeds United","Liverpool","Manchester City","Manchester United",
  "Newcastle United","Nottingham Forest","Sunderland","Tottenham Hotspur"
];
const initial = [
  ["DAMO", true,  [["Arsenal","win"],["Manchester United","win"]]],
  ["DAVE", false, [["Liverpool","loss"]]],
  ["GEORGE", false, [["Arsenal","win"],["Brentford","draw"]]],
  ["JOYCEY", true, [["Manchester City","win"],["Manchester United","win"]]],
  ["MARK", false, [["Nottingham Forest","loss"]]],
  ["MAU", true, [["Arsenal","win"],["Manchester United","win"]]],
  ["MURPH", true, [["Arsenal","win"],["Manchester United","win"]]],
  ["RYAN", false, [["Arsenal","win"],["Liverpool","draw"]]],
  ["STEVE", true, [["Manchester City","win"],["Manchester United","win"]]]
];
function seed(){return {round:3,winner:null,players:initial.map(([name,alive,h])=>({name,alive,history:h.map((x,i)=>({round:i+1,team:x[0],result:x[1]}))})),currentPicks:{},history:[{round:1,results:initial.map(([name,,h])=>({player:name,team:h[0][0],result:h[0][1]}))},{round:2,results:initial.filter(x=>x[2].length>1).map(([name,,h])=>({player:name,team:h[1][0],result:h[1][1]}))}]};}
function cfg(){if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SECRET_KEY)throw new Error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_SECRET_KEY in Vercel Project Settings → Environment Variables, then redeploy.");return {url:process.env.SUPABASE_URL.replace(/\/$/,""),key:process.env.SUPABASE_SECRET_KEY};}
async function sb(path,options={}){const c=cfg();const r=await fetch(c.url+"/rest/v1/"+path,{...options,headers:{apikey:c.key,Authorization:"Bearer "+c.key,"Content-Type":"application/json",Prefer:"return=representation",...(options.headers||{})}});const text=await r.text();if(!r.ok)throw new Error(`Supabase error ${r.status}: ${text}`);return text?JSON.parse(text):null;}
async function load(){const rows=await sb("game_state?id=eq.1&select=data");if(rows&&rows[0])return rows[0].data;const data=seed();await sb("game_state",{method:"POST",body:JSON.stringify({id:1,data:data})});return data;}
async function save(state){await sb("game_state?id=eq.1",{method:"PATCH",body:JSON.stringify({data:state})});}
function out(status,data){return {statusCode:status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"},body:JSON.stringify(data)};}
module.exports=async function handler(req,res){try{let s=await load();if(req.method==="GET")return res.status(200).json(s);if(req.method!=="POST")return res.status(405).json({error:"Method not allowed."});const body=typeof req.body==='string'?JSON.parse(req.body||"{}"):req.body||{};
if(body.action==="pick"){const p=s.players.find(x=>x.name.toLowerCase()===String(body.player).toLowerCase());if(!p||!p.alive)throw new Error("Player is not active.");if(!TEAMS.includes(body.team))throw new Error("Invalid Premier League team.");if(p.history.some(h=>h.team===body.team))throw new Error("You have already used that team.");s.currentPicks[p.name]=body.team;}
else if(body.action==="resolve"){const active=s.players.filter(p=>p.alive);if(active.some(p=>!s.currentPicks[p.name]))throw new Error("Every active player must make a selection.");const results=active.map(p=>({player:p.name,team:s.currentPicks[p.name],result:body.results?.[p.name]}));if(results.some(x=>!["win","draw","loss"].includes(x.result)))throw new Error("Every active player needs a valid result.");results.forEach(x=>{const p=s.players.find(p=>p.name===x.player);p.history.push({round:s.round,team:x.team,result:x.result});if(x.result!=="win")p.alive=false;});s.history.push({round:s.round,results});s.currentPicks={};const alive=s.players.filter(p=>p.alive);if(alive.length===1)s.winner=alive[0].name;else if(alive.length===0)throw new Error("All players were eliminated. The round was not saved.");else s.round++;}
else throw new Error("Unknown action.");await save(s);return res.status(200).json(s);}catch(e){return res.status(400).json({error:e.message||String(e)});}};
