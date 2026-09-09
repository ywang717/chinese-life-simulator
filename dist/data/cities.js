const rows=[
['beijing','北京',1.55,42000,4800000,1.4,['公务体系','科技','金融','教育'],['civil','programmer','finance','teacher'],['阅读','科技','法律'],'平台与教育资源丰富，机会密集，竞争和生活开支也高。'],
['shanghai','上海',1.6,44000,5000000,1.3,['金融','银行','外企','品牌'],['bank','finance','lawyer','insurance'],['金融','商业','音乐'],'商业和金融机会多。高房价让安家成为一项长期决定。'],
['shenzhen','深圳',1.5,37000,4200000,1.15,['科技','电商','销售','电子制造'],['programmer','ecommerce','sales','founder'],['编程','商业','科技'],'新行业和流动人口带来机会，节奏快，也需要留意身体。'],
['hangzhou','杭州',1.35,32000,3000000,1.2,['互联网','电商','游戏','直播'],['game','ecommerce','creator','programmer'],['游戏','内容创作','编程'],'互联网和电商活跃，小团队也可能做出被人记住的作品。'],
['chengdu','成都',1.05,23000,1700000,1.1,['游戏','说唱','娱乐','内容创作'],['rapper','comedian','esports','creator'],['说唱/音乐创作','游戏','表演'],'演出和游戏文化活跃，生活成本较低，职业平台各有取舍。'],
['nantong','南通',1,20000,1500000,1.25,['船舶','建筑','家纺','制造'],['shipyard','sales','teacher','founder'],['机械','阅读','商业'],'学校和工厂构成许多人的日常，实业机会藏在具体的手艺里。'],
['suzhou','苏州',1.2,25000,2000000,1.15,['外企','先进制造','工程','供应链'],['shipyard','sales','programmer','founder'],['机械','科技','骑行'],'制造与供应链岗位较多，技能和行业经验有机会换来稳定生活。'],
['wenzhou','温州',1.1,25000,1900000,1.05,['民营经济','商业','制造','贸易'],['sales','founder','ecommerce','insurance'],['商业','金融','社交'],'小企业、贸易和家庭生意多，熟人提供的信息仍需要自己判断。'],
['wuhan','武汉',1.08,22000,1500000,1.35,['高校','游戏','电竞','青年创业'],['programmer','esports','game','teacher'],['游戏','编程','球类'],'校园生活丰富，年轻人聚集，毕业之后留下还是远行各有理由。'],
['hefei','合肥',1.1,22000,1600000,1.3,['科研','人工智能','新能源','工程'],['programmer','teacher','founder','shipyard'],['科技','机械','编程'],'理工和科研机会逐渐积累，硬科技往往需要耐心与长期学习。'],
['fuzhou','福州',1.08,24000,1800000,1.1,['外贸','跨境电商','侨乡','海外联系'],['ecommerce','sales','founder','bank'],['商业','社交','金融'],'贸易和跨境业务带来远方的消息，机会也伴随沟通和履约成本。'],
['changchun','长春',0.92,17000,950000,1.18,['汽车','工程','国企','科研'],['shipyard','teacher','civil','programmer'],['机械','综合运动','科技'],'汽车工业与学校支撑城市生活，冬季漫长，熟悉的人情也很温暖。'],
['zhengzhou','郑州',1,20000,1200000,1.12,['物流','商贸','电商','新能源制造'],['ecommerce','sales','founder','shipyard'],['商业','机械','社交'],'铁路、公路和仓库连接各地，商贸岗位多，家乡与远方都可能有机会。']
];
export const cities=rows.map(([id,name,wage,cost,house,education,industries,preferred,hobbies,description])=>({id,name,wage,cost,house,rent:Math.round(house*.012),education,industries,careerWeights:Object.fromEntries(preferred.map(c=>[c,3])),parentCareerWeights:Object.fromEntries(preferred.map(c=>[c,3])),hobbyWeights:Object.fromEntries(hobbies.map(h=>[h,2])),culture:industries,eventTags:[id,...industries],description}));
export const cityById=id=>cities.find(c=>c.id===id)??cities[0];
