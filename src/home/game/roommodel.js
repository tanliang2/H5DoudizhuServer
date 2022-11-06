'use strict';
import botmanager from './botmanager';
import gameLogic from "./../logic/gametasklogic";
var structData = require("./../config/structdata");
var eventDispatcher = require("./../controller/eventdispatcher");
//定时器 ID
var IDT_USER_CUT = 1									//断线定时器 ID
var TIME_SEND_CARD = 30				//发牌定时器
var TIME_SEND_ALL_CARD = 31				//发所有牌
var TIME_SEND_CARD_ANI = 32				//等待反牌
var TIME_SEND_CARD_FINISH = 33              //发牌结束
var TIME_ROB_NT = 34				//抢地主
var TIME_ADD_DOUBLE = 35				//加棒
var TIME_OUT_CARD = 36				//出牌
var TIME_WAIT_NEWTURN = 37				//新一轮时间设置
var TIME_GAME_FINISH = 38				//游戏结束定时器
var TIME_JIAO_FEN = 39              //叫分定时器
var TIME_SHOW_CARD = 40              //亮牌

var TIME_START_GAME = 41				//比赛开始时间设置
//游戏结束标志定义
var GF_NORMAL = 10				//游戏正常结束
var GF_SAFE = 11				//游戏安全结束
var GF_NO_CALL_SCORE = 13				//无人叫分
var GF_TERMINATE = 14				//意外停止游戏
var GF_AHEAD_END = 15				//提前结束
export default class extends think.base {
    init(roomId, roomType = 1) {
        this.roomType = roomType;
        this.maxRound = 2;
        this.currentRound = 1;
        this.panNum = 0;
        this.isGaming = false; //是否处于游戏中
        this.roomID = roomId;
        this.userList = {}; //房间里的用户信息列表
        this.m_bHaveKing;      			    //是否有王(DEF=1,0)
        this.m_bKingCanReplace;				//王可否代替牌(DEF=1,0)
        this.m_bRobnt = 1;         				//是否可以抢地主
        this.m_bAdddouble = false;    				//是否可以加棒
        this.m_bShowcard = 1;     				//是否可以加倍
        this.m_iPlayCard;     				//所有扑克副数(1,DEF=2,3
        this.m_iPlayCount;    				//使用扑克数(52,54,104,DEF=108)
        this.m_iSendCount;    				//发牌数(48,51,DEF=100,108)
        this.m_iBackCount;    				//底牌数(3,6,DEF=8,12)
        this.m_iUserCount;    				//玩家手中牌数(12,13,DEF=25,27)
        this.m_iCardShape = 0;	  				//牌型
        //=============扩展
        this.m_iThinkTime;               	//游戏思考时间
        this.m_iBeginTime;               	//游戏开始时间
        this.m_iSendCardTime;           	//发牌时间
        this.m_iCallScoreTime;           	//叫分时间
        this.m_iRobNTTime;              	//抢地主时间
        this.m_iAddDoubleTime;           	//加棒时间
        this.m_bTurnRule;					//游戏顺序
        this.m_Logic = new gameLogic();                             ///游戏中的逻辑（包含任务逻辑）
        this.m_GameMutiple = new structData.GameMutipleStruct();                      ///游戏中的倍数
        this.m_iBaseMult = 1;					   //游戏倍数
        this.m_iAddDoubleLimit = 0;                  ///加倍限制
        this.m_iGameMaxLimit = 0;                  ///房间最大输赢 
        this.m_iLimitPoint = 0;                   //游戏最大倍数
        this.m_iLimitPlayGame = 99;					   //至少打完多少局
        this.m_iBeenPlayGame = 0;					 	//已经游戏的局数
        this.m_iLeaveArgee = 0;							//离开同意标志
        //状态信息
        this.m_iUserCardCount = [];			//用户手上扑克数目
        this.m_iUserCard = [];			//用户手上的扑克
        for (var i = 0; i < 3; i++) {
            this.m_iUserCard.push([]);
        }
        this.m_iBackCard = [];						//底牌列表
        this.m_iBaseOutCount = 0;						//出牌的数目
        this.m_iDeskCardCount = [];			//桌面扑克的数目
        this.m_iDeskCard = [];			//桌面的扑克
        for (var i = 0; i < 3; i++) {
            this.m_iDeskCard.push([]);
        }
        //发牌数据
        this.m_iSendCardPos;							//发牌位置
        this.m_iAIStation = [];				//四家机器托管状态
        this.m_iHaveThingPeople;						//有事要走玩家
        this.m_iGameFlag = structData.GS_FLAG_NORMAL;							//游戏状态小分解
        this.m_bIsLastCard;						//是否有上轮数据
        this.m_iLastCardCount = [0, 0, 0];		//上轮扑克的数目
        this.m_iLastOutCard = [];		//上轮的扑克
        for (var i = 0; i < 3; i++) {
            this.m_iLastOutCard.push([]);
        }
        this.m_byteHitPass;						//记录不出
        this.m_byPass = [];             //本轮不出
        this.m_byLastTurnPass = [];      //上轮不出
        this.m_bySendFinishCount = 0;               //发完牌的人
        this.m_bThrowoutCard = 0x00;						//明牌
        this.m_bFirstCallScore = 255;						//第一个叫地主者
        this.m_bCurrentCallScore;					//当前叫分者
        this.m_iUpGradePeople = -1;						//庄家位置
        this.m_iNtFirstCount = 0;						//地主出的第一手牌数
        //运行信息
        this.m_iOutCardPeople = -1;						//现在出牌用户
        this.m_iFirstOutPeople = -1;						//先出牌的用户
        this.m_iNowBigPeople = -1;						//当前桌面上最大出牌者
        this.m_iRecvMsg = 0;								//收到消息计数
        this.m_iCallScore = [];
        this.m_iAwardPoint = [0, 0, 0];				//牌形加分
        this.m_bAuto = [false, false, false];					//托管设置
        //比赛场使用变量
        this.m_iWinPoint = [0, 0, 0];				//胜者
        this.m_iDealPeople = -1;							//反牌玩家
        this.m_bHaveSendBack = false;						//该轮是否发过底牌
        this.m_bCanleave = [];				//能否离开
        this.m_iPrepareNT = 255;							//预备庄家
        this.m_iFirstRobNt = 255;                        //第一个叫地主的人
        this.m_iFirstShow = 255;                         ///第一个明牌的人
        this.m_bGameStation = structData.GS_WAIT_ARGEE;                //游戏状态
        this.m_iCurrentRobPeople = 255;                  ///当前叫地主的人
        this.m_iRobStation = [];            ///玩家抢地主状态(0-未操作 255-不叫地主 其他-叫地主)
        this.m_iAddStation = [];            ///玩家加倍状态                     
        //斷線玩家
        this.m_iFirstCutPeople = 255;						//第一個掉線玩家
        this.m_icountleave = 0;                           //点离开人数统计
        ///玩家准备状态
        this.m_bUserReady = [false, false, false];
        this.m_vlSuperID;	//保存超端玩家的容器
        this.m_bUserNetCut = [false, false, false];	//标识玩家是否断线
        this.m_iDeskID = 255;	//桌子ID(用于写日志)
        this.timeoutTimer = -1;//出牌计时器
        this.robntTimer = -1; //抢地主计时器
        this.allTimer = []; //所有计时器
        this.isdissed = false;

        for (var i = 0; i < this.m_iLastOutCard.length; i++) {
            for (var j = 0; j < 45; j++) {
                this.m_iLastOutCard[i].push(0);
            }
        }

        this.LoadIni();

        this.m_GameMutiple.initData(this.m_iBaseMult);

        this.InitThisGame();
    }
    //读取配置
    LoadIni() {
        this.m_bHaveKing = 1;
        this.m_iPlayCard = 1;
        this.m_iPlayCount = 54;
        this.m_iSendCount = 51;
        this.m_iBackCount = 3;
        this.m_iUserCount = 17;
        this.m_bKingCanReplace = 0;
        this.m_iBeginTime = 15;
        this.m_iThinkTime = 20;
        this.m_iSendCardTime = 3;
        this.m_iRobNTTime = 10;
        this.m_iCallScoreTime = 15;
        this.m_iAddDoubleTime = 5;
        this.m_iCardShape &= 0x00000000;
        this.m_iCardShape |= (1 & 0xFFFFFFFF);//单张
        this.m_iCardShape |= ((1 << 1) & 0xFFFFFFFF);//对
        this.m_iCardShape |= ((1 << 2) & 0xFFFFFFFF);//三条
        this.m_iCardShape |= ((1 << 3) & 0xFFFFFFFF);//三带单
        this.m_iCardShape |= ((0 << 4) & 0xFFFFFFFF);//三带二单
        this.m_iCardShape |= ((1 << 5) & 0xFFFFFFFF);//三带对

        this.m_iCardShape |= ((1 << 6) & 0xFFFFFFFF);//单顺
        this.m_iCardShape |= ((0 << 7) & 0xFFFFFFFF);//同花顺
        this.m_iCardShape |= ((1 << 8) & 0xFFFFFFFF);//双顺
        this.m_iCardShape |= ((1 << 9) & 0xFFFFFFFF);//三顺
        this.m_iCardShape |= ((1 << 10) & 0xFFFFFFFF);//三带带单
        this.m_iCardShape |= ((0 << 11) & 0xFFFFFFFF);//三带二单顺
        this.m_iCardShape |= ((1 << 12) & 0xFFFFFFFF);//三带对顺

        this.m_iCardShape |= ((0 << 13) & 0xFFFFFFFF);//四带一
        this.m_iCardShape |= ((1 << 14) & 0xFFFFFFFF);//四带二单
        this.m_iCardShape |= ((0 << 15) & 0xFFFFFFFF);//四带一对
        this.m_iCardShape |= ((1 << 16) & 0xFFFFFFFF);//四带二对

        this.m_iCardShape |= ((0 << 17) & 0xFFFFFFFF);			//510k
        this.m_iCardShape |= ((0 << 18) & 0xFFFFFFFF);		//同花510k
        this.m_iCardShape |= ((1 << 19) & 0xFFFFFFFF);			//炸弹
        this.m_iCardShape |= ((1 << 20) & 0xFFFFFFFF);		//王炸
    }

    InitThisGame() {
        this.m_Logic.SetKingCanReplace(this.m_bKingCanReplace);
        this.m_Logic.SetCardShape(this.m_iCardShape);
    }
    //获取一个空闲的座位
    getFreeDesk() {
        if (!this.userList) return;
        for (var i = 1; i < 4; i++) {
            if (!this.userList[i]) {
                return i;
            }
        }
    }
    //用户进入房间
    addUser(roomUser, isreback = false) {
        if (!isreback) {
            var userPos = -1;
            for (var i = 1; i < 4; i++) {
                if (!this.userList[i]) {
                    this.userList[i] = roomUser;
                    userPos = i;
                    break;
                }
            }
        }
        var res = {};
        res.rules = [];
        res.infos = [];
        res.uid = roomUser.user.uid;
        for (var k in this.userList) {
            var userInfo = {};
            userInfo.nick = this.userList[k].user.nickName;
            userInfo.pic = this.userList[k].user.iconUrl;
            userInfo.pos = Number(k);
            userInfo.uid = this.userList[k].user.uid;
            userInfo.sex = this.userList[k].user.sexNum;
            userInfo.game_times = 1;
            userInfo.drop_rate = 0;
            userInfo.ip = this.userList[k].isbot ? this.userList[k].getRandonIp() : this.userList[k].socket.handshake.address.substr(7);
            userInfo.isReady = this.userList[k].currentState == structData.GAME_ST_READY;
            if (this.userList[k].isOutline)
                userInfo.status = "offline";
            else
                userInfo.status = "online";
            res.infos.push(userInfo);
        }
        var userCount = 0;
        for (var k in this.userList) {
            this.userList[k].onUserIn(res);
            userCount++;
        }
        if (userCount == 3) {
            if (this.roomType != 1)
                this.checkStart();
        }

    }

