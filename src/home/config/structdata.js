//~~~~~~~~~~~游戏状态
exports.GAME_ST_WAIT = 0; //等待状态
exports.GAME_ST_READY = 1; //准备状态
exports.GAME_ST_GETCARD = 2;//抓牌状态
exports.GAME_ST_CHECK_MAH = 3; //检查手牌
exports.GAME_ST_ONTURN = 4; //出牌状态
exports.GAME_ST_WAIT_PLAY = 5; //等待其他玩家操作
exports.GAME_ST_SPECIAL = 6; //处理特殊情况，吃，碰，杠，胡
exports.GAME_ST_OUT = 7; //托管
exports.USER_COUNT = 3; //房间用户数

//房间状态
exports.ROOM_ST_WAIT_JOIN = "wait_for_join"; //等待玩家加入
exports.ROOM_ST_WAIT_PLAY = "wait_for_play"; //等待开始游戏
exports.ROOM_ST_WAIT_START = "wait_for_start"; //等待房主开始游戏
exports.ROOM_ST_WAIT_DEAL = "wait_for_deal"; //等待发牌
exports.ROOM_ST_WAIT_RESUME = "wait_for_resume"; //等待重新开始
exports.ROOM_ST_WAIT_DISMISS = "wait_for_dismiss"; //等待解散房间
exports.ROOM_ST_WAIT_WAKE = "wait_for_wake"; //等待激活房间
exports.ROOM_ST_WAIT_CONTINUE = "wait_for_continue"; //等待继续游戏

//~~~~~~~~~~~游戏状态
exports.GS_WAIT_SETGAME = 0; //等待房主设置状态
exports.GS_WAIT_ARGEE = 1; //等待同意设置
exports.GS_SEND_CARD = 20;//发牌状态
exports.GS_WAIT_BACK = 21; //等待扣压底牌
exports.GS_PLAY_GAME = 22; //游戏中状态
exports.GS_WAIT_NEXT = 23; //等待下一盘开始

exports.GS_FLAG_NORMAL = 0				//正常情况
exports.GS_FLAG_CALL_SCORE = 1				//叫分
exports.GS_FLAG_ROB_NT = 2				//抢地主
exports.GS_FLAG_ADD_DOUBLE = 3				//加棒
exports.GS_FLAG_SHOW_CARD = 4				//亮牌
exports.GS_FLAG_PLAY_GAME = 5

exports.MAX_TASK_TYPE = 4;  ///任务最大种类 
exports.MAX_CARD_SHAPE = 8;  ///牌型最大种类
exports.MAX_CARD_TYPE = 15; ///牌种类

exports.PLAY_COUNT = 3;

exports.TYPE_NONE = 0;//什么牌型都不是
exports.TYPE_DOUBLE_CARD = 10;//对子
exports.TYPE_SAME_HUA = 11;//同花
exports.TYPE_SMALL_KING = 12;//小王
exports.TYPE_BIG_KING = 13; //大王
exports.TYPE_TRIPLE_CARD = 14;//三张相同
exports.TYPE_STRAIT = 15;//顺子
exports.TYPE_ROCKET = 16;//火箭

exports.USER_SITTING = 0; //空闲状态
exports.USER_CUT_GAME = 1; //用户异常
exports.USER_ARGEE = 2; //同意继续游戏

///任务类型

exports.TYPE_LAST_NONE = 0;    ///无任何牌型 
exports.TYPE_HAVE_A_CARD = 100;  ///有某张牌
exports.TYPE_SOME_SHAPE = 101;  ///有某种牌型
exports.TYPE_SINGLE_SOME_CARD = 102;  ///打的某张牌
exports.TYPE_DOUBLE_SOME_CARD = 103;   ///打的一对某种牌

