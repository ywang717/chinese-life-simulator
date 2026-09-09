export const hashSeed=seed=>{let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
export function draw(rng){const next=(Math.imul(1664525,rng)+1013904223)>>>0;return {rng:next,value:next/4294967296};}
export const probability=(score,center=55,scale=55)=>Math.min(.96,Math.max(.04,.5+Math.atan((score-center)/scale)/Math.PI*.88));
export const weighted=(items,r)=>{let total=items.reduce((a,x)=>a+x.weight,0);let n=r*total;for(const x of items){n-=x.weight;if(n<0)return x;}return items.at(-1);};

export function generateSeed(cryptoApi=globalThis.crypto){return Array.from(cryptoApi.getRandomValues(new Uint32Array(4)),n=>n.toString(16)).join("-");}
