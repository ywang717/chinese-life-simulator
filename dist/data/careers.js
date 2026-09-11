import {cities} from './cities.js';
const rows=[
['programmer','程序员','科技','编程','learning',5,85000,'开发实习生|初级开发|中级开发|高级开发|技术负责人|技术总监',['product','game'],'软件',.01],
['product','产品经理','科技','科技','professional',5,80000,'产品助理|产品经理|高级产品经理|产品负责人|产品总监|业务负责人',['game','sales'],'通用',.01],
['game','游戏策划','游戏','游戏','professional',4,70000,'策划助理|系统策划|高级策划|主策划|制作人|工作室负责人',['product','creator','founder'],'通用',.018],
['sales','销售','商业','社交','business',2,48000,'销售新人|销售专员|客户经理|销售主管|区域经理|销售总监',['insurance','ecommerce','founder'],'通用',.015],
['insurance','保险销售/保险经纪人','商业','金融','network',3,45000,'新人|客户经理|高级顾问|团队主管|区域经理|独立经纪人',['sales','creator'],'通用',.015],
['ecommerce','电商从业者','电商','商业','business',3,58000,'运营助理|运营专员|高级运营|运营主管|运营总监|业务负责人',['sales','creator','founder'],'通用',.015],
['finance','金融从业者','金融','金融','professional',5,90000,'分析助理|分析师|项目经理|高级经理|业务总监|合伙人',['bank','creator'],'金融',.02],
['bank','银行员工','银行','金融','professional',5,72000,'柜员|客户经理|业务骨干|部门主管|支行负责人|区域负责人',['insurance','creator','sales'],'通用',.01],
['civil','公务员','公务体系','阅读','learning',5,65000,'试用人员|科员|业务骨干|部门副职|部门正职|资深管理人员',['teacher'],'通用',.005],
['teacher','教师','教育','阅读','learning',5,62000,'见习教师|教师|骨干教师|学科带头人|高级教师|教研负责人',['creator'],'教育',.006],
['doctor','医生','医疗','科技','learning',5,78000,'规培医生|住院医师|主治医师|副主任医师|主任医师|学科负责人',['creator'],'医学',.02],
['police','警察','公务体系','综合运动','professional',4,68000,'见习警员|警员|业务骨干|警组负责人|中层负责人|资深负责人',['civil'],'警务',.03],
['lawyer','律师','法律','法律','professional',5,65000,'实习律师|执业律师|主办律师|高级律师|合伙人',['creator','founder'],'法律',.012],
['shipyard','船厂工人','制造','机械','professional',2,55000,'学徒|初级技工|中级技工|高级技工|班组长|车间主管',['sales','founder'],'通用',.04],
['media','自媒体','内容创作','写作','professional',2,35000,'写作新人|独立作者|专栏作者|知名作者|主编|个人品牌',['creator','founder'],'通用',.018],
['creator','网红/内容创作者','内容创作','内容创作','acting',2,30000,'普通创作者|小网红|垂类达人|头部达人|知名网红|个人品牌',['media','founder'],'通用',.02],
['rapper','说唱歌手','说唱','说唱/音乐创作','music',2,26000,'爱好者|地下演出|独立歌手|小有名气|签约艺人|知名歌手',['creator','media'],'通用',.025],
['comedian','脱口秀艺人','娱乐','表演','acting',2,26000,'开放麦新人|常驻演员|小有名气|专场演员|节目艺人|头部艺人',['creator','media'],'通用',.02],
['esports','电竞职业选手','电竞','游戏','gaming',2,40000,'青训|替补|主力|明星|顶级',['game','creator'],'通用',.03],
['cyclist','自行车运动员','竞技','骑行','sport',2,38000,'青年车手|职业新人|主力|核心|明星',['creator','sales'],'通用',.045],
['founder','创业者','商业','商业','enterprise',2,0,'筹备创业|小规模经营|稳定盈利|快速增长|大成功',['sales','ecommerce'],'通用',.04]
];
export const careers=rows.map(([id,name,industry,hobby,ability,education,baseSalary,levels,transitions,major,risk])=>({id,name,industry,hobby,ability,entry:{education,major,minCredit:['bank','finance','civil'].includes(id)?50:0,minAge:18,maxAge:id==='esports'?23:id==='cyclist'?25:65,qualification:['doctor','teacher','lawyer','police','civil'].includes(id)?id:null},levels:levels.split('|'),incomeRange:[baseSalary,baseSalary*5],baseSalary,promotion:{experience:2,ability:55,increment:10},failure:{abilityLoss:5,levelLoss:1},transitions,cityWeights:Object.fromEntries(cities.map(c=>[c.id,c.careerWeights[id]??1])),exclusiveEvents:[id+'_work',...({shipyard:['ship_injury','injury_transition'],game:['game_hit','game_cancel'],esports:['esports_trial','sport_retirement','champion'],cyclist:['cycling_trial','sports_injury','champion'],rapper:['viral'],comedian:['viral'],creator:['viral'],founder:['startup_result']}[id]??['career_controversy'])],risk,exitRoutes:transitions}));
export const careerById=id=>careers.find(c=>c.id===id);
export function eligible(s,c){const e=c.entry;return !s.retired&&s.hidden.credit>=e.minCredit&&s.age>=e.minAge&&s.age<=e.maxAge&&s.education>=e.education&&(e.major==='通用'||s.major===e.major)&&( !e.qualification||s.qualifications.includes(e.qualification))&&(!['esports','cyclist'].includes(c.id)||(s.hidden[c.ability]>=70&&s.hobbies[c.hobby]>=55&&s.stats.health>45&&s.tags.includes(c.id==='esports'?'竞技经历':'骑行赛事经历')))&&(!['rapper','comedian','creator','media'].includes(c.id)||s.hobbies[c.hobby]>=45)&&(c.id!=='founder'||s.cash>=60000);}
export function availableCareers(s){return careers.filter(c=>eligible(s,c));}
