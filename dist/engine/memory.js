// Only called by EffectEngine; persistent consequences have one owner.
export function remember(s,e,source){
 const entry={age:s.age,year:s.birthYear+s.age,source,type:e.type,...structuredClone(e)};
 if(e.type==='tag'){if(e.remove)s.tags=s.tags.filter(t=>t!==e.key);else if(!s.tags.includes(e.key))s.tags.push(e.key);}
 if(e.type==='count')s.counts[e.key]=(s.counts[e.key]??0)+e.value;
 if(e.type==='schedule'){const age=s.age+e.after;if(!s.scheduled.some(x=>x.eventId===e.eventId&&x.age===age))s.scheduled.push({eventId:e.eventId,age,source,priority:e.priority??10,ignoreAge:!!e.ignoreAge,scope:e.eventId==='startup_result'?s.counts.startups:null});}
 if(e.type==='social')s.socialHistory.push({age:s.age,kind:e.kind,text:e.text});
 if(e.type==='npc'){
  let npc=s.npcs.find(n=>n.id===e.id);if(!npc){npc={id:e.id,name:e.name??'张伟',role:e.role??'朋友',age:s.age,city:s.city,career:null,wealth:1,personality:'热心',relationship:50,trust:50,experiences:[],alive:true,...e.data};s.npcs.push(npc);}
  npc.relationship+=e.value??0;npc.trust+=e.trust??0;npc.experiences.push({age:s.age,text:source});npc.distance=npc.city===s.city?'同城':'异地';
 }
 s.memories.push(entry);
}
export const memoryTypes=new Set(['tag','count','schedule','social','npc','memory']);
