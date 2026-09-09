export const labels={health:'健康',intelligence:'智力',eq:'情商',happiness:'快乐',reputation:'声望',luck:'运气',network:'人脉',learning:'学习能力',professional:'职业能力',risk:'风险偏好',business:'商业意识',enterprise:'创业能力',research:'科研兴趣',gaming:'游戏天赋',sport:'体育天赋',music:'音乐天赋',acting:'表演天赋',gambling:'赌博倾向',addiction:'赌博失控风险',credit:'信用',cash:'现金',salary:'基本年薪',bonus:'奖金',debt:'负债',company:'企业资产',fans:'粉丝',study:'学习投入',familiarity:'城市熟悉度',deposit:'存款',fund:'基金',stock:'股票',venture:'创业投资',adventure:'冒险',cautious:'谨慎',frugal:'节俭',workaholic:'工作狂',independent:'独立',helpful:'热心',social:'社交型',normal:'普通',bull:'牛市',bear:'熊市',rise:'房价上涨',adjust:'房价调整',slack:'摸鱼',balanced:'正常',hard:'努力',extreme:'拼命'};
export const hobbyNames=['游戏','阅读','影视','音乐','骑行','球类','健身','综合运动','写作','表演','内容创作','说唱/音乐创作','编程','机械','科技','商业','金融','法律','社交'];
export const aspirations=['财富自由','家庭幸福','成为名人','事业成功','行业顶尖','稳定生活','自由生活','做喜欢的事情','帮助别人','暂时没有明确目标'];
export const clubs=[['电竞社','游戏','gaming'],['骑行社','骑行','sport'],['编程社','编程','learning'],['辩论社','法律','professional'],['商业社','商业','business'],['文学社','写作','learning'],['音乐社','音乐','music'],['说唱社','说唱/音乐创作','music'],['喜剧社','表演','acting'],['学生会','社交','network'],['球类社','球类','sport'],['内容创作社','内容创作','professional']].map(([name,hobby,ability])=>({name,hobby,ability}));
export const unitNames=['政府','事业单位','国企','外企','民营企业','小企业','家庭企业','个体经营','医院','学校','科研机构'];
export const educationNames=['学龄前','小学','初中','高中','职业教育','大学','研究生'];
export const careerName=(s,careers)=>s.retired?'已退休':s.career?careers.find(c=>c.id===s.career)?.name??'待业':s.age<18?'学生':'待业';
export const money=n=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:0}).format(Math.round(n))+'元';
export const number=n=>Number.isFinite(n)?Math.round(n*10)/10:0;