///游戏任务结构
exports.GameTaskStruct = function () {
    this.byBackCardType = 0;
    this.byTaskType = 0;
    this.bySpecifyShape = 0;
    this.bySpecifyCard = 0;
    this.byBackCardMutiple = 0;  ///底牌倍数
};
///游戏中的倍数
function GameMutipleStruct() {
    this.sBaseMutiple = 1;                 ///游戏中的基本底注
    this.sBackCardMutiple = 1;             ///底牌倍数
    this.sBombCount = 0;                   ///炸弹倍数
    this.sSprintMutiple = 1;               ///春天
    this.sCardShapeMutiple = 100;           ///牌型倍数（一般指任务中的倍数）

    this.sAddGameMutiple = [0,0,0];  /// 游戏中加倍
    this.sRobNtMutiple = [0,0,0];    ///抢地主倍数
    this.sMingPaiMutiple = [0,0,0];  ///每个人的明牌倍数
}

GameMutipleStruct.prototype.initData = function (iBaseMutiple) {
    this.sBaseMutiple = iBaseMutiple;
    this.sBombCount = 0;
    this.sBackCardMutiple = 1;
    this.sSprintMutiple = 1;
    this.sCardShapeMutiple = 100;
    this.sMingPaiMutiple = [0,0,0];
    this.sAddGameMutiple = [0,0,0];  /// 游戏中加倍
    this.sRobNtMutiple = [0,0,0];    ///抢地主倍数
}
///获取明牌最大倍数
GameMutipleStruct.prototype.GetMingMaxMutiple = function () {
    var iMingMutiple = Math.max(Math.max(this.sMingPaiMutiple[0], this.sMingPaiMutiple[1]), this.sMingPaiMutiple[2]);
    return (iMingMutiple > 0 ? iMingMutiple : 1);
}
///获取器抢地主倍数
GameMutipleStruct.prototype.GetRobNtMutiple = function () {
    var iRobMutiple = 0;
    var iRobCount = 0;
    for (var i = 0; i < 3; i++) {
        iRobCount += this.sRobNtMutiple[i];
    }
    iRobMutiple = Math.pow(2.0, iRobCount);
    return iRobMutiple;
}
///获取公共倍数
GameMutipleStruct.prototype.GetPublicMutiple = function () {
    var iBombMutiple = Math.pow(2.0, this.sBombCount);
    var iGameMutiple = this.sBaseMutiple * this.sBackCardMutiple * iBombMutiple * this.sSprintMutiple * this.sCardShapeMutiple * this.GetRobNtMutiple() * this.GetMingMaxMutiple() / 100;
    return iGameMutiple;
}

exports.GameMutipleStruct = GameMutipleStruct;