    //有用户离开房间
    async userLeaveRoom(deskStation) {
        if (!this.userList) return;
        if (!this.userList[deskStation]) return;
        //如果是房主的话房间解散
        if (deskStation == 1 && !this.isGaming && this.roomType == 1) {
            var roundList = { 24: 12, 12: 6, 6: 4 };
            if (this.userList[1]) {
                let userModel = think.model('user', think.config('db'), 'home');
                await userModel.setUserRoomcard(this.userList[1].user.uid, roundList[this.maxRound], 3);
            }
            this.dissovlerRoom();
            return;
        }
        var res = {};
        res.rules = [];
        res.infos = [];
        res.uid = this.userList[deskStation].user.uid;
        for (var k in this.userList) {
            var userInfo = {};
            userInfo.nick = this.userList[k].user.nickName;
            userInfo.pic = this.userList[k].user.iconUrl;
            userInfo.pos = Number(k);
            userInfo.uid = this.userList[k].user.uid;
            userInfo.sex = this.userList[k].user.sexNum;
            userInfo.game_times = 1;
            userInfo.drop_rate = 0;
            userInfo.ip = this.userList[k].isbot ? this.userList[k].getRandonIp() : this.userList[k].socket.handshake.address.substr(7);
            userInfo.isReady = this.userList[k].currentState == structData.GAME_ST_READY;
            if (k == deskStation) {
                if (!this.isGaming)
                    userInfo.status = "leave";
                else
                    userInfo.status = "offline";
            } else {
                if (this.userList[k].isOutline)
                    userInfo.status = "offline";
                else
                    userInfo.status = "online";
            }
            res.infos.push(userInfo);
        }
        for (var k in this.userList) {
            if (k != deskStation)
                this.userList[k].onUserLeave(res);
        }
        if (!this.isGaming) {
            if (!this.userList[deskStation].isbot)
                this.userList[deskStation].socket.leave(this.roomID);
            this.userList[deskStation].dispose();
            this.userList[deskStation] = null;
            delete this.userList[deskStation];
        }
        if (this.getUserCount(false) == 0) {
            this.dissovlerRoom();
            return;
        }
        if (this.roomType != 1 && !this.isGaming) {
            this.roomStation = structData.ROOM_ST_WAIT_JOIN;
            this.currentRound = 1; //当前进行的圈数
            this.roundIndex = 1; //当前圈进度
            for (var k in this.userList) {
                this.userList[k].resetRoundRecord();
            }
        }
    }
    //获取房间用户数量
    getUserCount(withBot = true) {
        var userCount = 0;
        for (var k in this.userList) {
            if (!withBot) {
                if (!this.userList[k].isbot)
                    userCount++;
            } else {
                userCount++;
            }
        }
        return userCount;
    }
    //用户解散房间投票
    onUserDissRoom() {
        this.isDissing = true;
        var res = {};
        var now = new Date();
        res.time = now.getTime();
        res.vote = {};
        var dissNumber = 0;
        var agreeNum = 0;
        for (var k in this.userList) {
            if (this.userList[k].isOutline) {
                this.userList[k].dissRoomAnswer = 1;
            }
            res.vote[this.userList[k].user.uid] = this.userList[k].dissRoomAnswer;
            if (this.userList[k].dissRoomAnswer != -1 || this.userList[k].isOutline) dissNumber++;
            if (this.userList[k].dissRoomAnswer == 1 || this.userList[k].isOutline) agreeNum++;
        }
        for (var k in this.userList) {
            if (!this.userList[k].isbot)
                this.userList[k].socket.emit("onDissRoom", res);
            if (dissNumber >= 3) {
                this.userList[k].dissRoomAnswer = -1;
                this.isDissing = false;
            }
        }
        if (agreeNum >= 3) {
            var that = this;
            setTimeout(function () {
                if (that.panNum == 0) {
                    that.dissovlerRoom();
                }
                else
                    that.gameover([], true);
            }, 800);
        }

    }
    //解散房间
    dissovlerRoom() {
        this.clearAllTimer();
        this.isdissed = true;
        for (var k in this.userList) {
            if (!this.userList[k].isbot) {
                this.userList[k].socket.emit("roomDissovled");
                this.userList[k].socket.leave(this.roomID);
            }
            this.userList[k].dispose();
            this.userList[k] = null;
            delete this.userList[k];
        }
        //   this.userList = null;
        if (eventDispatcher.socketioProxy)
            eventDispatcher.socketioProxy.dissovleRoom(this.roomID);
        //  eventDispatcher.eventEmitter.emit("dissovleRoom", this.roomID);
    }
    //清理所有计时器
    clearAllTimer() {
        //全部清除方法
        for (var i = 0; i < this.allTimer.length; i++) {
            clearTimeout(this.allTimer[i]);
        }
        clearTimeout(this.robntTimer);
        clearTimeout(this.timeoutTimer);
        this.allTimer = [];
    }
    //用户发送聊天消息
    onUserChat(chatObj) {
        for (var k in this.userList) {
            if (!this.userList[k].isbot)
                this.userList[k].socket.emit("onUserChat", chatObj);
        }
    }
    //房主踢人
    onKickUser(pos) {
        if (!this.userList[pos]) return;
        if (!this.userList[pos].isbot) {
            this.userList[pos].socket.leave(this.roomID);
            this.userList[pos].socket.emit("onKicked");
        }
        this.userLeaveRoom(pos);

    }
    //玩家点击继续游戏
    onUserContinue(deskStation) {
        var res = {};
        res.pos = deskStation;
        for (var k in this.userList) {
            if (!this.userList[k].isbot)
                this.userList[k].socket.emit("onUserContinue", res);
        }
        this.checkStart();
    }

    //一局结束后清理掉线玩家
    clearOutline() {
        for (var i in this.userList) {
            if (this.userList[i].isOutline) {
                this.userList[i].socket = null;
                this.userList[i] = null;
                delete this.userList[i];
            }
        }
    }
    //检查是否开始游戏
    checkStart(readypos = -1) {
        var userNum = 0;
        for (var k in this.userList) {
            if (this.userList[k].currentState == structData.GAME_ST_READY) {
                userNum++;
            }
        }
        if (readypos != -1) {
            for (var k in this.userList) {
                this.userList[k].socket.emit("userReady", readypos);
            }
        }
        if (userNum == 3) {
            if (this.roomType != 1)
                this.startGame();
            else
                this.userList[1].socket.emit("allready");
        }
        return true;
    }

    //开始游戏
    startGame() {
        if (this.roomType != 1) {
            var hasobj = { 1: "roomcard", 2: "normal", 3: "middle", 4: "hight" };
            var roomcfg = think.config("roomcfg");
            var cfgData = roomcfg[hasobj[this.roomType]];
            var limit = cfgData.limit;
            var lackCoinList = [];
            for (var k in this.userList) {
                if (this.userList[k].user.currency < limit) {
                    lackCoinList.push(k);
                }
            }
            if (lackCoinList.length > 0) {
                this.gameover(lackCoinList);
                return;
            }
        }
        // var setMahjongData = upGradeLogic.socketioProxy ? upGradeLogic.socketioProxy.getRoomSetMahList(this.roomID) : null; //测试设置的数据
        // if (setMahjongData) {
        //     this.mahjongStore = setMahjongData.mahjongSetList;
        // } else {
        //     //upGradeLogic.getAllMahjong(this.gameType);
        //     this.mahjongStore = upGradeLogic.getAllMahjong(this.gameType);//[3,4, 4,4, 4, 5, 5, 15, 7, 8, 9, 10, 10, 11,11, 12,13,16, 17, 17, 0,9, 2, 2, 5, 6, 7, 7, 10, 11,12,13, 13, 13, 16, 17, 17, 18, 18, 19, 19, 9,2, 1, 2, 3, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,3, 1, 2, 3, 5, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
        // }
        this.currentRound++;
        this.GameBegin(0);
    }
    //游戏结束
    gameover(gapMoneyList = [], isdiss = false) {
        var res = {};
        res.persons = {};
        res.settlement = {};
        for (var k in this.userList) {
            var person = {};
            person.nick = this.userList[k].user.nickName;
            person.pic = this.userList[k].user.iconUrl;
            person.pos = k;
            person.new_card = 0;
            person.zhuang_num = this.userList[k].zhuang_num;
            person.hu_num = this.userList[k].hu_num;
            person.cur = this.userList[k].totalScore;
            res.settlement[k] = this.userList[k].totalScore;
            res.persons[k] = person;
        }
        var islackcoin = gapMoneyList.length > 0 ? true : false;
        for (var k in this.userList) {
            var islack = gapMoneyList.indexOf(k) != -1;
            var overReson = {};
            overReson.islackcoin = islackcoin;
            overReson.islack = islack;
            overReson.isdiss = isdiss;
            if (!this.userList[k].isbot) {
                this.userList[k].socket.emit("gameover", res, overReson);
                this.userList[k].socket.leave(this.roomID);
            }
            this.userList[k].dispose();
            this.userList[k] = null;
            delete this.userList[k];
        }

        this.panNum = 0;
        if (this.getUserCount(false) == 0) {
            this.dissovlerRoom();
        }
    }

    //游戏开始
    GameBegin(bBeginFlag) {
        this.isGaming = true;
        this.m_icountleave = 0;
        this.m_iSendCardPos = 0;
        this.m_bySendFinishCount = 0;
        this.m_iBeenPlayGame++;
        this.m_bGameStation = structData.GS_SEND_CARD;
        this.m_iLastOutCard = [];
        for (var i = 0; i < 3; i++) {
            this.m_iLastOutCard.push([]);
        }
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            this.m_iLastCardCount[i] = 0;

            if (this.userList[i - 1]) {
                this.m_bUserNetCut[i] = false;
            }
            else {
                this.m_bUserNetCut[i] = true;
            }
        }
        for (var i = 0; i < this.m_iLastOutCard.length; i++) {
            for (var j = 0; j < 45; j++) {
                this.m_iLastOutCard[i].push(0);
            }
        }
        this.m_bIsLastCard = false;
        this.m_byteHitPass = 0;


        //发送游戏开始消息
        var TGameBegin = new structData.GameBeginStruct();
        TGameBegin.iBeenPlayGame = this.m_iBeenPlayGame;
        TGameBegin.iPlayLimit = this.m_iLimitPlayGame;
        TGameBegin.iCardShape = this.m_iCardShape;
        TGameBegin.byUserMingBase = [].concat(this.m_GameMutiple.sMingPaiMutiple.slice(0, 3));
        //memcpy(TGameBegin.byUserMingBase , this.m_GameMutiple.sMingPaiMutiple , sizeof(TGameBegin.byUserMingBase)) ; 

        for (var k in this.userList) {
            this.userList[k].gameBegin(TGameBegin);
        }

        // SendWatchData(this.m_bMaxPeople,&TGameBegin, sizeof(TGameBegin), MDM_GM_GAME_NOTIFY, ASS_GAME_BEGIN, 0);


        //服务端分发所有玩家的扑克
        //测试专用
        var iCardArray = this.m_Logic.RandCard(this.m_bHaveKing);

        //地主牌
        this.m_bThrowoutCard = iCardArray[Math.round(Math.random() * 32767) % (this.m_iSendCount)];

