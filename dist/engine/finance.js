import {cityById} from '../data/cities.js';
export const netWorth=s=>s.cash+s.company+Object.values(s.investments).reduce((a,b)=>a+b,0)+s.properties.reduce((a,p)=>a+p.value-p.loan,0)-s.debt;
export const totalDebt=s=>s.debt+s.properties.reduce((a,p)=>a+p.loan,0);
export const home=s=>s.properties.find(p=>p.city===s.city&&!p.rented);
export const salaryFor=(s,c)=>c.id==='founder'?s.salary:Math.round(c.baseSalary*cityById(s.city).wage*(1+s.careerLevel*.55));
export function annualFinance(s){
 const city=cityById(s.city),adult=s.age>=18,student=s.education>=4&&s.age<22&&!s.career;
 const salary=s.retired?Math.round(s.salary*.38):s.salary;
 const bonus=s.career&&!s.retired?Math.round(s.salary*({slack:.02,balanced:.08,hard:.15,extreme:.23}[s.effort])):0;
 const side=s.sideJob?Math.round(s.sideJob.income):0;
 const rental=s.properties.filter(p=>p.rented).reduce((a,p)=>a+Math.round(p.value*.02),0);
 const family=adult?s.children.filter(c=>c.age<22).length*12000+(s.partner&&['已婚','再婚'].includes(s.relationshipStatus)?city.cost*.4:0):0;
 const support=student?Math.min(25000,s.parents.filter(p=>p.alive).reduce((a,p)=>a+p.income*.12,0)):0;
 const living=adult?city.cost*(student?.65:1)*(s.personality.frugal>=15?.88:1):0;
 const rent=adult&&!home(s)?city.rent*(student?.25:1):0;
 let mortgage=0;const effects=[];
 s.properties.forEach((p,i)=>{const principal=Math.min(p.loan,p.annualPrincipal);mortgage+=principal+p.loan*.035;effects.push({type:'set',path:`properties.${i}.loan`,value:p.loan-principal});const rate={normal:.005,rise:.04,adjust:-.04}[s.world.housing];effects.push({type:'set',path:`properties.${i}.value`,value:Math.round(p.value*(1+rate))});});
 const rates={deposit:.015,fund:{normal:.03,bull:.14,bear:-.12}[s.world.market],stock:{normal:.02,bull:.25,bear:-.23}[s.world.market],venture:0};
 let investmentChange=0;for(const [k,v] of Object.entries(s.investments)){const d=Math.round(v*rates[k]);investmentChange+=d;effects.push({type:'add',path:'investments.'+k,value:d});}
 const partnerIncome=s.partner&&s.partner.city===s.city&&['已婚','再婚'].includes(s.relationshipStatus)?s.partner.income*.3:0;
 const income=Math.round(salary+bonus+side+rental+support+partnerIncome),debtInterest=Math.round(s.debt*.06),spending=Math.round(living+rent+family+mortgage+debtInterest),change=income-spending;
 effects.push({type:'cash',value:change},{type:'set',path:'bonus',value:bonus},{type:'add',path:'totals.income',value:income});
 return {effects,summary:{income,living:Math.round(living),rent:Math.round(rent),family:Math.round(family),mortgage:Math.round(mortgage),debtInterest,investmentChange,change}};
}