/********************************************************************************/
//游戏数据包
/********************************************************************************/
//用户出牌数据包 （发向服务器）
exports.OutCardStruct = function () {
    this.iCardCount = 0;						//扑克数目
    this.iCardList = [];					//扑克信息
};
//用户出牌数据包 （发向客户端）
exports.OutCardMsg = function () {
    this.iNextDeskStation = 0;				//下一出牌者
    this.iCardCount = 0;						//扑克数目
    this.bDeskStation = 0;					//当前出牌者	
    this.iCardList = [];					//扑克信息
};
//新一轮
exports.NewTurnStruct = function () {
    this.bDeskStation;					//坐号
    this.bReserve;						//保留
};
//游戏状态数据包	（ 等待东家设置状态 ）
exports.GameStation_1 = function () {
    //游戏版本
    this.iVersion;						//游戏版本号
    this.iVersion2;						//游戏版本号
};
//游戏状态数据包	（ 等待其他玩家开始 ）
exports.GameStation_2 = function () {
    this.iVersion = 0;						//游戏版本号
    this.iVersion2 = 0;						//游戏版本号
    this.bUserReady = [];        ///玩家是否已准备

    this.iBeginTime = 0;						//开始准备时间
    this.iThinkTime = 0;						//出牌思考时间
    this.iCallScoreTime = 0;					//叫分计时
    this.iRobNTTime = 0;                    //抢地主时间
    this.iAddDoubleTime = 0;					//加棒时间

    this.iGameMutiple = 1;             ///游戏中的倍数
    this.iAddDoubleLimit = 1;             //加倍限制
    this.iGameMaxLimit = 0;              ///游戏最大输赢

    this.iCardShape = 0;						//牌型设置
    //游戏倍数
    this.iDeskBasePoint = 1;					//桌面基础分
    this.iRoomBasePoint = 1;					//房间倍数
    this.iRunPublish = 1;					//逃跑扣分
};
//游戏状态数据包	（ 等待扣押底牌状态 ）
exports.GameStation_3 = function () {
    this.iVersion=0;						//游戏版本号
    this.iVersion2 = 0;						//游戏版本号
    this.iBackCount = 0;						//底牌数
    this.iBeginTime = 0;						//开始准备时间
    this.iThinkTime = 0;						//出牌思考时间
    this.iRobNTTime = 0;                    //抢地主时间
    this.iCallScoreTime = 0;					//叫分计时
    this.iAddDoubleTime = 0;					//加棒时间
    this.iCallScorePeople = 0;				//当前叫分人
    this.iGameFlag = 0;						//叫分标记
    this.iCallScoreResult = 0;				//所叫的分
    this.iUpGradePeople = 0;					//庄家位置
    this.iCurOperator = 0;                 ///当前操作的人
    this.iDeskBasePoint = 0;					//桌面基础分
    this.iRoomBasePoint = 0;					//房间倍数
    this.iCardShape = 0;						//牌型设置
    this.iGameMutiple = 0;             ///游戏中的倍数
    this.iAddDoubleLimit = 0;             //加倍限制
    this.iGameMaxLimit = 0;              ///游戏最大输赢
    this.bAuto = [];				//托管情况
    this.bCanleave = [];			//能否点退出
    this.iCallScore = [];			//几家叫分情况
    this.iRobNT = [];				//抢地主情况
    this.iUserDoubleValue = [];  ///玩家加倍情况
    this.iUserCardCount = [];		//用户手上扑克数目
    this.iUserCardList = [];				//用户手上的扑克
    this.iGameBackCard = [];                 ///底牌
    this.iBackCardCount = 0;						//底牌数量
    this.iRunPublish = 0;					//逃跑扣分
    this.gameMutiple = new module.exports.GameMutipleStruct();                      ///游戏倍数  
    this.gameTask = new module.exports.GameTaskStruct();                         ///游戏任务
};
//游戏状态数据包	（ 游戏中状态 ）
exports.GameStation_4 = function () {
    this.bIsLastCard = false;						//是否有上轮数据
    this.iVersion = 0;							//游戏版本号
    this.iVersion2 = 0;							//游戏版本号
    this.iBackCount = 0;							//底牌数
    this.iBeginTime = 0;							//开始准备时间
    this.iThinkTime = 0;							//出牌思考时间
    this.iRobNTTime = 0;                    //抢地主时间
    this.iCallScoreTime = 0;						//叫分计时
    this.iAddDoubleTime = 0;						//加棒时间
    this.bIsPass = false;							//是否不出
    this.iRunPublish = 0;						//逃跑扣分	
    this.iBase = 0;								//当前炸弹个数
    this.iUpGradePeople = 0;						//庄家位置
    this.iCallScoreResult = 0;					//叫分结果
    this.iOutCardPeople = 0;						//现在出牌用户
    this.iFirstOutPeople = 0;					//先出牌的用户
    this.iBigOutPeople = 0;						//先出牌的用户
    this.iDeskBasePoint = 0;						//桌面基础分
    this.iRoomBasePoint = 0;						//房间倍数
    this.iGameMutiple = 0;             ///游戏中的倍数
    this.iCardShape = 0;							//牌型设置
    this.iAddDoubleLimit = 0;             //加倍限制
    this.iGameMaxLimit = 0;              ///游戏最大输赢
    this.iAwardPoint = [];			//奖分
    this.iPeopleBase = [];			//加棒
    this.iRobNT = [];					//抢地主
    this.bAuto = [];					//托管情况
    this.bCanleave = [];				//能否点退出
    this.iUserCardCount = [];			//用户手上扑克数目
    this.iUserCardList = [];					//用户手上的扑克
    this.iBaseOutCount;						//出牌的数目
    this.iBaseCardList = [];                //桌面上的牌
    this.iDeskCardCount = [];			//桌面扑克的数目
    this.iDeskCardList = [];    ///桌面上的牌
    for (var i = 0; i < 3; i++) {
        this.iDeskCardList.push([]);
    }
    this.iLastCardCount = [];			//上轮扑克的数目
    this.iLastOutCard = [];		//上轮的扑克
    for (var i = 0; i < 3; i++) {
        this.iLastOutCard.push([]);
    }
    this.bPass = [];                //不出
    this.bLastTurnPass = [];         //上一轮不出
    this.iGameBackCard = [];                 ///底牌
    this.iBackCardCount = 0;						//底牌数量
    this.iCurOperator = 0;                 ///当前操作的人
    this.iUserDoubleValue = [];  ///玩家加倍情况
    this.gameMutiple = new module.exports.GameMutipleStruct();                      ///游戏倍数  
    this.gameTask = new module.exports.GameTaskStruct();                         ///游戏任务
};
//游戏状态数据包	（ 等待下盘开始状态  ）
exports.GameStation_5 = function () {
    this.iVersion = 0;							//游戏版本号
    this.iVersion2 = 0;							//游戏版本号
    this.iBeginTime = 0;							//开始准备时间
    this.iThinkTime = 0;							//出牌思考时间
    this.iRobNTTime = 0;                    //抢地主时间
    this.iCallScoreTime = 0;						//叫分计时
    this.iAddDoubleTime = 0;						//加棒时间
    this.iGameMutiple = 0 ;               ///游戏中的倍数
    this.iAddDoubleLimit = 0;             //加倍限制
    this.iGameMaxLimit = 0;              ///游戏最大输赢
    this.bUserReady = [];     ///玩家准备
    this.iCardShape = 0;							//牌型设置
    this.iDeskBasePoint = 0;						//桌面基础分
    this.iRoomBasePoint = 0;						//房间倍数
    this.iRunPublish = 0;						//逃跑扣分
};
//用户同意游戏
exports.UserArgeeGame = function () {
    this.iPlayCount;							//游戏盘数
    this.iCardCount;							//扑克数目
};
///明牌开始
exports.UserMingStruct = function () {
    this.bStart;       ///是否为开始
    this.bMing;         ///玩家是否明牌
    this.bDeskStaion;   ///玩家的位置
    this.byCardCount;   ///明牌时玩家扑克的数量
};
/*----------------------------------------------------------------------*/
//游戏开始
exports.GameBeginStruct = function () {
    this.iPlayLimit;							//游戏总局数
    this.iBeenPlayGame;						//已经玩了多少局
    this.byUserMingBase = [];        ///玩家明牌倍数情况
    this.iCardShape;							//牌型设置
};
//发牌数据包
exports.SendCardStruct = function () {
    this.bDeskStation;							//玩家
    this.bCard;									//牌标号
};
/*----------------------------------------------------------------------*/
//發送所有牌數據
exports.SendAllStruct = function () {
    this.iUserCardCount = [];		//发牌数量
    this.iUserCardList = [];				//发牌队例
};
//发牌结束
exports.SendCardFinishStruct = function () {
    this.bReserve;
    this.byBackCardList = [];						//底牌数据
    this.byUserCardCount = [];			//用户手上扑克数目
    this.byUserCard = [];				//用户手上的扑克
    for (var i = 0; i < 3; i++) {
        this.byUserCard.push([]);
    }
};
/*----------------------------------------------------------------------*/
//底牌数据包
exports.BackCardExStruct = function () {
    this.iGiveBackPeople = -1;				//底牌玩家
    this.iBackCardCount = 3;					//扑克数目
    this.iBackCard = [];					//底牌数据
    this.gameTask = new module.exports.GameTaskStruct();;                      //游戏任务  
};
//游戏开始数据包
exports.BeginPlayStruct = function () {
    this.iOutDeskStation = -1;				//出牌的位置
};
//叫分数据包
exports.CallScoreStruct = function () {
    this.bDeskStation = -1;							//当前叫分者
    this.iValue = 0;									//叫分类型
    this.bCallScoreflag = 0;							//叫分标记								
};
/*----------------------------------------------------------------------*/
//抢地主
exports.RobNTStruct = function () {
    this.byDeskStation = -1;		//抢地主坐号
    this.byRobCount = 0;         //玩家抢地主次数
    this.iValue = -1;				//抢地主情况(0-叫地主状态 1-抢地主状态)
};
/*----------------------------------------------------------------------*/
//明牌
exports.ShowCardStruct = function () {
    this.bDeskStation = 0;										//坐号
    this.iCardList = [];					                   //扑克信息
    this.iCardCount = 0;						              //扑克数目
    this.iValue = 0;											  //保留
    this.iBase = 0;											  //倍数 20081204
};
//加棒
exports.AddDoubleStruct = function () {
    this.bDeskStation = -1;										//加棒位置
    this.iValue = -1;												//加棒情况
};
//奖分
exports.AwardPointStruct = function () {
    this.iAwardPoint = 0;									//奖分
    this.bDeskStation = 0;									//坐号
    this.iBase = 0;											//倍数
};

