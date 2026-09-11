import {cities} from './cities.js';
import {careers} from './careers.js';
import {hobbyNames} from './catalog.js';
const stat=(key,value)=>({type:'stat',key,value}),hobby=(key,value)=>({type:'hobby',key,value}),hidden=(key,value)=>({type:'hidden',key,value}),tag=key=>({type:'tag',key}),note=text=>({type:'note',text}),cash=value=>({type:'cash',value}),schedule=(eventId,after)=>({type:'schedule',eventId,after}),opt=(text,effects,conditions=[])=>({text,effects,conditions});
const base=(id,title,text,category,conditions=[],effects=[],extra={})=>({id,title,text,category,level:2,weight:10,cooldown:4,conditions,effects,...extra});
const choice=(id,title,text,category,conditions,options,extra={})=>base(id,title,text,category,conditions,[],{level:4,options,...extra});
const roll=(score,success,failure,offset=0)=>({type:'roll',score,success,failure,offset});
const career=id=>({type:'career',id});
const school=(level,text,major)=>({type:'education',level,text,major});
const age=(min,max=120)=>[['age','>=',min],['age','<=',max]];
const working=[['career','truthy',true],['retired','==',false]];
const cityTexts=[
['公开讲座','周末，附近高校开放了一场讲座。你坐在最后一排，听见一些从未想过的问题。散场时人很多，你记住了书单上的一个名字，打算下次去图书馆找找。','阅读'],
['街角的旧书店','沿着街道走进一家小书店，店主讲起这条街过去的样子。橱窗外的人赶着上班，你在店里翻完了一篇文章，第一次觉得这座城市也有慢下来的地方。','阅读'],
['园区开放日','周末的园区有企业开放日。你看见仓库、车间和办公室挨在一起，听工作人员解释一个产品如何卖到远方。原来平常看到的商品，背后有这么多人接力。','科技'],
['游戏展的下午','本地的小型游戏展没有想象中热闹。你在一个独立团队的摊位前坐了很久，和作者聊起关卡。离开时对方给你一张名片，说下次欢迎再来试玩。','游戏'],
['小场地里的演出','演出场地藏在巷子里，椅子不够，后排站满了人。有位新人紧张得忘了词，观众却给他鼓掌。你回去路上一直记着那几句旋律，也想试试写点东西。','说唱/音乐创作'],
['江边看新船','你在江边看到一艘新船缓缓驶过。身旁的老师傅说起焊缝和船坞，话不多，却很具体。以前觉得工厂离生活很远，现在终于看见那些手艺做成的东西。','机械'],
['工厂开放日','工厂接待参观，一条生产线几乎没有停过。技术员没有讲大话，只解释一次误差会影响多少后续工序。你开始明白，认真做好小事也可以是一种本领。','机械'],
['亲戚的铺子','亲戚的铺子要盘点，你去帮忙记账。一天里有客人讨价还价，也有人来结清旧款。老板说生意有赚有赔，不能只看今天进了多少钱。你记住了这句话。','商业'],
['校园草坪','学校开放活动，草坪上挤满了社团摊位。有人演奏，有人讨论游戏，还有人演示自己写的小程序。你跟几个学生聊到天黑，发现兴趣也能把陌生人连在一起。','编程'],
['科技展台','科技展上，一组学生展示自己做的小车。它在拐弯处卡了两次，大家蹲下来一起检查。解决问题的过程比成品更有意思，你围着展台看了很久才离开。','科技'],
['远方的包裹','亲戚寄来一箱远方的东西，还夹了一封手写的信。饭桌上聊起外贸、港口和很久没见的家人。你发现每一件货物后面，可能都有一段辗转的生活。','商业'],
['雪后的路','雪后街道很安静，邻居们拿着工具清出一条路。你也下楼帮忙，手很冷，身体却慢慢热起来。忙完一起喝了热水，比窝在家里的一天更有精神。','综合运动'],
['物流园见闻','去物流园取件时，你看见货车排成一长列。仓库里的人按城市分拣包裹，几小时之后它们又要上路。平常手机里跳动的快递信息，原来对应着这样具体的忙碌。','商业']
];
const cityEvents=cities.map((c,i)=>base('city_'+c.id,cityTexts[i][0],cityTexts[i][1],'城市',age(5),[hobby(cityTexts[i][2],3),stat('happiness',2)],{weights:[{dimension:'当前城市',path:'city',equals:c.id,add:30}],city:c.id}));
const hobbyTexts=[
'你和朋友约好一起打游戏。输掉的那局复盘了很久，赢的时候反倒没有多说什么。最开心的片刻，是大家为了同一个目标认真配合。',
'一本借来的书在床头放了很久，这周终于读完。里面有几句话让你停下来想了想。第二天出门时，你又顺手把它塞进了包里。',
'你重看了一部以前喜欢的电影。那些曾经略过的对白，如今听来有了别的意思。片尾字幕走完，你没有马上关掉屏幕。',
'你把一首曲子反复练了几遍，终于顺畅地奏完。窗外有车辆经过，你没注意时间。练习进步得很慢，却让这一天有了清楚的收获。',
'你沿着熟悉的路骑了一圈。逆风那段不轻松，过桥后速度又回来了。路边停下来喝水时，你忽然觉得不必每次都骑得比上次更快。',
'球场上临时凑齐了一队人。大家水平不同，打得却很认真。结束后你们坐在场边聊天，约了下次，有人还记得你上回的失误。',
'今天的训练没有刷新纪录，但动作比以前稳了。你把重量放回架子，慢慢做完拉伸。身体的变化不总是立刻看得见。',
'你抽空到公园活动身体。开始有点懒，出汗以后反而轻松起来。回去的路上，你给下周留出了同样的一段时间。',
'你把最近遇到的一件小事写了下来。删改几次之后，文字比原来短了不少。发给朋友看，对方说记得里面那个细节。',
'一次小排练占了整个下午。同一句台词换了几种说法，最后终于自然了一点。你发现站在别人面前，把话说清楚也需要练习。',
'你认真做了一条内容，发布后反响平平。几天后有陌生人留下一段很长的评论，说里面有个细节帮到了自己。你把那条评论看了两遍。',
'你把公交车上想到的几句词记进手机。回家配上节拍试唱，不太顺，又改了几处。成品还很粗糙，已经能听出你自己的意思。',
'困扰你几天的小程序终于运行正常。问题藏在一个很不起眼的地方。你把解决办法记下来，也明白下次遇到问题可以先从哪里找。',
'一件旧东西坏了，你拆开研究内部结构。桌上摆满零件，装回去之前差点多出一颗螺丝。虽然花了不少时间，最后它真的重新动了起来。',
'你读到一篇介绍新技术的文章，又去翻了基础资料。最初觉得神奇的东西，弄懂一点以后更加有趣。你在笔记里记下了还没明白的问题。',
'你留意起附近几家店的生意。同一条街，有人排队，也有人很清闲。和老板聊了一会儿才发现，租金、库存和回头客都不能只凭印象判断。',
'你整理了一遍自己的收支和旧账。把数字摆在一起，一些平时忽略的支出变得很清楚。看懂钱去了哪里，比猜下一次涨跌更让人踏实。',
'一场关于合同的讲座解答了你以前的疑问。你原以为几句话能说清的事，实际需要明确很多细节。回去后，你重新看了一份旧协议。',
'朋友们临时约了一顿饭。大家聊起各自的小麻烦，也分享了几件好事。没有人给出完美的答案，但说出来以后，事情好像没那么重了。'
];
const hobbyEvents=hobbyNames.map((h,i)=>base('hobby_'+i,h+'的日常',hobbyTexts[i],'爱好',[...age(6),['hobbies.'+h,'>=',10]],[hobby(h,3),stat('happiness',3),...(['骑行','球类','健身','综合运动'].includes(h)?[stat('health',2)]:[])],{hobby:h,weights:[{dimension:'爱好',path:'hobbies.'+h,scale:.18}]}));
const workTexts=[
'一次故障让团队忙到很晚。你根据日志找到问题，第二天又补上说明。没有人因此登上什么榜单，但同事知道，下次遇到问题可以来找你。',
'你跟着用户走了一遍实际流程，发现原来的方案漏掉了一处麻烦。需求文档改了几版，会议少了一次，大家终于能开始做同一件事。',
'测试反馈送来时，几处设计和想象中的不同。你把关卡重新走了一遍，删掉一个自以为聪明的设定。项目还没上线，但比上个月更像能玩的游戏。',
'一个迟迟没有回复的客户终于打来电话。你没有急着催单，先把需求重新核对了一遍。对方未必马上下单，这次沟通至少留下了继续合作的可能。',
'老客户询问保单里的细节。你花了些时间解释限制和责任，没再追加推销。对方后来介绍了一位朋友，说至少和你谈事情比较清楚。',
'订单多起来以后，退换货也跟着增加。你逐条查看原因，把产品页面里容易误解的地方改掉。销量没有马上大涨，售后电话却少了一些。',
'你复查了一份项目材料，把几处含糊的假设标出来。会上有人嫌保守，也有人认可。数字背后是具体的钱，你决定把风险写得更清楚。',
'一位老人来办理业务，材料带错了几次。你把步骤写在纸上，帮他核对。下班前他又来了一趟，这回顺利办完，还记得向你道谢。',
'一项常规工作涉及几个部门，你逐个确认了流程。事情办完没有热闹的庆祝，但来办事的人少跑了一趟，这让你觉得今天不算白忙。',
'一个平常不爱发言的学生，在课后问了你很久。你换了一种解释方法，对方终于点头。回办公室时，你把这个例子记在了备课本上。',
'交班时你又核对了一遍记录。繁忙的一天里，很少有完整的休息时间。一个康复出院的病人和你告别，你叮嘱完注意事项才想起午饭还没吃。',
'一场纠纷拖了几个小时，你耐心把双方的话听完。最后处理结果谈不上轻松，但事情没有继续升级。回到单位，你补完了当天的记录。',
'整理案卷时，你找到一份不起眼的旧材料。它没有立刻改变结果，却让证据链完整了一点。你又核对了一遍日期，才把文书交出去。',
'老师傅让你检查一段刚完成的焊缝。你蹲下来仔细看，发现一处需要返工。订单催得紧，班组还是停下来处理；有些时间不能省。',
'一篇稿件反复核实了几处事实，交稿比预计晚了一点。编辑删掉了最夸张的标题。文章发出后反响普通，但你觉得它经得起再看一遍。',
'拍摄比预想中费时，一个镜头录了很多遍。你剪掉了不必要的开场，把重点提前。数据没有立刻起飞，熟悉的观众却说这一期看得很顺。',
'小场地的音响临时出了问题，你们调整了演出顺序。轮到你时台下人不多，副歌却有人跟唱。收工以后，大家一起搬完设备才离开。',
'新段子在开放麦上没有响。你记下观众走神的位置，回去重新改了铺垫。讲完之后有人聊起自己的类似经历，你发现这段还值得再磨。',
'训练赛暴露了配合上的问题，教练把录像暂停了很多次。你们重新约定了几个信号。输掉的比分不好看，但至少知道下一轮要改什么。',
'这周公路训练以耐力和配合为主。你在侧风里练习跟车，结束后仔细检查了车胎。教练说比赛之外的这些习惯，同样决定能骑多久。',
'供应商发来新的交期，你重新排了一遍现金流。几笔订单还没回款，只能先把可推迟的支出划掉。生意没有戏剧性的变化，账要一天一天算。'
];
const workEvents=careers.map((c,i)=>base(c.id+'_work','工作中的一件小事',workTexts[i],'职业',[['career','==',c.id],['retired','==',false]],[hidden(c.ability,2),hobby(c.hobby,1),stat('reputation',1)],{weight:16,cooldown:3}));
export const events=[...cityEvents,...hobbyEvents,...workEvents,
base('small_steps','学会的新本领','你开始能独自完成一些小事。大人常常忍不住伸手帮忙，你却想再试一次。做得慢，也偶尔弄得一团糟，家里人还是认真地夸了你。','成长',age(1,5),[stat('intelligence',2),stat('eq',1)],{cooldown:0}),
base('family_dinner','家里的一顿饭','一家人难得坐在一起吃饭。有人说今天的工作，有人讲起旧邻居。你起初只是听着，后来也说了几句。生活没有因此改变很多，这个晚上却让人安心。','家庭',[],[stat('happiness',3)],{cooldown:2}),
base('school_primary','背上新书包','开学那天，你跟着父母找到教室。课桌、黑板和身边陌生的同学，都让你有些紧张。放学回来，你一口气讲了许多新鲜事，连饭都忘了好好吃。','教育',[['age','==',6]],[school(1,'进入小学'),{type:'npc',id:'classmate',name:'张伟',role:'同学',value:5}],{milestone:6}),
base('school_middle','新的课表','课程忽然多了起来，作业本也换成更厚的。你开始有自己的小秘密，不再什么都告诉父母。班里有人擅长运动，有人总在看书，你还在找自己的节奏。','教育',[['age','==',12]],[school(2,'进入初中'),stat('intelligence',3)],{milestone:12}),
choice('school_high','接下来的三年','升学前，老师和你谈了一次。继续准备高考，还是先学一门手艺，两条路都需要认真走。父母有自己的想法，但这次他们把最后决定留给了你。你想到同学，也想到自己究竟愿意把时间花在哪里。','教育',[['age','==',15]],[opt('读高中，准备高考',[school(3,'进入高中'),{type:'set',path:'study',value:2}]),opt('学一门实用技术',[school(4,'进入职业学校','机械'),hobby('机械',12)])],{milestone:15}),
choice('wish','第一次认真想将来','老师让大家写下十年后的自己。有人写得很具体，有人只写了一个地名。你拿着笔想了很久，发现自己还没有清楚的答案。不过，有几种生活让你想到时会有一点期待，也许先从那个方向走走看。','成长',[['age','==',16]],[],{milestone:16,builder:'wish'}),
choice('exam','填下志愿','考试结束后，你和家里人坐下来讨论去向。成绩之外，还要考虑专业、学费和离家的距离。外地学校意味着新的生活，留在附近也有自己的机会。这一页志愿表不能决定一辈子，但会影响你接下来遇见的人。','教育',[['age','==',18]],[],{milestone:18,builder:'education'}),
choice('club_join','社团招新','招新摊位从教学楼排到操场。有人邀请你试一场比赛，有人递来排练安排。课余时间有限，不可能什么都参加。你翻着几张报名表，想找一件自己愿意长期投入的事，顺便认识一些能聊得来的人。','教育',[['age','>=',16],['age','<=',21],['clubs.length','==',0]],[],{builder:'clubs',weight:25}),
choice('job_search','第一份工作的方向','求职消息里，有的来自公开招聘，有的来自熟人的转告。你把条件、工资和城市逐一写下来，发现自己能拿到的机会并不多。先找个地方站稳，还是继续学习再试一次，需要你自己作出决定。','职业',[...age(18,59),['career','falsy',true]],[],{builder:'jobs',weight:35,cooldown:2}),
base('graduate','最后一次走过校园','毕业前，你又走了一遍经常经过的小路。宿舍里的东西装进箱子，群里的消息开始变成租房和面试。那些曾经觉得漫长的日子，收尾时比想象中快。','教育',[['age','==',22],['education','>=',4]],[tag('毕业'),schedule('job_search',1)],{milestone:22}),
choice('study_direction','工作之外继续读书','看过几次招聘后，你意识到有些岗位需要专门的学习经历。重新读书意味着费用，也意味着几年里得少接一些活。夜里你把课程和预算放在一起，想了想自己愿不愿意为一个还不确定的机会投入这些时间。','教育',[...age(22,48),['cash','>=',15000]],[],{builder:'study',cooldown:7}),
choice('qualification','资格考试报名','报名通知发来了。你学过的专业与报考方向相符，但真正通过考试还得重新准备。白天的事情不会因此减少，复习只能挤进晚上和周末。你看着报名截止日期，决定是否给自己一次机会。','教育',[...age(22,50),['education','>=',4]],[],{builder:'qualification',cooldown:4}),
choice('work_effort','新的工作安排','工作告一段落，负责人问你下一阶段想怎么安排。有些人想多接任务，有些人希望准时回家。机会和压力往往一起到来。你也得考虑身体、家人，以及还有多少属于自己的时间。','职业',working,[opt('摸鱼',[{type:'set',path:'effort',value:'slack'},{type:'personality',key:'independent',value:4}]),opt('正常',[{type:'set',path:'effort',value:'balanced'}]),opt('努力',[{type:'set',path:'effort',value:'hard'},{type:'personality',key:'workaholic',value:5}]),opt('拼命',[{type:'set',path:'effort',value:'extreme'},{type:'personality',key:'workaholic',value:10}])],{cooldown:5}),
base('promotion','年度评议','年终评议时，负责人把你这一年的成绩和问题都谈了一遍。有些努力被看见，也有些期待落了空。你走出办公室，打算先把手头的工作做完，再想下一步。','职业',[...working,['careerYears','>=',2]],[],{builder:'promotion',cooldown:3}),
choice('external_offer','来自另一座城市的邀请','一位熟人转来外地的工作邀请。岗位和你过去的经历有关，收入看起来也有变化，但租房、通勤和搬家的开支不能不算。留下意味着熟悉的生活，出发则要重新建立日常。对方请你这周给个答复。','职业',[...working,['careerYears','>=',2]],[],{builder:'offer',cooldown:5}),
choice('layoff','部门调整','部门调整终于有了结果，你所在的方向被缩减。负责人给了补偿方案，也提到几条转岗线索。你不喜欢这种被推着走的感觉，但眼前需要先有一个安排。过去积累的本领，或许能在别的地方接着用。','职业',[...working,['age','>=',24]],[],{builder:'transition',cooldown:8,weights:[{dimension:'世界环境',path:'world.market',equals:'bear',add:20}]}),
choice('side_job','下班后的另一件事','朋友看过你平时做的东西，问你愿不愿意试着接一点小单。收入不多，也不会马上变成事业，但有人愿意为它付钱。你想起工作之外有限的时间，得决定把这个想法往前推一步，还是先留作爱好。','职业',[...working,['sideJob','falsy',true]],[],{builder:'side'}),
choice('side_fulltime','副业开始占满周末','小项目连续有了收入，消息也越来越多。你发现自己已经很难同时照顾两边。全职投入也许能走得更远，但过去的工资和稳定节奏会失去。家里人问你有没有留够生活费，你又看了一遍账户余额。','职业',[...working,['sideJob.years','>=',3],['sideJob.income','>=',24000]],[],{builder:'fulltime',cooldown:5}),
choice('house_buy','终于开始看房','你和中介看了几套房，位置、面积和价格各有不足。首付只是开头，后面还有很多年的还款。站在空客厅里，你想象过在这里生活，也算过换工作之后的压力。要不要把一部分未来固定在这座城市？','财富',[...age(23),['hidden.credit','>=',50]],[],{builder:'house',cooldown:6}),
choice('invest_choice','一笔暂时不用的钱','把必要的开支留出来以后，账户上还有一点余钱。朋友谈起最近的市场，有人赚钱，有人亏损。你知道过去的涨跌不保证以后，也不想每天盯着数字。怎么安排这笔钱，得符合自己能承受的波动。','财富',[...age(22),['cash','>=',30000]],[opt('存款，留些余地',[{type:'invest',key:'deposit'},{type:'personality',key:'cautious',value:5}]),opt('投入一部分基金',[{type:'invest',key:'fund'}]),opt('投入一部分股票',[{type:'invest',key:'stock'},{type:'personality',key:'adventure',value:5}]),opt('投资朋友的创业项目',[{type:'invest',key:'venture'},tag('创业投资经历')]),opt('先保留现金',[])],{cooldown:5}),
choice('startup','有人提议一起做生意','对方带着一份粗略的计划来找你：客户从哪里来，第一笔钱怎么花，遇到亏损怎么办。你们认识有些年头了，但熟悉不等于不会失败。你把计划带回家，又想起这些年在行业里见过的事情，决定要不要投入。','财富',[...age(24,58),['cash','>=',60000]], [opt('拿出资金，开始创业',[{type:'startup'},{type:'personality',key:'adventure',value:8}]),opt('暂时不做',[{type:'personality',key:'cautious',value:4}])],{cooldown:6,weights:[{dimension:'职业',path:'career',equals:'sales',add:20},{dimension:'职业',path:'career',equals:'ecommerce',add:20},{dimension:'爱好',path:'hobbies.商业',scale:.15}]}),
base('startup_result','生意走到了岔路口','最初的计划已经改了几次。回款、订单和团队的磨合终于显出结果，你把账本摊开，看清了这门生意目前能走多远。接下来还得面对真实的客户和开支。','财富',[['career','==','founder']],[],{scheduledOnly:true,builder:'business'}),
base('venture_result','五年后的项目消息','当年投钱的项目发来一份结算说明。你又翻出最初的聊天记录，才发现过去这么久。这几年发生的事和计划并不完全一样，现在该认真看看最后的结果了。','财富',[['investments.venture','>',0]],[],{scheduledOnly:true,builder:'venture'}),
base('old_friend','很久没联系的人','一条消息从旧同学群里跳出来。对方提起你们很多年前一起忙过的事，还记得几个你已经忘掉的细节。聊到各自现在的生活，才发现距离远了，熟悉感还在。','关系',[['npcs.length','>',0]],[],{builder:'friend',cooldown:6}),
choice('friend_business','老朋友再次来找你','你们认识已经超过十年。对方如今有了自己的团队，提议和你合作，说当年一起做事时就觉得你靠得住。那些共同经历让这次谈话不必从零开始，但项目本身仍需判断。你愿不愿意再一起试一次？','关系',[...age(28,58),['cash','>=',60000],['npcs.length','>',0]], [opt('一起创业',[{type:'startup'},{type:'npc',id:'classmate',value:15,trust:10}]),opt('继续做朋友',[stat('happiness',3)])],{builder:'oldMemory',cooldown:10}),
choice('romance','有人走近你的生活','你们已经聊过不少次，从日常小事到各自想过的生活。最近，对方开始认真问起你的安排，也告诉你自己在哪座城市工作。继续走下去可能带来陪伴，也需要时间与耐心。你决定把这段关系往前推一点吗？','家庭',[...age(20,70),['partner','falsy',true]],[opt('试着交往',[{type:'partner',action:'meet'},stat('happiness',10)]),opt('先做朋友',[{type:'npc',id:'new_friend',name:'林安宁',role:'朋友',value:10}])],{cooldown:5}),
choice('marriage','以后住在哪里','你们谈到了婚姻。除了仪式和家人的意见，更实际的问题是以后住在哪里。两个人的工作、朋友和父母不一定在同一座城市。没有一个安排能让所有事情都轻松，你们决定把各自最在意的事先说清楚。','家庭',[['relationshipStatus','==','恋爱'],['partner.relationship','>=',55]],[],{builder:'marriage',cooldown:4}),
choice('child_plan','关于孩子','你们认真聊起了孩子。抚养需要钱，也需要时间，之后的工作和生活安排可能都要变化。家人有期待，你们也有顾虑。没有谁能替你们把未来过完，这次决定应该先听听彼此真正的想法。','家庭',[...age(24,45),['relationshipStatus','in',['已婚','再婚']],['children.length','<',3]],[opt('迎接一个孩子',[{type:'child'}]),opt('暂时不生育',[{type:'personality',key:'independent',value:4}])],{cooldown:5}),
choice('marital_crisis','越来越少的交谈','最近你们总在处理事情，却很少真正聊天。一句普通的话也会变成争执，晚归和开支都是导火索。你知道矛盾已经持续了一段时间。要修补关系需要行动，分开也会影响之后的生活。','家庭',[['relationshipStatus','in',['已婚','再婚']],['partner.relationship','<',40]],[opt('减少工作，认真修补',[{type:'set',path:'effort',value:'balanced'},{type:'partner',value:25},stat('happiness',5)]),opt('结束婚姻',[{type:'partner',action:'divorce'}])],{cooldown:6}),
choice('parent_care','家里的电话','父母在电话里说一切都好，却提起去医院检查的事。你听得出他们比以前更需要照顾。回去意味着调整自己的生活，留在这里也得想办法安排支持。距离第一次变成了一个不能只靠想念解决的问题。','家庭',[...age(30,70)],[],{builder:'care',cooldown:8}),
base('illness','检查单上的提醒','身体的不舒服持续了一段时间。检查之后，医生建议进一步治疗和休息。你不得不把原来的安排往后放，认真面对身体发出的信号。忙惯了的人，停下来反而更难。','健康',[...age(25),['tags','notIncludes','严重疾病']],[stat('health',-40),stat('happiness',-12),tag('严重疾病'),schedule('treatment',1),schedule('checkup',3)],{weight:2,cooldown:15}),
choice('treatment','治疗安排','进一步检查以后，治疗方案终于明确了。费用、休息时间和家里的安排都要重新考虑。医生没有承诺一定的结果，只把几种方案讲清楚。你翻了翻账户，也和信任的人谈过，现在需要作出一个决定。','健康',[['tags','includes','严重疾病']],[opt('接受治疗，暂缓工作',[cash(-25000),{type:'set',path:'effort',value:'balanced'},roll([{path:'stats.health',weight:.6},{path:'hidden.luck',weight:.4}],[stat('health',30),note('治疗有了明显改善，仍需按时复查。')],[stat('health',5),note('病情暂时稳定，恢复还需要时间。')])]),opt('选择保守治疗',[cash(-5000),stat('health',10),tag('长期伤病')])],{scheduledOnly:true}),
base('checkup','复查的日子','又到了约好的复查时间。你比上次熟悉医院的流程，仍然会在等结果时紧张。走出诊室以后，你把下一次日期记进日历，也提醒自己不能再忽略这些小事。','健康',[['tags','includes','严重疾病']],[cash(-2000),stat('health',5)],{scheduledOnly:true}),
base('ship_injury','船坞里的意外','一次作业中，意外发生得很快。醒来后你在医院，手机里有同事和家人的留言。工作暂时停下，康复需要时间，你开始意识到以后不能再像过去那样依靠体力硬撑。','健康',[['career','==','shipyard'],['retired','==',false],['tags','notIncludes','严重工伤']],[stat('health',-60),stat('happiness',-20),cash(30000),tag('严重工伤'),tag('长期伤病'),schedule('recovery',1),schedule('injury_transition',2)],{weight:3,cooldown:30}),
base('recovery','慢慢恢复','康复动作重复了很多遍，进步不总是明显。某天你发现原来做不到的一件小事终于能完成。医生让你别急，恢复不是回到从前的日程，而是找到身体现在能承受的节奏。','健康',[],[stat('health',15),stat('happiness',5)],{scheduledOnly:true}),
choice('injury_transition','换一种方式工作','康复之后，重体力工作已经不适合继续。原来的行业经验还在，熟悉的工序和客户也没有消失。同事提起管理岗位和销售机会，其中一份工作在苏州。你得决定继续留在熟悉的环境，还是换一种方式重新开始。','职业',[['tags','includes','严重工伤']],[],{scheduledOnly:true,builder:'injury'}),
base('game_hit','游戏被人记住了','上线后的数字突然超过了大家的预期。讨论区里出现认真分析玩法的长帖，也有陌生人推荐你们的作品。忙碌并没有结束，但这一次，你终于看见过去那些改动被很多人接住。','职业',[['career','==','game'],['careerYears','>=',3],['retired','==',false]],[stat('reputation',80),cash(250000),tag('爆款游戏制作人'),{type:'social',kind:'职业荣誉',text:'参与制作爆款游戏'}],{weight:1,cooldown:12}),
choice('game_cancel','项目被取消','项目评审结束后，团队收到停止开发的通知。那些反复打磨的设计暂时没有机会与玩家见面。负责人会安排补偿，也允许大家联系别的团队。一些同行发来消息，你开始重新考虑自己的岗位和城市。','职业',[['career','==','game'],['retired','==',false]],[],{builder:'transition',weight:4,cooldown:8}),
base('viral','突然被很多人看见','你像平常一样发布作品，第二天醒来消息却多到看不完。陌生人讨论你的表达，合作邀请也一起涌来。兴奋之后是压力：被看见很快，接下来拿出什么却仍要自己完成。','职业',[['career','in',['rapper','comedian','creator','media']],['careerYears','>=',2],['retired','==',false]],[stat('reputation',120),{type:'add',path:'fans',value:1580000},cash(180000),tag('百万粉丝'),schedule('fame_pressure',2)],{weight:1,cooldown:12}),
base('fame_pressure','热度之后','最热闹的日子过去了，合作方开始问下一件作品。你发现每一句话都有人解读，也会有人失望。把注意力重新放回创作，比刷新数字更困难，但生活总要继续。','职业',[['tags','includes','百万粉丝']],[stat('happiness',-10),hidden('professional',5)],{scheduledOnly:true}),
choice('esports_trial','青训试训邀请','你在比赛里的表现被一位教练注意到。对方邀请你参加青训试训，明确说这只是一次机会，不是职业合同。训练会挤占很多时间，也可能需要搬去另一座城市。你看着邀请，想起自己认真练习过的那些晚上。','职业',[...age(18,23),['hidden.gaming','>=',70],['hobbies.游戏','>=',55],['stats.health','>',45],['tags','includes','竞技经历'],['career','!=','esports']],[opt('接受试训',[roll([{path:'hidden.gaming',weight:.6},{path:'hidden.professional',weight:.2},{path:'hidden.luck',weight:.2}],[career('esports'),{type:'migrate',city:'hangzhou',reason:'加入电竞青训'}],[stat('happiness',-5),hidden('professional',3),note('试训没有通过，你保留了教练的建议。')])]),opt('继续学业和原来的生活',[])],{weight:30,cooldown:3}),
choice('cycling_trial','公路车队的机会','参加业余赛事后，一支公路车队联系了你。他们看过成绩，也想了解你的长期训练情况。试训不只是一次冲刺，还要看耐力、配合和恢复。走这条路可能更辛苦，你需要想清楚是否愿意把爱好变成每天的工作。','职业',[...age(18,25),['hidden.sport','>=',70],['hobbies.骑行','>=',55],['stats.health','>',45],['tags','includes','骑行赛事经历'],['career','!=','cyclist']],[opt('参加试训',[roll([{path:'hidden.sport',weight:.7},{path:'stats.health',weight:.3}],[career('cyclist')],[stat('happiness',-4),note('试训未通过，还需要继续积累。')])]),opt('继续业余骑行',[hobby('骑行',5)])],{weight:25,cooldown:3}),
choice('sport_retirement','竞技生涯的下一段','身体恢复得比以前慢了，队里也来了更年轻的选手。教练和你谈到退役后的可能：继续留在行业，或者把比赛经历用在新的工作上。那些训练和比赛不会消失，但你需要为下一段生活找一个新的节奏。','职业',[['career','in',['esports','cyclist']],['age','>=',28],['retired','==',false]],[],{builder:'sportExit',weight:35,cooldown:2}),
base('champion','站上最高领奖台','漫长的赛季结束，你终于在最高级别的比赛里拿到冠军。站上领奖台时，你想到的不是一句漂亮的话，而是这些年反复做过的练习，和一路帮过你的人。','职业',[['career','in',['esports','cyclist']],['careerLevel','>=',3],['stats.health','>',50],['retired','==',false]],[stat('reputation',145),cash(600000),tag('世界冠军'),{type:'social',kind:'重大荣誉',text:'获得世界级赛事冠军'}],{weight:.4,cooldown:20}),
choice('casino','旅行中的邀请','旅行途中，同行的人提议去澳门娱乐场看看。你已达到入场年龄，但是否参与仍是自己的决定。有人把它当作短暂娱乐，也有人容易越玩越多。你想起这趟出行的预算，以及回去之后还有哪些开支要承担。','财富',[...age(21,75),['cash','>=',5000]],[opt('不参与',[{type:'personality',key:'cautious',value:4}]),opt('小额娱乐 · 低风险',[{type:'gamble',level:1}]),opt('提高下注 · 中风险',[{type:'gamble',level:2}]),opt('高风险参与 · 高风险',[{type:'gamble',level:3}])],{weight:4,cooldown:5,weights:[{dimension:'历史',path:'tags',includes:'赌博大赢记忆',add:12},{dimension:'人格',path:'personality.adventure',scale:.2}]}),
choice('gamble_chase','还在惦记那笔亏损','又一次出行邀请，让你想起上次损失的钱。你清楚自己并不是非去不可，但翻本的念头一直没有散。账户里的数字、家人的态度和工作上的疏漏都在提醒你，这件事已经不只是一次娱乐。','财富',age(21),[opt('停止',[hidden('addiction',-15),{type:'personality',key:'cautious',value:8},tag('主动停止赌博')]),opt('试图翻本 · 极高风险',[{type:'gamble',level:4}])],{scheduledOnly:true}),
choice('retirement','把工作慢慢放下','到了准备退休的年纪，你开始整理交接资料。日程里突然有了空白，既轻松也有些不习惯。以后住在熟悉的地方，回家乡，还是去生活成本更合适的城市？那些曾经被工作挤走的事情，也许可以重新安排起来。','成长',[['age','==',60]],[],{milestone:60,builder:'retirement'}),
choice('wish_change','现在更在意什么','经历过一些事情，你发现年轻时写下的愿望已经不完全适合自己。有的仍然重要，有的做到了才知道没那么需要。改变方向并不容易，但一直照着旧答案走，也未必是你想要的生活。','成长',[...age(35,80)],[],{builder:'wish',cooldown:15}),
base('quiet_year','平常的一年','这一年没有特别大的转折。你照常处理日常的事情，也遇到一些小麻烦。回头想想，几次谈话和几个普通的晚上反而留在记忆里，生活就是这样又往前走了一段。','日常',[],[stat('happiness',1)],{cooldown:0,weight:5}),
base('old_injury','旧伤又提醒了你','天气变化的时候，旧伤又有些不舒服。你已经知道哪些动作要慢一点，哪些安排该取消。很多年前那次意外并没有完全离开，只是逐渐成为你安排生活时会考虑的一部分。','健康',[['tags','includes','长期伤病']],[stat('health',-4),stat('happiness',-2)],{cooldown:5,weights:[{dimension:'长期标签',path:'tags',includes:'长期伤病',add:25}]}),
base('credit_repair','按时处理旧账','你把到期的账单逐项核对，没有再拖延。信用恢复得很慢，不会因为一次解释就回到从前。每一次按时履约都很普通，但你知道自己正在把生活重新整理好。','财富',[...age(22),['hidden.credit','<',70]],[{type:'credit',value:5}],{cooldown:3}),
base('volunteer','帮别人一把','社区需要临时帮手，你抽出时间去了。事情琐碎，有人搬东西，有人登记资料。忙完并没有特别的回报，只是有几个人认真说了谢谢，你觉得这个下午花得值得。','关系',age(12),[stat('happiness',3),stat('reputation',3),{type:'count',key:'help',value:1},{type:'personality',key:'helpful',value:4}],{weights:[{dimension:'人生愿望',path:'aspiration',equals:'帮助别人',add:20}]}),
base('sports_injury','训练需要暂停','训练时的一阵疼痛没有很快消失。检查后，你被要求停止高强度活动一段时间。看着原来排好的训练表，你很不甘心，但也明白继续硬撑可能让事情更难收拾。','健康',[['career','in',['esports','cyclist']],['retired','==',false]],[stat('health',-25),tag('长期伤病'),schedule('recovery',1)],{weight:3,cooldown:8}),
base('career_controversy','一次工作争议','工作中的一次决定引起了争议。有人认可你的解释，也有人保留意见。你把相关材料重新整理，认真回应了质疑。这件事不会马上过去，之后的合作可能还会被问起。','职业',working,[stat('reputation',-20),{type:'level',value:-1},{type:'social',kind:'职业争议',text:'曾因工作决定受到质疑'},tag('职业争议')],{weight:2,cooldown:9})
];
export const eventById=id=>events.find(e=>e.id===id);