        //拷贝玩家牌数据
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            for (var j = 0; j < this.m_iUserCount; j++) {
                this.m_iUserCard[i].push(iCardArray.shift());
            }
            //::CopyMemory(this.m_iUserCard[i],&iCardArray[this.m_iUserCount * i], sizeof(BYTE) * this.m_iUserCount);
        }
        this.m_iBackCard = [].concat(iCardArray);
        //::CopyMemory(this.m_iBackCard,&iCardArray[this.m_iSendCount], sizeof(BYTE) * this.m_iBackCount);
        this.m_Logic.InitGameTask();
        //获取底牌牌型
        if (!this.m_Logic.GetBackCardType(this.m_iBackCard, this.m_iBackCount)) {
            //随机一个任务
            this.m_Logic.GetRandTask();
        }
        var that = this;
        var timer = setTimeout(function () {
            that.SendAllCard();
        }, 200);
        this.allTimer.push(timer);

        return true;
    }

    ///一次發所有牌
    SendAllCard() {
        var TSendAll = new structData.SendAllStruct();
        if (!this.userList) return;
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            this.m_iUserCardCount[i] = this.m_iUserCount;
            TSendAll.iUserCardCount[i] = this.m_iUserCardCount[i];
        }
        //发送数据
        var iPos = 0;
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            //var iTempPos = 0;
            // for (var j = 0; j < structData.PLAY_COUNT; j++) {
            //     if (i == j || this.m_GameMutiple.sMingPaiMutiple[j] > 0) {
            //         for (var le = 0; le < this.m_iUserCardCount[j]; le++) {
            //             TSendAll.iUserCardList[iTempPos + le] = this.m_iUserCard[j + le]
            //         }
            //         TSendAll.iUserCardList[iTempPos] = this.m_iUserCard[j]
            //         //::CopyMemory(&TSendAll.iUserCardList[iTempPos],this.m_iUserCard[j],sizeof(BYTE)*this.m_iUserCardCount[j]);
            //     }
            //     iTempPos += this.m_iUserCardCount[j];
            // }
            TSendAll.iUserCardList = this.m_iUserCard[i];
            iPos += this.m_iUserCardCount[i];
            this.userList[i + 1].sendAllCard(TSendAll);
            //	SendGameData(i,&TSendAll,sizeof(TSendAll),MDM_GM_GAME_NOTIFY,ASS_SEND_ALL_CARD,0);
            //	SendWatchData(i,&TSendAll,sizeof(TSendAll),MDM_GM_GAME_NOTIFY,ASS_SEND_ALL_CARD,0);
            TSendAll.iUserCardList = [];
            //::ZeroMemory(&TSendAll.iUserCardList, sizeof(TSendAll.iUserCardList));
        }
        this.m_iSendCardPos++;
        var that = this;
        if (this.m_iSendCardPos == 1) {
            var timer = setTimeout(function () {
                that.SendCardFinish();
            }, this.m_iSendCardTime * 1000);
            this.allTimer.push(timer);
            //SetTimer(TIME_SEND_CARD_ANI, this.m_iSendCardTime * 1000); ///给玩家发牌定时器
            return true;
        }
        return false;
    }

    //发牌结束
    SendCardFinish() {
        var Tsendcardfinish = new structData.SendCardFinishStruct();
        if (!this.userList) return;
        //发送发牌结束
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            //memset(&Tsendcardfinish, 0, sizeof(Tsendcardfinish));
            this.userList[i + 1].sendCardFinish(Tsendcardfinish);
            //SendGameData(i,&Tsendcardfinish,sizeof(Tsendcardfinish),MDM_GM_GAME_NOTIFY,ASS_SEND_FINISH,0);
        }
        //SendWatchData(this.m_bMaxPeople,&Tsendcardfinish,sizeof(Tsendcardfinish),MDM_GM_GAME_NOTIFY,ASS_SEND_FINISH,0);

        /*if (this.m_bFirstCallScore == 255)
        {
        srand(GetTickCount());
        this.m_bFirstCallScore = rand()%structData.PLAY_COUNT;
        }
        SendCallScore(this.m_bFirstCallScore);*/
        ///不要叫分流程 ,直接开始抢地主和叫地主流程 

        this.m_bGameStation = structData.GS_WAIT_BACK;

        if (this.m_iFirstShow != 255)  ///有明牌开始的人
        {
            this.m_iCurrentRobPeople = this.m_iFirstShow;
        }
        else {
            this.m_iCurrentRobPeople = Math.round(Math.random() * 32767) % structData.PLAY_COUNT;
        }

        this.SendRobNT(this.m_iCurrentRobPeople);

        return true;
    }
    //发送抢地主消息
    SendRobNT(bDeskStation) {
        this.m_iGameFlag = structData.GS_FLAG_ROB_NT;				//抢地主																
        //抢地主情况
        var TRobNT = new structData.RobNTStruct();
        TRobNT.byDeskStation = bDeskStation;
        TRobNT.iValue = ((this.m_iFirstRobNt == 255) ? 0 : 1);

        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            this.userList[i + 1].socket.emit("sendRobNt", TRobNT);
            //SendGameData(i,&TRobNT,sizeof(TRobNT),MDM_GM_GAME_NOTIFY,ASS_ROB_NT,0);		
        }
        //SendWatchData(this.m_bMaxPeople,&TRobNT,sizeof(TRobNT),MDM_GM_GAME_NOTIFY,ASS_ROB_NT,0);
        var that = this;
        this.robntTimer = setTimeout(function () {
            if (that.m_bGameStation == structData.GS_WAIT_BACK) {
                that.UserRobNT(that.m_iCurrentRobPeople, 0);
            }
        }, (this.m_iRobNTTime + 3) * 1000);
        this.allTimer.push(this.robntTimer);
        //SetTimer(TIME_ROB_NT, (this.m_iRobNTTime + 3) * 1000);
        return true;
    }

    //玩家抢地主消息
    UserRobNT(bDeskStation, iValue) {
        if (bDeskStation != this.m_iCurrentRobPeople) {
            return;
        }
        if (this.m_iRobStation[bDeskStation] > 1) {
            return;
        }
        if (!this.userList) return;
        clearTimeout(this.robntTimer);
        //抢地主结果情况
        if (iValue > 0) {
            this.m_iPrepareNT = bDeskStation;
            //新一预备庄家
            this.m_iRobStation[bDeskStation] += 1;
        }
        else {
            this.m_iRobStation[bDeskStation] = 255;
        }
        var iTempValue = 0;
        if (this.m_iFirstRobNt != 255) {
            if (iValue > 0) {
                iTempValue = 3;	//抢地主
                this.m_GameMutiple.sRobNtMutiple[bDeskStation] += 1;
            }
            else {
                iTempValue = 2;	//不抢地主
            }
        }
        else {
            iTempValue = iValue;
            if (iValue > 0) {
                //   this.m_GameMutiple.sRobNtMutiple[bDeskStation] += 1;
            } else {
                iTempValue = 4;
            }
        }
        var robnt = new structData.RobNTStruct();
        robnt.byDeskStation = bDeskStation;
        robnt.iValue = iTempValue;
        robnt.byRobCount = this.m_GameMutiple.sRobNtMutiple[bDeskStation];
        robnt.gameMutiple = this.m_GameMutiple.GetPublicMutiple();
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            if (this.userList[i + 1])
                this.userList[i + 1].socket.emit("robntResult", robnt);
            //SendGameData(i,&robnt,sizeof(robnt),MDM_GM_GAME_NOTIFY,ASS_ROB_NT_RESULT,0);		  //将叫分情况发给其他用户
        }
        //SendWatchData(this.m_bMaxPeople,&robnt,sizeof(robnt),MDM_GM_GAME_NOTIFY,ASS_ROB_NT_RESULT,0);
        //如果其他两个玩家都不叫地主 那么叫地主、抢地主结束
        if (this.m_iRobStation[(bDeskStation + 1) % structData.PLAY_COUNT] == 255 && this.m_iRobStation[(bDeskStation + 2) % structData.PLAY_COUNT] == 255) {
            this.RobNTFinish();
            return;
        }
        if (this.m_iPrepareNT != 255 && this.m_iRobStation[(this.m_iPrepareNT + 1) % structData.PLAY_COUNT] == 255 && this.m_iRobStation[(this.m_iPrepareNT + 2) % structData.PLAY_COUNT] == 255) {
            this.RobNTFinish();
            return;
        }
        //如果当前操作的玩家==第一个叫地主的玩家
        if (bDeskStation == this.m_iFirstRobNt) {
            this.RobNTFinish();
            return;
        }
        ///第一个 选择抢地主的人
        if (iValue > 0 && this.m_iFirstRobNt == 255) {
            this.m_iFirstRobNt = bDeskStation;
        }
        var bDesk = this.GetRobNtDeskStation(bDeskStation);

        if (bDesk == bDeskStation) {
            this.RobNTFinish();
            return;
        }
        if (iValue > 0 && false == this.m_bRobnt) {
            this.RobNTFinish();
            return;
        }
        //记录当前操作的玩家
        this.m_iCurrentRobPeople = bDesk;
        this.SendRobNT(bDesk);
        return;
    }

    //获取下一个玩家位置
    GetNextDeskStation(bDeskStation) {
        if (!this.m_bTurnRule)//顺时针
        {
            return (bDeskStation + 1) % structData.PLAY_COUNT;
        }
        //逆时针
        return (bDeskStation + (structData.PLAY_COUNT - 1)) % structData.PLAY_COUNT;
    }

    //获取一个抢地主玩家
    GetRobNtDeskStation(bDeskStation) {
        for (var i = this.GetNextDeskStation(bDeskStation); ; i = this.GetNextDeskStation(i)) {
            if (this.m_iRobStation[i] != 255) {
                return i;
            }
        }
        return bDeskStation;
    }
    //抢地主结束
    RobNTFinish() {
        //三个人叫地主结束 如果没有人叫地主 那么游戏重新开始
        if (this.m_iPrepareNT == 255) {
            //第一个明牌的玩家就是地主
            if (this.m_iFirstShow != 255) {
                this.m_iPrepareNT = this.m_iFirstShow;
            }
            else {
                this.GameFinish(0, GF_NO_CALL_SCORE);
                return;
            }
        }
        this.m_iUpGradePeople = this.m_iPrepareNT;
        this.userList[this.m_iUpGradePeople + 1].zhuang_num++;
        //抢地主是否成功
        var robresult = new structData.RobNTStruct();
        robresult.byDeskStation = this.m_iPrepareNT;
        robresult.iValue = -1;
        var that = this;
        var timer = setTimeout(function () {
            for (var i = 0; i < structData.PLAY_COUNT; i++) {
                that.userList[i + 1].socket.emit("robntFinish", robresult);
                //SendGameData(i,&robresult,sizeof(robresult),MDM_GM_GAME_NOTIFY,ASS_ROB_NT_FINISH,0);
            }
            //SendWatchData(this.m_bMaxPeople,&robresult,sizeof(robresult),MDM_GM_GAME_NOTIFY,ASS_ROB_NT_FINISH,0);
            //抢地主结束发底牌
            that.SendBackCard();
        }, 1000);
        this.allTimer.push(timer);

        return;
    }
    //发送底牌
    SendBackCard() {
        if (this.m_bHaveSendBack) {
            return;
        }
        this.m_bHaveSendBack = true;
        this.m_iUpGradePeople = this.m_iPrepareNT;
        var BackCard = new structData.BackCardExStruct();
        BackCard.iGiveBackPeople = this.m_iUpGradePeople;
        BackCard.iBackCardCount = this.m_iBackCount;
        this.m_Logic.SetGameTask(BackCard.gameTask);
        BackCard.gameTask.byBackCardMutiple = this.m_Logic.GetBackCardMytiple();
        this.m_GameMutiple.sBackCardMutiple = this.m_Logic.GetBackCardMytiple();
        for (var i = 0; i < BackCard.iBackCardCount; i++) {
            this.m_iUserCard[this.m_iUpGradePeople].push(this.m_iBackCard[i]);
        }
        //::CopyMemory(&this.m_iUserCard[this.m_iUpGradePeople][this.m_iUserCardCount[this.m_iUpGradePeople]],this.m_iBackCard,sizeof(BYTE)*BackCard.iBackCardCount);
        this.m_iUserCardCount[this.m_iUpGradePeople] += BackCard.iBackCardCount;
        BackCard.iBackCard = [].concat(this.m_iBackCard);
        BackCard.currentMutiple = this.m_GameMutiple.GetPublicMutiple();
        BackCard.mingpaiList = this.m_GameMutiple.sMingPaiMutiple;
        BackCard.backCardType = this.m_Logic.m_byBackCardType;
        //::CopyMemory(BackCard.iBackCard,this.m_iBackCard,sizeof(BYTE)*BackCard.iBackCardCount);
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            this.userList[i + 1].socket.emit("backCardEx", BackCard);
            //SendGameData(i,&BackCard,sizeof(BackCard),MDM_GM_GAME_NOTIFY,ASS_BACK_CARD_EX,0);
        }
        //SendWatchData(this.m_bMaxPeople,&BackCard,sizeof(BackCard),MDM_GM_GAME_NOTIFY,ASS_BACK_CARD_EX,0);
        if (this.m_bAdddouble) {
            this.SendAddDouble();
        }
        else {
            this.AddDoubleFinish();
        }
    }
    //发送加棒消息
    SendAddDouble() {
        this.m_iGameFlag = structData.GS_FLAG_ADD_DOUBLE;				//加棒																
        this.m_iRecvMsg = 0;
        //抢地主情况
        var adddouble = new structData.AddDoubleStruct();
        adddouble.bDeskStation = this.m_iUpGradePeople;

        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            if (null == this.userList[i + 1]) {
                continue;
            }

            if (this.userList[this.m_iUpGradePeople + 1].user.currency < this.m_iAddDoubleLimit && this.m_iAddDoubleLimit > 0) {
                adddouble.iValue = 2;
            }
            else if (this.userList[i + 1].currency < this.m_iAddDoubleLimit && this.m_iAddDoubleLimit > 0) {
                adddouble.iValue = 1;
            }
            else {
                adddouble.iValue = 0;
            }
            this.userList[i + 1].socket.emit("addDouble", adddouble);
            //SendGameData(i,&adddouble,sizeof(adddouble),MDM_GM_GAME_NOTIFY,ASS_ADD_DOUBLE,0);		//将叫分情况发给其他用户
        }
        //SendWatchData(this.m_bMaxPeople,&adddouble,sizeof(adddouble),MDM_GM_GAME_NOTIFY,ASS_ADD_DOUBLE,0);
        var that = this;
        var timer = setTimeout(function () {
            if (that.m_bGameStation == structData.GS_WAIT_BACK) {
                that.AddDoubleResult();
            }
        }, (this.m_iAddDoubleTime + 3) * 1000);
        this.allTimer.push(timer);
        //SetTimer(TIME_ADD_DOUBLE, (this.m_iAddDoubleTime + 3) * 1000);
    }
    //加棒结果
    AddDoubleResult() {
        this.AddDoubleFinish();
    }
    //加棒结束
    AddDoubleFinish() {
        //抢地主结果情况
        var adddouble = new structData.AddDoubleStruct();
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            this.userList[i + 1].socket.emit("addDoubleFinish", adddouble);
            //SendGameData(i,&adddouble,sizeof(adddouble),MDM_GM_GAME_NOTIFY,ASS_ADD_DOUBLE_FINISH,0);		//将叫分情况发给其他用户
        }
        //SendWatchData(this.m_bMaxPeople,&adddouble,sizeof(adddouble),MDM_GM_GAME_NOTIFY,ASS_ADD_DOUBLE_FINISH,0);
        if (this.m_bShowcard && this.m_GameMutiple.sMingPaiMutiple[this.m_iUpGradePeople] == 0) {
            this.SendShowCard();
        }
        else {
            this.ShowCardFinish();
        }
        return true;
    }
    //亮牌
    SendShowCard() {
        this.m_iGameFlag = structData.GS_FLAG_SHOW_CARD;				//亮牌																
        var show = new structData.ShowCardStruct();
        show.bDeskStation = this.m_iUpGradePeople;
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            this.userList[i + 1].socket.emit("showCard", show);
            //SendGameData(i,&show,sizeof(show),MDM_GM_GAME_NOTIFY,ASS_SHOW_CARD,0);		//将叫分情况发给其他用户
        }
        //SendWatchData(this.m_bMaxPeople,&show,sizeof(show),MDM_GM_GAME_NOTIFY,ASS_SHOW_CARD,0);
        var that = this;
        var timer = setTimeout(function () {
            if (that.m_bGameStation == structData.GS_WAIT_BACK) {
                that.UserShowCard(that.m_iUpGradePeople, 0);
            }
        }, 3 * 1000);
        this.allTimer.push(timer);
        // SetTimer(TIME_SHOW_CARD, this.m_iAddDoubleTime * 1000);
    }
    //明牌结束
    ShowCardFinish() {
        this.m_iGameFlag = structData.GS_FLAG_PLAY_GAME;
        var showresult = new structData.ShowCardStruct();
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            this.userList[i + 1].socket.emit("showCardFinish", showresult);
            //SendGameData(i,&showresult,sizeof(showresult),MDM_GM_GAME_NOTIFY,ASS_SHOW_CARD_FINISH,0);		//将叫分情况发给其他用户
        }
        //SendWatchData(this.m_bMaxPeople,&showresult,sizeof(showresult),MDM_GM_GAME_NOTIFY,ASS_SHOW_CARD_FINISH,0);
        this.BeginPlay();
    }
    //明牌消息
    UserShowCard(bDeskStation, iValue) {
        if (iValue > 0) {
            if (this.m_iGameFlag == structData.GS_FLAG_SHOW_CARD)
                this.m_GameMutiple.sMingPaiMutiple[bDeskStation] = 2;
            else
                this.m_GameMutiple.sMingPaiMutiple[bDeskStation] = 5;

            if (255 == this.m_iFirstShow && structData.GS_FLAG_SHOW_CARD != this.m_iGameFlag) {
                this.m_iFirstShow = bDeskStation;
            }
        }

        var showresult = new structData.ShowCardStruct();
        showresult.bDeskStation = bDeskStation;
        showresult.iValue = iValue;

        showresult.iCardCount = this.m_iUserCardCount[bDeskStation];
        showresult.iCardList = this.m_iUserCard[bDeskStation];//[].concat(this.m_iUserCard[bDeskStation].slice(0, this.m_iUserCardCount[bDeskStation]));
        //memcpy(showresult.iCardList , this.m_iUserCard[bDeskStation] , sizeof(BYTE) *this.m_iUserCardCount[bDeskStation]) ; 
        showresult.gameMutiple = this.m_GameMutiple.GetPublicMutiple();

        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            this.userList[i + 1].socket.emit("showCardResult", showresult);
            //SendGameData(i,&showresult,sizeof(showresult),MDM_GM_GAME_NOTIFY,ASS_SHOW_CARD_RESULT,0);		//将叫分情况发给其他用户
        }
        //SendWatchData(this.m_bMaxPeople,&showresult,sizeof(showresult),MDM_GM_GAME_NOTIFY,ASS_SHOW_CARD_RESULT,0);
        if (this.m_iGameFlag == structData.GS_FLAG_SHOW_CARD)   ///庄家明牌
        {
            this.ShowCardFinish();
        }
    }
    //游戏开始
    BeginPlay() {
        //设置数据
        this.m_bGameStation = structData.GS_PLAY_GAME;
        this.m_iBaseOutCount = 0;
        this.m_iNowBigPeople = this.m_iOutCardPeople = this.m_iFirstOutPeople = this.m_iUpGradePeople;
        this.m_iDeskCardCount = [0, 0, 0];
        //排列扑克
        for (var i = 0; i < structData.PLAY_COUNT; i++)
            this.m_Logic.SortCard(this.m_iUserCard[i], null, this.m_iUserCardCount[i]);
        //发送游戏开始消息
        var Begin = new structData.BeginPlayStruct();
        Begin.iOutDeskStation = this.m_iOutCardPeople;
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            this.userList[i + 1].socket.emit("gamePlay", Begin);
            //SendGameData(i,&Begin,sizeof(Begin),MDM_GM_GAME_NOTIFY,ASS_GAME_PLAY,0);
        }
        //SendWatchData(this.m_bMaxPeople,&Begin,sizeof(Begin),MDM_GM_GAME_NOTIFY,ASS_GAME_PLAY,0);
        if (this.userList[this.m_iOutCardPeople + 1] != null) {
            var that = this;
            // 判断该断线玩家是否掉线
            if (this.userList[this.m_iOutCardPeople + 1].isOutline || this.m_bAuto[this.m_iOutCardPeople] == true) {
                // 自动出牌
                //SetTimer(TIME_OUT_CARD, 1000);

                this.timeoutTimer = setTimeout(function () {
                    that.TimerOutCard();
                }, 1000);
                this.allTimer.push(this.timeoutTimer);
            }
            else {
                this.timeoutTimer = setTimeout(function () {
                    that.TimerOutCard();
                }, (this.m_iThinkTime + 5) * 1000);
                this.allTimer.push(this.timeoutTimer);
                //SetTimer(TIME_OUT_CARD,(this.m_iThinkTime + 5)*1000);
            }
        }
    }
    //出牌时间超时自动出牌
    TimerOutCard() {
        if (this.roomType == 1 && this.m_bAuto[this.m_iOutCardPeople] == false) return;
        if (this.m_bGameStation == structData.GS_PLAY_GAME) {
            if (this.userList[this.m_iOutCardPeople + 1].isOutline) {
                this.UserAutoOutCard(this.m_iOutCardPeople);
            } else {
                this.userList[this.m_iOutCardPeople + 1].socket.emit("timeoutcard");
            }
        }
    }
    //自动出牌
    UserAutoOutCard(bDeskStation) {
        if (bDeskStation >= structData.PLAY_COUNT) {
            return;
        }
        var bCardList = [];
        for (var i = 0; i < 45; i++) {
            bCardList.push(0);
        }
        var iCardCount = 0;
        //if(bDeskStation == this.m_iFirstOutPeople)   // duanxiaohui alter 20100319
        //{
        iCardCount = this.m_Logic.AutoOutCard(this.m_iUserCard[bDeskStation], this.m_iUserCardCount[bDeskStation],
            this.m_iDeskCard[this.m_iNowBigPeople], this.m_iDeskCardCount[this.m_iNowBigPeople],
            bCardList, iCardCount, bDeskStation == this.m_iNowBigPeople);
        //}
        //else
        //{
        //	iCardCount = 0;
        //}
        return this.UserOutCard(bDeskStation, bCardList, iCardCount);
    }
    //用户出牌
    UserOutCard(bDeskStation, iOutCard, iCardCount) {
        if (bDeskStation != this.m_iOutCardPeople) {
            return true;
        }
        else {
            //当前最大出牌的玩家不能不出
            if (0 == iCardCount && bDeskStation == this.m_iNowBigPeople) {
                return true;
            }
        }
        if (!this.userList) return;
        //处理服务器牌
        if (iCardCount > 0) {
            //增加出牌逻辑合法性判断zht 2010-03-23
            if (!this.m_Logic.CanOutCard(iOutCard, iCardCount, this.m_iDeskCard[this.m_iNowBigPeople], this.m_iDeskCardCount[this.m_iNowBigPeople],
                this.m_iUserCard[bDeskStation], this.m_iUserCardCount[bDeskStation], bDeskStation == this.m_iNowBigPeople)) {
                if (bDeskStation != this.m_iNowBigPeople) {
                    iCardCount = 0;
                    //某一位置什麼牌也不出
                    this.m_iDeskCardCount[bDeskStation] = iCardCount;

                    this.m_byteHitPass |= (1 << bDeskStation);	//记录PASS
                    this.m_byPass[bDeskStation] = true;
                }
                else {
                    return;
                }
            }
            if (this.m_Logic.RemoveCard(iOutCard, iCardCount, this.m_iUserCard[bDeskStation], this.m_iUserCardCount[bDeskStation]) == 0) {
                if (bDeskStation != this.m_iNowBigPeople) {
                    iCardCount = 0;
                    //某一位置什麼牌也不出
                    this.m_iDeskCardCount[bDeskStation] = iCardCount;

                    this.m_byteHitPass |= (1 << bDeskStation);	//记录PASS
                    this.m_byPass[bDeskStation] = true;
                }
                else {
                    return;
                }
            }
            this.m_iUserCardCount[bDeskStation] -= iCardCount;
            //记录出牌信息
            this.m_iDeskCardCount[bDeskStation] = iCardCount;
            this.m_iDeskCard[bDeskStation] = [].concat(iOutCard);
            //::CopyMemory(this.m_iDeskCard[bDeskStation], iOutCard, sizeof(BYTE) * iCardCount);
            this.m_byPass[bDeskStation] = false;
            if (0 == this.m_iNtFirstCount)		//地主出的第一手牌
            {
                this.m_iNtFirstCount = iCardCount;
            }
            this.m_iNowBigPeople = bDeskStation;
            this.m_iBaseOutCount = iCardCount;
        }
        else {
            //某一位置什麼牌也不出
            this.m_iDeskCardCount[bDeskStation] = iCardCount;

            this.m_byteHitPass |= (1 << bDeskStation);	//记录PASS
            this.m_byPass[bDeskStation] = true;
        }

        clearTimeout(this.timeoutTimer);
        //是否为加分牌型
        this.IsAwardPoin(iOutCard, iCardCount, bDeskStation);
        //发送玩家出牌结果
        var UserOutResult = new structData.OutCardMsg();
        UserOutResult.bDeskStation = bDeskStation;
        UserOutResult.iCardCount = iCardCount;
        UserOutResult.iCardList = [].concat(iOutCard);
        UserOutResult.gameMutiple = this.m_GameMutiple.GetPublicMutiple();
        //::CopyMemory(UserOutResult.iCardList, iOutCard, sizeof(BYTE) * iCardCount);
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            if (this.userList[i + 1])
                this.userList[i + 1].socket.emit("outCardResult", UserOutResult);
            // SendGameData(i,&UserOutResult, sizeof(OutCardMsg), MDM_GM_GAME_NOTIFY, ASS_OUT_CARD_RESULT, 0);
        }
        //SendWatchData(this.m_bMaxPeople,&UserOutResult, sizeof(OutCardMsg), MDM_GM_GAME_NOTIFY, ASS_OUT_CARD_RESULT, 0);

        //====判断是否这个玩家是否出完牌
        if (this.m_iUserCardCount[bDeskStation] <= 0) {
            this.m_Logic.SetLastCardData(iOutCard, iCardCount);
            this.m_iDealPeople = bDeskStation;
            //出完牌各參數設置
            // SetTimer(TIME_GAME_FINISH, 1000);
            var that = this;
            var timer = setTimeout(function () {
                if (that.m_bGameStation == structData.GS_PLAY_GAME)
                    that.GameFinish(0, GF_NORMAL);
            }, 1000);
            this.allTimer.push(timer);
            return true;
        }
        //所出的牌最大,重新开始新一轮
        if (this.m_Logic.IsKingBomb(iOutCard, iCardCount)) {
            this.m_iNowBigPeople = this.m_iFirstOutPeople = this.m_iOutCardPeople = bDeskStation;
            var that = this;
            var timer = setTimeout(function () {
                that.IsNewTurn();
            }, 1000);
            this.allTimer.push(timer);
            return true;
        }
        //计算下一轮出牌者
        this.m_iOutCardPeople = this.GetNextDeskStation(bDeskStation);//(bDeskStation+1)%structData.PLAY_COUNT;
        for (var i = this.m_iOutCardPeople; ; i = this.GetNextDeskStation(i)) {
            this.m_iOutCardPeople = i;				//当前出牌者
            if (this.IsNewTurn())
                return true;
            //当前出牌者有牌未出
            if (this.m_iUserCardCount[i] > 0)
                break;
        }
        var UserOut = new structData.OutCardMsg();
        UserOut.iNextDeskStation = this.m_iOutCardPeople;
        UserOut.iCardCount = 0;
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            this.userList[i + 1].socket.emit("outCard", UserOut);
            //SendGameData(i,&UserOut, sizeof(OutCardMsg), MDM_GM_GAME_NOTIFY, ASS_OUT_CARD, 0);
        }
        //SendWatchData(this.m_bMaxPeople,&UserOut, sizeof(OutCardMsg), MDM_GM_GAME_NOTIFY, ASS_OUT_CARD, 0);
        // duanxiaohui 增加 20100319
        if (this.userList[this.m_iOutCardPeople + 1] != null) {
            // 判断该断线玩家是否掉线
            var that = this;
            if (this.userList[this.m_iOutCardPeople + 1].isOutline || this.m_bAuto[this.m_iOutCardPeople] == true) {
                // 自动出牌
                this.timeoutTimer = setTimeout(function () {
                    that.TimerOutCard();
                }, 1000);
                this.allTimer.push(this.timeoutTimer);
                // SetTimer(TIME_OUT_CARD, 1000);
            }
            else {
                this.timeoutTimer = setTimeout(function () {
                    that.TimerOutCard();
                }, (this.m_iThinkTime + 1) * 1000);
                this.allTimer.push(this.timeoutTimer);
                //  SetTimer(TIME_OUT_CARD, (this.m_iThinkTime + 1) * 1000);
            }
        }
        return;
    }
    //所出牌中讨赏设置
    IsAwardPoin(iOutCard, iCardCount, bDeskStation) {
        if (this.m_Logic.IsKingBomb(iOutCard, iCardCount) || this.m_Logic.IsBomb(iOutCard, iCardCount)) {
            this.m_GameMutiple.sBombCount += 1;
            this.m_iAwardPoint[bDeskStation] += 1;
            var award = new structData.AwardPointStruct();
            award.iAwardPoint = this.m_iAwardPoint[bDeskStation];
            award.bDeskStation = bDeskStation;
            //发送奖分情况
            for (var i = 0; i < structData.PLAY_COUNT; i++) {
                this.userList[i + 1].socket.emit("awardPoint", award);
                //SendGameData(i,&award,sizeof(award),MDM_GM_GAME_NOTIFY,ASS_AWARD_POINT,0);
            }
            //SendWatchData(this.m_bMaxPeople,&award,sizeof(award),MDM_GM_GAME_NOTIFY,ASS_AWARD_POINT,0);
        }
        return true;
    }
    //是否為新一輪
    IsNewTurn() {
        if (this.m_iOutCardPeople == this.m_iFirstOutPeople) {
            for (var i = 0; i < structData.PLAY_COUNT; i++)
                this.userList[i + 1].socket.emit("oneTurnOver");
            //SendGameData(i,MDM_GM_GAME_NOTIFY,ASS_ONE_TURN_OVER,0);
            //SendWatchData(this.m_bMaxPeople,MDM_GM_GAME_NOTIFY,ASS_ONE_TURN_OVER,0);
        }
        if (this.m_iOutCardPeople == this.m_iNowBigPeople)			//最先出牌者
        {
            //this.m_iOutCardPeople = -1;
            var that = this;
            var timer = setTimeout(function () {
                if (that.m_bGameStation == structData.GS_PLAY_GAME)
                    that.NewPlayTurn(that.m_iNowBigPeople);
            }, 500);
            this.allTimer.push(timer);
            //  SetTimer(TIME_WAIT_NEWTURN, 1000);
            return true;
        }
        return false;
    }

    //游戏结束
    GameFinish(bDeskStation, bCloseFlag) {
        console.log("wysouthlddz:: bDeskStation == " + bDeskStation + " , bCloseFlag==" + bCloseFlag);
        //编写代码
        switch (bCloseFlag) {
            case GF_NORMAL:		//游戏正常结束
                {
                    this.panNum++;
                    //设置数据 
                    this.m_bGameStation = structData.GS_WAIT_ARGEE;
                    for (var i = 0; i < structData.PLAY_COUNT; i++) {
                        if (this.userList[i + 1] != null)
                            this.userList[i + 1].currentState = structData.USER_SITTING;
                    }
                    ///游戏结束后所有玩家取消托管
                    for (var i = 0; i < structData.PLAY_COUNT; i++) {
                        if (null != this.userList[i + 1]) {
                            this.UserSetAuto(i, false);
                        }
                    }
                    //游戏结束
                    var GameEnd = new structData.GameEndStruct();
                    GameEnd.iTurePoint = [0, 0, 0];
                    for (var i = 0; i < structData.PLAY_COUNT; i++) {
                        GameEnd.iUserCardCount[i] = this.m_iUserCardCount[i];
                        GameEnd.iUserCard[i] = [].concat(this.m_iUserCard[i]);
                    }
                    ///任务完成情况
                    GameEnd.bFinishTask = this.m_Logic.IsFinishTask();

                    if (this.GetNoOutCard()) {
                        this.m_GameMutiple.sSprintMutiple = 2;
                    }
                    // this.m_GameMutiple.sCardShapeMutiple = this.m_Logic.GetTaskMutiple(GameEnd.bFinishTask); //完成任务取得的倍数
                    GameEnd.gameMutiple = this.m_GameMutiple;  ///任务中的事件全部获得
                    var iTurePoint = this.m_GameMutiple.GetPublicMutiple();
                    //是谁胜
                    if (this.m_iUserCardCount[this.m_iUpGradePeople] == 0) {
                        iTurePoint = iTurePoint;
                    }
                    else {
                        iTurePoint = -iTurePoint;
                    }

                    if (this.m_iLimitPoint > 0 && Math.abs(iTurePoint) < this.m_iLimitPoint)  //公共倍数限制
                    {
                        iTurePoint = iTurePoint > 0 ? (this.m_iLimitPoint) : (-this.m_iLimitPoint);
                    }

                    GameEnd.iUpGradeStation = this.m_iUpGradePeople;
                    GameEnd.iUserCard = [].concat(this.m_iUserCard);
                    //memcpy(&GameEnd.iUserCard,&this.m_iUserCard,sizeof(GameEnd.iUserCard));
                    GameEnd.iUserCardCount = [].concat(this.m_iUserCardCount);

                    var iNtMutiple = this.m_GameMutiple.sAddGameMutiple[this.m_iUpGradePeople] > 0 ? 2 : 1;

                    for (var i = 0; i < structData.PLAY_COUNT; i++) {
                        var iMyMutiple = this.m_GameMutiple.sAddGameMutiple[i] > 0 ? 2 : 1;

                        if (i == this.m_iUpGradePeople)//庄家
                        {
                            continue;
                        }
                        else {
                            GameEnd.iTurePoint[i] = -iTurePoint * iNtMutiple * iMyMutiple;//加棒
                        }

                        GameEnd.iTurePoint[this.m_iUpGradePeople] -= GameEnd.iTurePoint[i];
                    }

                    ///一下计算玩家的得分情况，如果是金币场的话需要判断是否超过玩家身上的钱，如果是积分场则不需判断
                    if (this.roomType != 1) {
                        var hasobj = { 1: "roomcard", 2: "normal", 3: "middle", 4: "hight" };
                        var roomcfg = think.config("roomcfg");
                        var cfgData = roomcfg[hasobj[this.roomType]];
                        var iBasePoint = cfgData.baseScore;

                        if (iBasePoint < 1) {
                            iBasePoint = 1;
                        }
                        ///统计大小时算上游戏中的倍数
                        for (var i = 0; i < structData.PLAY_COUNT; i++) {
                            GameEnd.iTurePoint[i] *= iBasePoint;
                        }
                        var iLimitMoney = this.userList[this.m_iUpGradePeople + 1].user.currency;
                        if (this.m_iGameMaxLimit > 0) {
                            iLimitMoney = Math.min(iLimitMoney, this.m_iGameMaxLimit);
                        }
                        ///添加房间限制和玩家赢钱不能大于自己的钱
                        if (iLimitMoney < Math.abs(GameEnd.iTurePoint[this.m_iUpGradePeople]) && 0 != GameEnd.iTurePoint[this.m_iUpGradePeople]) {
                            var fPercent = Math.abs(iLimitMoney / Number(GameEnd.iTurePoint[this.m_iUpGradePeople]));
                            //GameEnd.iTurePoint[this.m_iUpGradePeople] *= fPercent ;
                            //GameEnd.iTurePoint[(this.m_iUpGradePeople + 2)%structData.PLAY_COUNT] = - GameEnd.iTurePoint[this.m_iUpGradePeople] - GameEnd.iTurePoint[(this.m_iUpGradePeople + 1)%structData.PLAY_COUNT] ; 
                            GameEnd.iTurePoint[(this.m_iUpGradePeople + 1) % structData.PLAY_COUNT] *= fPercent;
                            GameEnd.iTurePoint[(this.m_iUpGradePeople + 2) % structData.PLAY_COUNT] *= fPercent;
                        }

                        for (var i = 0; i < structData.PLAY_COUNT; i++) {
                            if (i == this.m_iUpGradePeople) {
                                continue;
                            }
                            if (Math.abs(GameEnd.iTurePoint[i]) > this.userList[i + 1].user.currency) {
                                GameEnd.iTurePoint[i] = this.userList[i + 1].user.currency * (iTurePoint > 0 ? -1 : 1);
                            }
                        }
                        //GameEnd.iTurePoint[this.m_iUpGradePeople] = -GameEnd.iTurePoint[(this.m_iUpGradePeople + 1)%structData.PLAY_COUNT] -GameEnd.iTurePoint[(this.m_iUpGradePeople + 2)%structData.PLAY_COUNT] ; 
                        ///统计大小时算上游戏中的倍数
                        // for (var i = 0; i < structData.PLAY_COUNT; i++) {
                        //     if (i == this.m_iUpGradePeople) {
                        //         continue;
                        //     }

                        //     GameEnd.iTurePoint[i] /= iBasePoint;
                        // }

                        GameEnd.iTurePoint[this.m_iUpGradePeople] = -GameEnd.iTurePoint[(this.m_iUpGradePeople + 1) % structData.PLAY_COUNT] - GameEnd.iTurePoint[(this.m_iUpGradePeople + 2) % structData.PLAY_COUNT];
                    }

                    var temp_cut = [0, 0, 0];
                    //this.ChangeUserPointint64(GameEnd.iTurePoint, temp_cut);
                    // __super::RecoderGameInfo(GameEnd.iChangeMoney); 战绩
                    var resultlist = {};
                    for (var k in this.userList) {
                        var resultData = {};
                        resultData.nick = this.userList[k].user.nickName;
                        resultData.gain = GameEnd.iTurePoint[+k - 1];
                        if (resultData.gain > 0)
                            this.userList[k].hu_num++;
                        this.userList[k].totalScore += resultData.gain;
                        resultlist[k] = resultData;
                    }
                    var userRecordList = [];
                    for (var k in this.userList) {
                        if (!this.userList[k].isbot) {
                            var userData = {};
                            userData.uid = this.userList[k].user.uid;
                            var recordData = {};
                            recordData.gain = GameEnd.iTurePoint[+k - 1];
                            recordData.resultList = resultlist;
                            recordData.roomId = this.roomID;
                            recordData.isWinner = GameEnd.iTurePoint[+k - 1] > 0;
                            userData.recordData = recordData;
                            userRecordList.push(userData);
                        }
                        if (this.roomType != 1) {
                            this.userList[k].user.currency += GameEnd.iTurePoint[+k - 1];
                        }
                    }
                    think.model('user', think.config('db'), 'home').updateUsersRecord(userRecordList, this.roomType);
                    // this.m_bGameStation = structData.GS_WAIT_NEXT;
                    // for (var k in this.userList) {
                    //     this.userList[k].socket.emit("continueEnd", GameEnd);
                    // }
                    //继续
                    if (this.currentRound > this.maxRound)//本轮结束
                    {
                        this.m_bGameStation = structData.GS_WAIT_ARGEE;

                        for (var i = 0; i < structData.PLAY_COUNT; i++)
                            this.userList[i + 1].socket.emit("continueEnd", GameEnd);
                        //SendGameData(i,&GameEnd,sizeof(GameEnd),MDM_GM_GAME_NOTIFY,ASS_NO_CONTINUE_END,0);
                        //SendWatchData(this.m_bMaxPeople,&GameEnd,sizeof(GameEnd),MDM_GM_GAME_NOTIFY,ASS_NO_CONTINUE_END,0);
                        this.ReSetGameState(bCloseFlag);
                        //圈数结束
                        if (this.roomType == 1) {
                            this.gameover();
                            return;
                        }
                        return;
                    }
                    else//下一局开始
                    {
                        for (var i = 0; i < structData.PLAY_COUNT; i++)
                            this.userList[i + 1].socket.emit("continueEnd", GameEnd);
                        //SendGameData(i,&GameEnd,sizeof(GameEnd),MDM_GM_GAME_NOTIFY,ASS_CONTINUE_END,0);
                        //SendWatchData(this.m_bMaxPeople,&GameEnd,sizeof(GameEnd),MDM_GM_GAME_NOTIFY,ASS_CONTINUE_END,0);
                        //设置数据 
                        this.m_bGameStation = structData.GS_WAIT_NEXT;
                    }
                    this.ReSetGameState(bCloseFlag);
                    return true;
                }
            case GF_NO_CALL_SCORE:
                {
                    //设置数据 
                    this.m_bGameStation = structData.GS_WAIT_ARGEE;

                    var bhavecut = false;
                    for (var i = 0; i < structData.PLAY_COUNT; i++) {
                        if (this.userList[i + 1] != null) {
                            if (this.userList[i + 1].user.currentState == structData.USER_CUT_GAME) {
                                bhavecut = true;
                                break;
                            }
                            this.userList[i + 1].user.currentState = structData.USER_ARGEE;
                        }
                    }
                    if (bhavecut) {
                        this.GameFinish(255, GF_SAFE);
                        return true;
                    }
                    //游戏结束
                    var GameEnd = new structData.GameEndStruct();
                    //发送数据
                    for (var i = 0; i < structData.PLAY_COUNT; i++) {
                        if (this.userList[i + 1])
                            this.userList[i + 1].socket.emit("nocallScoreEnd", GameEnd);
                    }

                    //SendGameData(i,&GameEnd,sizeof(GameEnd),MDM_GM_GAME_NOTIFY,ASS_NO_CALL_SCORE_END,0);
                    //SendWatchData(this.m_bMaxPeople,&GameEnd,sizeof(GameEnd),MDM_GM_GAME_NOTIFY,ASS_NO_CALL_SCORE_END,0);

                    this.ReSetGameState(GF_NORMAL);

                    this.GameBegin(0);
                    return true;
                }
            // case GFF_SAFE_FINISH:
            case GF_SAFE:			//游戏安全结束
                {
                    //设置数据
                    this.m_bGameStation = structData.GS_WAIT_ARGEE;//GS_WAIT_SETGAME;

                    for (var i = 0; i < structData.PLAY_COUNT; i++) {
                        if (this.userList[i + 1] != null)
                            this.userList[i + 1].currentState = structData.USER_SITTING;
                    }
                    var CutEnd = new structData.GameCutStruct();
                    CutEnd.bDeskStation = -1;

                    for (var i = 0; i < structData.PLAY_COUNT; i++)
                        this.userList[i + 1].socket.emit("safaEnd", CutEnd);
                    //SendGameData(i,&CutEnd,sizeof(CutEnd),MDM_GM_GAME_NOTIFY,ASS_SAFE_END,0);
                    //SendWatchData(this.m_bMaxPeople,&CutEnd,sizeof(CutEnd),MDM_GM_GAME_NOTIFY,ASS_SAFE_END,0);
                    bCloseFlag = GF_SAFE;
                    this.ReSetGameState(bCloseFlag);
                    return true;
                }
            // case GFF_FORCE_FINISH:		//用户断线离开
            //     {
            //         this.m_bGameStation = GS_WAIT_ARGEE;
            //         for (var i = 0; i < structData.PLAY_COUNT; i++) {
            //             if (this.userList[i + 1] != null)
            //                 this.userList[i + 1].currentState = USER_SITTING;
            //         }
            //         var CutEnd = new structData.GameCutStruct();
            //         CutEnd.bDeskStation = bDeskStation;
            //         CutEnd.iTurePoint[bDeskStation] = - this.GetRunPublish(bDeskStation);
            //         CutEnd.iTurePoint[(bDeskStation + 1) % structData.PLAY_COUNT] = this.GetRunAwayOtherGetPoint((bDeskStation + 1) % structData.PLAY_COUNT, bDeskStation);
            //         CutEnd.iTurePoint[(bDeskStation + 2) % structData.PLAY_COUNT] = this.GetRunAwayOtherGetPoint((bDeskStation + 2) % structData.PLAY_COUNT, bDeskStation);
            //         var temp_cut = [0, 0, 0,];
            //         for (var i = 0; i < structData.PLAY_COUNT; i++) {
            //             temp_cut[i] = (bDeskStation == i && CutEnd.iTurePoint[i] < 0);
            //         }

            //         this.ChangeUserPointint64(CutEnd.iTurePoint, temp_cut);
            //         //__super::RecoderGameInfo(CutEnd.iChangeMoney); //战绩

            //         for (var i = 0; i < structData.PLAY_COUNT; i++)
            //             this.userList[i + 1].socket.emit("cutEnd", CutEnd);
            //         //SendGameData(i,&CutEnd,sizeof(CutEnd),MDM_GM_GAME_NOTIFY,ASS_CUT_END,0);
            //         //SendWatchData(this.m_bMaxPeople,&CutEnd,sizeof(CutEnd),MDM_GM_GAME_NOTIFY,ASS_CUT_END,0);
            //         bCloseFlag = GFF_FORCE_FINISH;
            //         this.ReSetGameState(bCloseFlag);
            //         return;
            //     }
            case GF_AHEAD_END://提前结束
                {
                    //设置数据 
                    this.m_bGameStation = structData.GS_WAIT_ARGEE;

                    for (var i = 0; i < structData.PLAY_COUNT; i++) {
                        if (this.userList[i + 1] != null)
                            this.userList[i + 1].currentState = structData.USER_SITTING;
                    }
                    var CutEnd = new structData.GameCutStruct();
                    for (var i = 0; i < structData.PLAY_COUNT; i++)
                        this.userList[i + 1].socket.emit("aheadEnd", CutEnd);
                    //SendGameData(i,&CutEnd,sizeof(CutEnd),MDM_GM_GAME_NOTIFY,ASS_AHEAD_END,0);
                    //SendWatchData(this.m_bMaxPeople,&CutEnd,sizeof(CutEnd),MDM_GM_GAME_NOTIFY,ASS_AHEAD_END,0);
                    bCloseFlag = GF_AHEAD_END;
                    this.ReSetGameState(bCloseFlag);
                    return true;
                }
        }
        //重置数据
        this.ReSetGameState(bCloseFlag);
        //__super::GameFinish(bDeskStation,bCloseFlag);
        return true;
    }
    //托管设置
    UserSetAuto(bDeskStation, bAutoCard) {
        this.m_bAuto[bDeskStation] = bAutoCard;
        if (this.m_bGameStation == structData.GS_PLAY_GAME) {
            if (this.m_iOutCardPeople == bDeskStation) {
                clearTimeout(this.timeoutTimer);
                var that = this;
                this.timeoutTimer = setTimeout(function () {
                    that.TimerOutCard();
                }, (this.m_iThinkTime) * 1000);
                this.allTimer.push(this.timeoutTimer);
            }
        }
        var autoset = new structData.AutoStruct();
        autoset.bAuto = bAutoCard;
        autoset.bDeskStation = bDeskStation;

        for (var i = 0; i < structData.PLAY_COUNT; i++)
            this.userList[i + 1].socket.emit("auto", autoset);
        //	SendGameData(i,&autoset,sizeof(autoset),MDM_GM_GAME_NOTIFY,ASS_AUTO,0);
        //SendWatchData(this.m_bMaxPeople,&autoset,sizeof(autoset),MDM_GM_GAME_NOTIFY,ASS_AUTO,0);
        return true;
    }
    //是否为未出过牌
    GetNoOutCard() {
        var bOutCard = false;
        //两闲家没有出过牌
        if (this.m_iUserCardCount[(this.m_iUpGradePeople + 1) % structData.PLAY_COUNT] == this.m_iUserCardCount[(this.m_iUpGradePeople + 2) % structData.PLAY_COUNT]
            && this.m_iUserCardCount[(this.m_iUpGradePeople + 2) % structData.PLAY_COUNT] == 17) {
            bOutCard = true;
        }
        //庄家仅出了第一首牌
        if (this.m_iUserCardCount[this.m_iUpGradePeople] == 20 - this.m_iNtFirstCount) {
            bOutCard = true;
        }
        return bOutCard;
    }
    //重置游戏状态
    ReSetGameState(bLastStation) {
        this.clearAllTimer();
        if (bLastStation == GF_SAFE) {
            this.m_iWinPoint = [0, 0, 0];
            this.m_iAIStation = [0, 0, 0];
            this.m_iBeenPlayGame = 0;
            this.m_iDealPeople = -1;
        }
        this.m_iPrepareNT = 255;		//预备庄家
        this.m_iCurrentRobPeople = 255;
        this.m_iFirstRobNt = 255;
        this.m_iFirstShow = 255;
        this.m_iUpGradePeople = -1;
        this.m_iFirstCutPeople = 255;
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            this.m_iAwardPoint[i] = 0;
        }
        this.m_iUserCard = [];			//用户手上的扑克
        for (var i = 0; i < 3; i++) {
            this.m_iUserCard.push([]);
        }
        this.m_iDeskCard = [];
        for (var i = 0; i < 3; i++) {
            this.m_iDeskCard.push([]);
        }
        this.m_iGameFlag = structData.GS_FLAG_NORMAL;
        this.m_bCurrentCallScore = 255;
        this.m_iNtFirstCount = 0;		//庄家出的第一手牌数量
        this.m_iLeaveArgee = 0;
        this.m_iBaseOutCount = 0;
        this.m_iNowBigPeople = -1;
        this.m_iOutCardPeople = -1;
        this.m_iSendCardPos = 0;
        this.m_bFirstCallScore = 255;
        this.m_bHaveSendBack = false;
        this.m_bUserReady = [false, false, false];
        this.m_iDeskCardCount = [0, 0, 0];
        this.m_iUserCardCount = [0, 0, 0];
        this.m_iAIStation = [0, 0, 0];
        this.m_bAuto = [0, 0, 0];
        this.m_iCallScore = [-1, -1, -1];
        this.m_iRobStation = [-1, -1, -1];
        this.m_iAddStation = [-1, -1, -1];
        this.m_GameMutiple.initData(this.m_iBaseMult);

        if (this.roomType != 1) {
            this.isGaming = false;
            var that = this;
            setTimeout(function () {
                for (var k in that.userList) {
                    if (that.userList[k].isOutline) {
                        that.onKickUser(k);
                    }
                }
            }, 3500);

        }

    }
    //叫分
    UserCallScore(bDeskStation, iVal) {
        if (bDeskStation != this.m_bCurrentCallScore) {
            return true;
        }
        if (iVal == 0) {
            this.m_iCallScore[bDeskStation] = 0;		//====某位置不叫分
        }
        else {
            this.m_iCallScore[bDeskStation] = iVal;	//叫分类型

            this.m_iPrepareNT = bDeskStation;				//最后叫分者

            if (iVal == 3)						//有人直接叫3分
            {
                var callscore = new structData.CallScoreStruct();
                callscore.bDeskStation = bDeskStation;
                callscore.bCallScoreflag = FALSE;
                callscore.iValue = this.m_iCallScore[bDeskStation];		//当前叫分类型保存

                for (var i = 0; i < structData.PLAY_COUNT; i++)
                    this.userList[i + 1].socket.emit("callScoreResult", callscore);
                //SendGameData(i,&callscore,sizeof(callscore),MDM_GM_GAME_NOTIFY,ASS_CALL_SCORE_RESULT,0);		//将叫分情况发给其他用户
                this.CallScoreFinish();
                return true;
            }
        }
        var callscore = new structData.CallScoreStruct();
        callscore.bDeskStation = bDeskStation;
        callscore.bCallScoreflag = FALSE;
        callscore.iValue = this.m_iCallScore[bDeskStation];		//当前叫分类型保存

        for (var i = 0; i < structData.PLAY_COUNT; i++)
            this.userList[i + 1].socket.emit("callScoreResult", callscore);
        //SendGameData(i,&callscore,sizeof(callscore),MDM_GM_GAME_NOTIFY,ASS_CALL_SCORE_RESULT,0);		//将叫分情况发给其他用户
        //SendWatchData(this.m_bMaxPeople,&callscore,sizeof(callscore),MDM_GM_GAME_NOTIFY,ASS_CALL_SCORE_RESULT,0);
        var iNextPeople = this.GetNextDeskStation(bDeskStation);
        if (this.m_iCallScore[iNextPeople] == 0) {
            this.CallScoreFinish();
            return true;
        }
        if (this.m_iCallScore[iNextPeople] == -1) {
            this.SendCallScore(iNextPeople);
            return TRUE;
        }
        this.CallScoreFinish();
        return true;
    }
    //玩家加棒
    UserAddDouble(bDeskStation, iVal) {
        if (this.m_iAddStation[bDeskStation] > 0) {
            return;
        }
        this.m_iRecvMsg++;
        if (iVal > 0) {
            this.m_GameMutiple.sAddGameMutiple[bDeskStation] = 1;
            this.m_iAddStation[bDeskStation] = iVal;
        }
        else {
            this.m_iAddStation[bDeskStation] = 255;
        }
        //抢地主结果情况
        var adddouble = new structData.AddDoubleStruct();;
        adddouble.bDeskStation = bDeskStation;
        adddouble.iValue = iVal;
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            this.userList[i + 1].socket.emit("addDoubleResult", adddouble);
            //SendGameData(i,&adddouble,sizeof(adddouble),MDM_GM_GAME_NOTIFY,ASS_ADD_DOUBLE_RESULT,0);		//将叫分情况发给其他用户
        }
        //SendWatchData(this.m_bMaxPeople,&adddouble,sizeof(adddouble),MDM_GM_GAME_NOTIFY,ASS_ADD_DOUBLE_RESULT,0);
        if (this.m_iRecvMsg >= 3) {
            this.AddDoubleResult();
        }
    }
    //用户请求离开
    UserHaveThing(bDeskStation, szMessage) {
        // 已经点过退出按钮(一局只能单击一次)
        if (!this.m_bCanleave[bDeskStation])
            return;

        if (this.m_bGameStation < structData.GS_SEND_CARD)
            return;

        if (this.m_iHaveThingPeople != bDeskStation) {
            this.m_iLeaveArgee = 0;
        }

        this.m_icountleave = 0;
        this.m_iHaveThingPeople = bDeskStation;
        this.m_iLeaveArgee |= 1 << bDeskStation;
        this.m_bCanleave[bDeskStation] = false;

        if (this.m_iLeaveArgee != 7) {
            var HaveThing = new structData.HaveThingStruct();
            HaveThing.pos = bDeskStation;
            HaveThing.szMessage = szMessage;

            for (var i = 0; i < structData.PLAY_COUNT; i++)
                if (i != bDeskStation)
                    this.userList[i + 1].socket.emit("haveThing", HaveThing);
            //SendGameData(i,&HaveThing,sizeof(HaveThing),MDM_GM_GAME_NOTIFY,ASS_HAVE_THING,0);
        }
        else
            this.GameFinish(255, GF_SAFE);
    }
    //同意用户离开
    ArgeeUserLeft(bDeskStation, bArgee) {
        this.m_icountleave++;
        if (bArgee) this.m_iLeaveArgee |= 1 << bDeskStation;
        else
            this.m_iLeaveArgee = 0;
        if (this.m_iLeaveArgee != 7)				//3个人游戏
        {
            var Leave = new structData.LeaveResultStruct();
            Leave.bDeskStation = bDeskStation;
            Leave.bArgeeLeave = bArgee;
            for (var i = 0; i < structData.PLAY_COUNT; i++)
                if (i != bDeskStation)
                    this.userList[i + 1].socket.emit("leftResult", Leave);
            //SendGameData(i,&Leave,sizeof(Leave),MDM_GM_GAME_NOTIFY,ASS_LEFT_RESULT,0);
        }
        else {
            this.GameFinish(255, GF_SAFE);
            var Leave1 = new structData.LeaveResultStruct();
            Leave1.bDeskStation = this.m_iHaveThingPeople;
            Leave1.bArgeeLeave = true;
            this.userList[this.m_iHaveThingPeople + 1].socket.emit("leftResult", Leave1);
            //SendGameData(this.m_iHaveThingPeople,&Leave1,sizeof(Leave1),MDM_GM_GAME_NOTIFY,ASS_LEFT_RESULT,0);
        }
        if (this.m_icountleave >= 2) {
            this.m_iLeaveArgee = 0;
        }
    }

    //获取游戏状态信息
    OnGetGameStation(uid, socket, bWatchUser = false) {
        var bDeskStation = -1;
        for (var k in this.userList) {
            if (this.userList[k].user.uid == uid) {
                bDeskStation = +k - 1;
                this.userList[k].setSocket(socket);
            }
        }
        /// 玩家重连，表示不在托管状态，因此在这里设置为不托管
        if (!bWatchUser) {
            this.m_bAuto[bDeskStation] = false;
        }
        switch (this.m_bGameStation) {
            // case structData.GS_WAIT_SETGAME:		//游戏没有开始状态
            // case structData.GS_WAIT_ARGEE:			//等待玩家开始状态
            //     {
            //         var GameStation = new structData.GameStation_2();
            //         //游戏版本核对
            //         GameStation.iVersion = 2;			//游戏高版本
            //         GameStation.iVersion2 = 1;			//低版本
            //         //游戏内容设置
            //         GameStation.iCardShape = this.m_iCardShape;						//牌型设置
            //         //辅助时间
            //         GameStation.iBeginTime = this.m_iBeginTime;				//游戏开始时间设置
            //         GameStation.iThinkTime = this.m_iThinkTime;				//游戏思考时间
            //         GameStation.iCallScoreTime = this.m_iCallScoreTime;			//叫分时间
            //         GameStation.iRobNTTime = this.m_iRobNTTime;
            //         GameStation.iAddDoubleTime = this.m_iAddDoubleTime;			//叫分时间
            //         //房间倍数
            //         GameStation.iDeskBasePoint = this.GetDeskBasePoint();	//桌子倍数
            //         GameStation.iRoomBasePoint = this.GetRoomMul();	//房间倍数
            //         GameStation.iRunPublish = this.GetRunPublish();			//逃跑扣分

            //         GameStation.iGameMutiple = this.m_iBaseMult;
            //         GameStation.iAddDoubleLimit = this.m_iAddDoubleLimit;
            //         GameStation.iGameMaxLimit = this.m_iGameMaxLimit;
            //         GameStation.bUserReady = this.m_bUserReady;
            //         this.userList[bDeskStation + 1].socket.emit("getGamestation2", GameStation);
            //         //SendGameStation(bDeskStation,uSocketID,bWatchUser,&GameStation,sizeof(GameStation));
            //         return true;
            //     }
            case structData.GS_SEND_CARD:		//发牌状态
            case structData.GS_WAIT_BACK:		//等待埋底牌状态
                {
                    //发送取消机器人托管
                    var GameStation = new structData.GameStation_3();
                    //游戏版本核对
                    GameStation.iVersion = 2;			//游戏高版本
                    GameStation.iVersion2 = 1;			//低版本
                    GameStation.roomid = this.roomID;
                    //辅助时间
                    GameStation.iBeginTime = this.m_iBeginTime;				//游戏开始时间设置
                    GameStation.iThinkTime = this.m_iThinkTime;				//游戏思考时间
                    GameStation.iCallScoreTime = this.m_iCallScoreTime;			//叫分时间
                    GameStation.iRobNTTime = this.m_iRobNTTime;
                    GameStation.iAddDoubleTime = this.m_iAddDoubleTime;			//叫分时间
                    //房间倍数
                    GameStation.iDeskBasePoint = this.GetDeskBasePoint();	//桌子倍数
                    GameStation.iRoomBasePoint = this.GetRoomMul();	//房间倍数
                    GameStation.iRunPublish = this.GetRunPublish();			//逃跑扣分

                    GameStation.iCardShape = this.m_iCardShape;						//牌型设置
                    GameStation.iGameMutiple = this.m_iBaseMult;
                    GameStation.iAddDoubleLimit = this.m_iAddDoubleLimit;
                    GameStation.iGameMaxLimit = this.m_iGameMaxLimit;

                    GameStation.iUpGradePeople = this.m_iUpGradePeople;
                    GameStation.iGameFlag = this.m_iGameFlag;
                    GameStation.bCanleave = this.m_bCanleave;
                    GameStation.bAuto = this.m_bAuto;

                    var iPos = 0;
                    for (var i = 0; i < structData.PLAY_COUNT; i++) {
                        GameStation.iUserCardCount[i] = this.m_iUserCardCount[i];
                        /// 只发自己的手牌，Modified by zxd 20100314
                        if (bDeskStation == i || this.m_GameMutiple.sMingPaiMutiple[i] > 0) {
                            GameStation.iUserCardList[i] = this.m_iUserCard[i];
                            // for (var j = 0; j < this.m_iUserCardCount[i]; j++) {
                            //     GameStation.iUserCardList[iPos + j] = this.m_iUserCard[i][j];
                            // }
                            //::CopyMemory(&GameStation.iUserCardList[iPos],this.m_iUserCard[i],sizeof(BYTE)*this.m_iUserCardCount[i]);
                        }
                        // iPos += this.m_iUserCardCount[i];
                    }
                    GameStation.iBackCardCount = this.m_iBackCount;
                    GameStation.firstRobnt = this.m_iFirstRobNt;

                    switch (this.m_iGameFlag) {
                        case structData.GS_FLAG_ROB_NT:
                            {
                                for (var i = 0; i < structData.PLAY_COUNT; i++) {
                                    if (this.m_iFirstRobNt != 255) {
                                        if (this.m_iRobStation[i] == 255) ///不抢
                                        {
                                            GameStation.iRobNT[i] = 2;
                                        }
                                        else if (this.m_iRobStation[i] > 0 && this.m_GameMutiple.sRobNtMutiple[bDeskStation] > 0) {
                                            GameStation.iRobNT[i] = 3;
                                        }
                                        else {
                                            GameStation.iRobNT[i] = -1;
                                        }

                                    }
                                    else {
                                        if (this.m_iRobStation[i] == 255) ///不叫
                                        {
                                            GameStation.iRobNT[i] = 0;
                                        }
                                        else if (this.m_iRobStation[i] > 0) ///叫地主
                                        {
                                            GameStation.iRobNT[i] = 3;
                                        }
                                        else ///没有叫
                                        {
                                            GameStation.iRobNT[i] = -1;
                                        }
                                    }
                                }
                                GameStation.iCurOperator = this.m_iCurrentRobPeople;  ///当前叫地主的人
                                break;
                            }
                        case structData.GS_FLAG_ADD_DOUBLE:
                            {
                                for (var i = 0; i < structData.PLAY_COUNT; i++) {
                                    if (this.m_iAddStation[i] == 255)  //不加倍
                                    {
                                        GameStation.iUserDoubleValue[i] = -1;
                                    }
                                    else {
                                        GameStation.iUserDoubleValue[i] = this.m_iAddStation[i];
                                    }
                                }
                                GameStation.iGameBackCard = this.m_iBackCard;
                                //::CopyMemory(&GameStation.iGameBackCard,this.m_iBackCard,sizeof(BYTE)*this.m_iBackCount);
                                GameStation.iUpGradePeople = this.m_iUpGradePeople;
                                break;
                            }
                        case structData.GS_FLAG_SHOW_CARD:
                            {
                                GameStation.iGameBackCard = this.m_iBackCard;
                                //::CopyMemory(&GameStation.iGameBackCard,this.m_iBackCard,sizeof(BYTE)*this.m_iBackCount);
                                GameStation.iUpGradePeople = this.m_iUpGradePeople;
                                break;
                            }
                        default:
                            {
                                break;
                            }
                    }
                    GameStation.gameMutiple = this.m_GameMutiple;
                    GameStation.currentMutiple = this.m_GameMutiple.GetPublicMutiple();
                    GameStation.backCardType = this.m_Logic.m_byBackCardType;
                    this.m_Logic.SetGameTask(GameStation.gameTask);
                    this.userList[bDeskStation + 1].socket.emit("getGamestation3", GameStation);
                    //SendGameStation(bDeskStation,uSocketID,bWatchUser,&GameStation,sizeof(GameStation));
                    return;
                }

            case structData.GS_PLAY_GAME:	//游戏中状态
                {
                    var GameStation = new structData.GameStation_4();
                    //游戏版本核对
                    GameStation.iVersion = 2;			//游戏高版本
                    GameStation.iVersion2 = 1;			//低版本
                    GameStation.roomid = this.roomID;
                    //游戏内容设置
                    GameStation.iCardShape = this.m_iCardShape;						//牌型设置
                    //辅助时间
                    GameStation.iBeginTime = this.m_iBeginTime;				//游戏开始时间设置
                    GameStation.iThinkTime = this.m_iThinkTime;				//游戏思考时间
                    GameStation.iCallScoreTime = this.m_iCallScoreTime;			//叫分时间
                    GameStation.iRobNTTime = this.m_iRobNTTime;
                    GameStation.iAddDoubleTime = this.m_iAddDoubleTime;			//叫分时间
                    //房间倍数
                    GameStation.iDeskBasePoint = this.GetDeskBasePoint();	//桌子倍数
                    GameStation.iRoomBasePoint = this.GetRoomMul();	//房间倍数
                    GameStation.iRunPublish = this.GetRunPublish();			//逃跑扣分

                    GameStation.iGameMutiple = this.m_iBaseMult;
                    GameStation.iAddDoubleLimit = this.m_iAddDoubleLimit;
                    GameStation.iGameMaxLimit = this.m_iGameMaxLimit;

                    GameStation.iUpGradePeople = this.m_iUpGradePeople;

                    GameStation.iCallScoreResult = this.m_iCallScore[this.m_iUpGradePeople];	//当前叫分
                    GameStation.iOutCardPeople = this.m_iOutCardPeople;
                    GameStation.iFirstOutPeople = this.m_iFirstOutPeople;
                    GameStation.iBigOutPeople = this.m_iNowBigPeople;
                    GameStation.bCanleave = this.m_bCanleave;
                    GameStation.bAuto = this.m_bAuto;
                    GameStation.bPass = this.m_byPass;
                    GameStation.bLastTurnPass = this.m_byLastTurnPass;

                    //设置各家手中牌
                    var iPos = 0;
                    for (var i = 0; i < structData.PLAY_COUNT; i++) {
                        //设置用户手中牌
                        GameStation.iUserCardCount[i] = this.m_iUserCardCount[i];
                        if (i == bDeskStation || this.m_GameMutiple.sMingPaiMutiple[i] > 0) {
                            GameStation.iUserCardList[i] = this.m_iUserCard[i];
                            // for (var j = 0; j < this.m_iUserCardCount[i]; j++) {
                            //     GameStation.iUserCardList[iPos + j] = this.m_iUserCard[i][j];
                            // }
                            //::CopyMemory(&GameStation.iUserCardList[iPos],this.m_iUserCard[i],sizeof(BYTE)*this.m_iUserCardCount[i]);
                        }
                        //     iPos += this.m_iUserCardCount[i];
                    }
                    //设置用户桌面牌牌
                    GameStation.bIsLastCard = this.m_bIsLastCard;
                    GameStation.iBaseOutCount = this.m_iBaseOutCount;
                    GameStation.iBaseCardList = this.m_iDeskCard[this.m_iNowBigPeople];
                    GameStation.iDeskCardCount = this.m_iDeskCardCount;
                    GameStation.iDeskCardList = this.m_iDeskCard;
                    // ::CopyMemory(&GameStation.iBaseCardList , this.m_iDeskCard[this.m_iNowBigPeople] , sizeof(BYTE)*this.m_iBaseOutCount ) ; 
                    // ::CopyMemory(&GameStation.iDeskCardCount, this.m_iDeskCardCount, sizeof(GameStation.iDeskCardCount));
                    // ::CopyMemory(GameStation.iDeskCardList, this.m_iDeskCard, sizeof(GameStation.iDeskCardList));
                    GameStation.iLastCardCount = this.m_iLastCardCount;
                    GameStation.iLastOutCard = this.m_iLastOutCard;
                    // ::CopyMemory(&GameStation.iLastCardCount, this.m_iLastCardCount, sizeof(GameStation.iLastCardCount));
                    // ::CopyMemory(GameStation.iLastOutCard, this.m_iLastOutCard, sizeof(GameStation.iLastOutCard));
                    //是否不出
                    GameStation.bIsPass = this.m_byteHitPass;
                    GameStation.iBackCardCount = this.m_iBackCount;
                    GameStation.iGameBackCard = this.m_iBackCard;
                    //	::CopyMemory(&GameStation.iGameBackCard,this.m_iBackCard,sizeof(BYTE)*this.m_iBackCount);
                    GameStation.gameMutiple = this.m_GameMutiple;
                    this.m_Logic.SetGameTask(GameStation.gameTask);
                    switch (this.m_iGameFlag) {
                        case structData.GS_FLAG_ROB_NT:
                            {
                                for (var i = 0; i < structData.PLAY_COUNT; i++) {
                                    if (this.m_iFirstRobNt != 255) {
                                        if (this.m_iRobStation[i] == 255) ///不抢
                                        {
                                            GameStation.iRobNT[i] = 2;
                                        }
                                        else if (this.m_iRobStation[i] > 0 && this.m_GameMutiple.sRobNtMutiple[bDeskStation] > 0) {
                                            GameStation.iRobNT[i] = 3;
                                        }
                                        else {
                                            GameStation.iRobNT[i] = -1;
                                        }

                                    }
                                    else {
                                        if (this.m_iRobStation[i] == 255) ///不叫
                                        {
                                            GameStation.iRobNT[i] = 0;
                                        }
                                        else if (this.m_iRobStation[i] > 0) ///叫地主
                                        {
                                            GameStation.iRobNT[i] = 3;
                                        }
                                        else ///没有叫
                                        {
                                            GameStation.iRobNT[i] = -1;
                                        }
                                    }
                                }

                                GameStation.iCurOperator = this.m_iCurrentRobPeople;  ///当前叫地主的人

                                break;
                            }
                        case structData.GS_FLAG_ADD_DOUBLE:
                            {
                                for (var i = 0; i < structData.PLAY_COUNT; i++) {
                                    if (this.m_iAddStation[i] == 255)  //不加倍
                                    {
                                        GameStation.iUserDoubleValue[i] = -1;
                                    }
                                    else {
                                        GameStation.iUserDoubleValue[i] = this.m_iAddStation[i];
                                    }
                                }
                                GameStation.iGameBackCard = this.m_iBackCard;
                                //::CopyMemory(&GameStation.iGameBackCard,this.m_iBackCard,sizeof(BYTE)*this.m_iBackCount);
                                GameStation.iUpGradePeople = this.m_iUpGradePeople;
                                break;
                            }
                        case structData.GS_FLAG_SHOW_CARD:
                            {
                                GameStation.iGameBackCard = this.m_iBackCard;
                                //	::CopyMemory(&GameStation.iGameBackCard,this.m_iBackCard,sizeof(BYTE)*this.m_iBackCount);
                                GameStation.iUpGradePeople = this.m_iUpGradePeople;
                                break;
                            }
                        default:
                            {
                                break;
                            }
                    }
                    GameStation.gameMutiple = this.m_GameMutiple;
                    GameStation.currentMutiple = this.m_GameMutiple.GetPublicMutiple();
                    GameStation.backCardType = this.m_Logic.m_byBackCardType;
                    this.userList[bDeskStation + 1].socket.emit("getGamestation4", GameStation);
                    //	SendGameStation(bDeskStation,uSocketID,bWatchUser,&GameStation,sizeof(GameStation));
                    return;
                }
            case structData.GS_WAIT_NEXT:		//等待下一盘游戏开始
                {
                    //发送取消机器人托管
                    //SetAIMachine(bDeskStation,false);
                    var GameStation = new structData.GameStation_5();
                    //游戏版本核对
                    GameStation.iVersion = 2;			//游戏高版本
                    GameStation.iVersion2 = 1;			//低版本
                    GameStation.roomid = this.roomID;
                    //辅助时间
                    GameStation.iBeginTime = this.m_iBeginTime;				//游戏开始时间设置
                    GameStation.iThinkTime = this.m_iThinkTime;				//游戏思考时间
                    GameStation.iCallScoreTime = this.m_iCallScoreTime;			//叫分时间
                    GameStation.iRobNTTime = this.m_iRobNTTime;
                    GameStation.iAddDoubleTime = this.m_iAddDoubleTime;			//叫分时间
                    GameStation.iCardShape = this.m_iCardShape;						//牌型设置
                    GameStation.iGameMutiple = this.m_iBaseMult;
                    GameStation.iAddDoubleLimit = this.m_iAddDoubleLimit;
                    GameStation.iGameMaxLimit = this.m_iGameMaxLimit;
                    //房间倍数
                    GameStation.iDeskBasePoint = this.GetDeskBasePoint();	//桌子倍数
                    GameStation.iRoomBasePoint = this.GetRoomMul();	//房间倍数
                    GameStation.iRunPublish = this.GetRunPublish();			//逃跑扣分
                    GameStation.bUserReady = this.m_bUserReady;
                    this.userList[bDeskStation + 1].socket.emit("getGamestation5", GameStation);
                    //SendGameStation(bDeskStation,uSocketID,bWatchUser,&GameStation,sizeof(GameStation));
                    return;
                }
        }
        return false;
    }
    //判断是否正在游戏
    IsPlayGame(bDeskStation) {
        if ((this.m_bGameStation >= structData.GS_SEND_CARD && this.m_bGameStation < structData.GS_WAIT_NEXT))
            return true;
        return false;
    }
    //用户离开游戏桌
    UserLeftDesk(bDeskStation) {
        this.m_bUserReady[bDeskStation] = false;
        this.m_GameMutiple.sMingPaiMutiple[bDeskStation] = 0;
        this.UserSetAuto(bDeskStation, true);
    }
    //发送扑克给用户
    SendCard() {
        if (this.m_iSendCardPos == this.m_iSendCount) {
            this.SendCardFinish();
            return;
        }
        //继续发送扑克(1次发两张)
        for (var i = 0; i < 2; i++) {
            var bDeskStation = (this.m_iDealPeople + this.m_iSendCardPos) % structData.PLAY_COUNT;
            var SendCard = new structData.SendCardStruct();
            SendCard.bDeskStation = bDeskStation;
            SendCard.bCard = this.m_iUserCard[bDeskStation][this.m_iSendCardPos / structData.PLAY_COUNT];

            for (var i = 0; i < structData.PLAY_COUNT; i++)
                this.userList[i + 1].socket.emit("sendCard", SendCard);
            //SendGameData(i,&SendCard,sizeof(SendCard),MDM_GM_GAME_NOTIFY,ASS_SEND_CARD,0);
            //SendWatchData(this.m_bMaxPeople,&SendCard,sizeof(SendCard),MDM_GM_GAME_NOTIFY,ASS_SEND_CARD,0);

            SendCardMsg(bDeskStation, SendCard.bCard);

            this.m_iUserCardCount[bDeskStation]++;
            this.m_iSendCardPos++;
            if (this.m_iSendCardPos == this.m_iSendCount)
                break;
        }
    }
    //发牌消息
    SendCardMsg(bDeskStation, bCard) {
        if (this.m_bFirstCallScore != 255)
            return;
        if (bCard == this.m_bThrowoutCard) {
            this.m_bFirstCallScore = bDeskStation;
            var sendcard = new structData.SendCardStruct();;
            sendcard.bDeskStation = bDeskStation;
            sendcard.bCard = this.m_bThrowoutCard;
            for (var i = 0; i < structData.PLAY_COUNT; i++)
                this.userList[i + 1].socket.emit("sendCardMsg", sendcard);
            //SendGameData(i,&sendcard,sizeof(sendcard),MDM_GM_GAME_NOTIFY,ASS_SEND_CARD_MSG,0);
            //SendWatchData(this.m_bMaxPeople,&sendcard,sizeof(sendcard),MDM_GM_GAME_NOTIFY,ASS_SEND_CARD_MSG,0);
        }
        return;
    }
    //叫分结束
    CallScoreFinish() {
        if (this.m_iPrepareNT == 255)	//没有人叫分.重新发牌
        {
            this.GameFinish(0, GF_NO_CALL_SCORE);
            return true;
        }
        if (this.m_iCallScore[this.m_iPrepareNT] == 0)	//没有人叫分.重新发牌
        {
            this.GameFinish(0, GF_NO_CALL_SCORE);
            return true;
        }
        //用于抢地主位置结束控制
        this.m_iUpGradePeople = this.m_iPrepareNT;

        var scoreresult = new structData.CallScoreStruct();
        scoreresult.iValue = this.m_iCallScore[this.m_iPrepareNT];
        scoreresult.bDeskStation = this.m_iPrepareNT;
        scoreresult.bCallScoreflag = false;
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            this.userList[i + 1].socket.emit("callScoreFinish", scoreresult);
            //SendGameData(i,&scoreresult,sizeof(scoreresult),MDM_GM_GAME_NOTIFY,ASS_CALL_SCORE_FINISH,0);		//将叫分情况发给其他用户
        }
        //SendWatchData(this.m_bMaxPeople,&scoreresult,sizeof(scoreresult),MDM_GM_GAME_NOTIFY,ASS_CALL_SCORE_FINISH,0);
        var bDeskStation = this.GetRobNtDeskStation(this.m_iPrepareNT);
        if (bDeskStation == this.m_iPrepareNT || !this.m_bRobnt) {
            this.RobNTFinish();
        }
        else {
            this.SendRobNT(bDeskStation);
        }
        //直接进入游戏
        //SendBackCard();
        return;
    }
    //新一轮开始
    NewPlayTurn(bDeskStation) {
        if (!this.userList) return;
        this.m_iBaseOutCount = 0;
        this.m_iOutCardPeople = this.m_iFirstOutPeople = this.m_iNowBigPeople = bDeskStation;
        //保存上一轮出牌情况
        for (var i = 0; i < structData.PLAY_COUNT; i++) {
            this.m_bIsLastCard = true;
            this.m_byteHitPass = 0;
            this.m_iLastCardCount[i] = this.m_iDeskCardCount[i];
            this.m_iLastOutCard[i] = [].concat(this.m_iDeskCard[i]);
            this.m_byLastTurnPass = this.m_byPass;
        }
        this.m_iDeskCardCount = [0, 0, 0];
        this.m_byPass = [0, 0, 0];
        var turn = new structData.NewTurnStruct();
        turn.bDeskStation = bDeskStation;
        for (var i = 0; i < structData.PLAY_COUNT; i++)
            this.userList[i + 1].socket.emit("newTurn", turn);
        //SendGameData(i,&turn,sizeof(turn),MDM_GM_GAME_NOTIFY,ASS_NEW_TURN,0);
        //SendWatchData(this.m_bMaxPeople,&turn,sizeof(turn),MDM_GM_GAME_NOTIFY,ASS_NEW_TURN,0);
        //SetTimer(TIME_OUT_CARD,(this.m_iThinkTime + 8)*1000);
        // duanxiaohui 增加 20100319
        if (this.userList[this.m_iOutCardPeople + 1] != null) {
            // 判断该断线玩家是否掉线
            var that = this;
            if (this.userList[this.m_iOutCardPeople + 1].isOutline || this.m_bAuto[this.m_iOutCardPeople] == true) {
                // 自动出牌
                //SetTimer(TIME_OUT_CARD, 1000);
                this.timeoutTimer = setTimeout(function () {
                    that.TimerOutCard();
                }, 1000);
                this.allTimer.push(this.timeoutTimer);
            }
            else {
                this.timeoutTimer = setTimeout(function () {
                    that.TimerOutCard();
                }, (this.m_iThinkTime + 5) * 1000);
                this.allTimer.push(this.timeoutTimer);
                //SetTimer(TIME_OUT_CARD,(this.m_iThinkTime + 5)*1000);
            }
        }
        return;
    }
    //桌子倍数
    GetDeskBasePoint() {
        return 1;
    }
    //游戲基礎倍數
    GetRoomMul() {
        var hasobj = { 1: "roomcard", 2: "normal", 3: "middle", 4: "hight" };
        var roomcfg = think.config("roomcfg");
        var cfgData = roomcfg[hasobj[this.roomType]];
        var iBasePoint = cfgData.baseScore;
        return iBasePoint; // 倍数
    }
    //逃跑扣分
    GetRunPublish() {
        return this.GetRoomMul() * 2;
    }
    //玩家逃跑其他玩家得分
    GetRunAwayOtherGetPoint(bDeskStation, bRunDeskStation) {
        return 0;
    }
}