//托管数据结构
exports.AutoStruct = function () {
    this.bDeskStation;
    this.bAuto;
};

//机器人托管
exports.UseAIStation = function () {
    this.bDeskStation;					//坐号
    this.bState;						//状态
};

//冠军结果
exports.ChampionStruct = function () {
    this.bDeskStation;
};
//游戏结束统计数据包
exports.GameEndStruct = function () {
    this.bFinishTask = false;                    //是否完成了任务
    this.iUpGradeStation = -1;				//庄家位置
    this.iUserCardCount = [];	    //用户手上扑克数目
    this.iUserCard = [];		//用户手上的扑克
    for (var i = 0; i < 3; i++) {
        this.iUserCard.push([]);
    }
    this.gameMutiple = new module.exports.GameMutipleStruct();
    this.iTurePoint = [];			//玩家得分
    this.iChangeMoney = [];				//玩家金币
};

//游戏结束统计数据包
exports.GameCutStruct = function () {
    this.iRoomBasePoint = 0;					//倍数
    this.iDeskBasePoint = 0;					//桌面倍数
    this.iHumanBasePoint= 0;				//人头倍数
    this.bDeskStation = 0;					//退出位置
    this.iChangeMoney = [];				//玩家金币
    this.iTurePoint = [];			//庄家得分
};
//有事离开
exports.HaveThingStruct = function () {
    this.pos;
    this.szMessage = [];
};
//离开结果
exports.LeaveResultStruct = function () {
    this.bDeskStation = -1;
    this.bArgeeLeave = false;
};
//游戏结算
exports.GameFinishNotify = function () {
    this.name = [];
    for (var i = 0; i < 3; i++) {
        this.name.push([]);
    }
    //	int	iBasePoint;
    this.iStyle;			//游戏类型是否为强退,还是正常结束
    this.iBasePoint;			//系统基数
    this.iDeskBasePoint;		//桌面基础分
    this.iUpGradePeople;		//莊家
    this.iGrade2;			//莊家盟友
    this.iWardPoint = [];
    this.iAwardPoint = [];	//讨赏
    this.iTotalScore = [];	//总积分
    this.iMoney = [];			//比赛所留钱数
    this.iGameStyle;					//游戏类型
};
//玩家断线
exports.UserleftDesk = function () {
    this.bDeskStation;                //断线玩家
};
