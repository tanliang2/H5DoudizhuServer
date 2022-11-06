'use strict';
import upgradeLogic from "./upgradelogic.js"
var structData = require("./../config/structdata");

//操作掩码
var UG_HUA_MASK = 0xF0			//1111 0000
var UG_VALUE_MASK = 0x0F			//0000 1111

//扑克花色
var UG_FANG_KUAI = 0x00			//方块	0000 0000
var UG_MEI_HUA = 0x10			//梅花	0001 0000
var UG_HONG_TAO = 0x20			//红桃	0010 0000
var UG_HEI_TAO = 0x30			//黑桃	0011 0000
var UG_NT_CARD = 0x40			//主牌	0100 0000
var UG_ERROR_HUA = 0xF0			//错误  1111 0000

//扑克出牌类型
var UG_ERROR_KIND = 0				//错误

var UG_ONLY_ONE = 1				//单张
var UG_DOUBLE = 2				//对牌

var UG_VARIATION_STRAIGHT = 3				//变种顺子(A2345)顺子中最小
var UG_STRAIGHT = 4               //顺子,5+张连续牌
var UG_FLUSH = 5				//同花(非连)
var UG_STRAIGHT_FLUSH = 6               //同花顺,花色相同的顺子

var UG_THREE = 7				//三张
var UG_THREE_ONE = 8               //3 带 1
var UG_THREE_TWO = 9               //3 带 2
var UG_THREE_DOUBLE = 10				//3 带1对

var UG_VARIATION_DOUBLE_SEQUENCE = 11				//变种双顺(AA22)最小
var  UG_DOUBLE_SEQUENCE = 12				//连对,2+个连续的对子

var UG_VARIATION_THREE_SEQUENCE = 13				//变种三顺(AAA222最小)
var UG_THREE_SEQUENCE = 14				//连三张，2+个连续的三张

var UG_VARIATION_THREE_ONE_SEQUENCE = 15				//变种三顺带一
var UG_THREE_ONE_SEQUENCE = 16              //2+个连续的三带一

var UG_VARIATION_THREE_TWO_SEQUENCE = 17				//变种三顺带二
var UG_THREE_TWO_SEQUENCE = 18				//2+个连续的三带二

var UG_VARIATION_THREE_DOUBLE_SEQUENCE = 19				//变种三连张带对
var UG_THREE_DOUBLE_SEQUENCE = 20				//三连张带对

var UG_VARIATION_THREE_SEQUENCE_DOUBLE_SEQUENCE = 21		//变种蝴蝶(三顺带二顺)
var UG_THREE_SEQUENCE_DOUBLE_SEQUENCE = 22				//蝴蝶(三顺带二顺)

var UG_FOUR_ONE = 23				//四带一
var UG_FOUR_TWO = 24				//四带二张
var UG_FOUR_ONE_DOUBLE = 25				//四带一对
var UG_FOUR_TWO_DOUBLE = 26				//四带二对

var UG_VARIATION_FOUR_SEQUENCE = 27				//四顺
var UG_FOUR_SEQUENCE = 28				//四顺

var UG_VARIATION_FOUR_ONE_SEQUENCE = 29				//四带一顺
var UG_FOUR_ONE_SEQUENCE = 30				//四带一顺

var UG_VARIATION_FOUR_TWO_SEQUENCE = 31				//四带二顺
var UG_FOUR_TWO_SEQUENCE = 32				//四带二顺

var UG_VARIATION_FOUR_ONE_DOUBLE_SEQUENCE = 33				//四带对顺
var UG_FOUR_ONE_DOUBLE_SEQUENCE = 34				//四带对顺

var UG_VARIATION_FOUR_TWO_DOUBLE_SEQUENCE = 35				//四带二对顺
var UG_FOUR_TWO_DOUBLE_SEQUENCE = 36				//四带二对顺


var UG_SLAVE_510K = 37              //510K炸弹,花色不同
var UG_MASTER_510K = 38              //510K同花炸弹

var UG_BOMB = 39              //炸弹>=4張
var UG_BOMB_SAME_HUA = 40				//同花炸弹(在四副或以上的牌中出现)
var UG_KING_BOMB = 41				//王炸(最大炸弹)
var KING_COUNT = 2				//所有王的个数
var byCardShape = [UG_ONLY_ONE, UG_DOUBLE, UG_STRAIGHT, UG_THREE_ONE, UG_THREE_TWO, UG_DOUBLE_SEQUENCE, UG_THREE_ONE_SEQUENCE, UG_BOMB];
export default class extends upgradeLogic {
    init() {
        super.init();
        this.m_byLastCardList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];  ///最后一手牌的列表
        this.m_byLastCardCount;     ///最后一手牌的数量
        this.m_byBackCardType;   ///底牌牌型 
        this.m_byTaskType;       ///需随机产生
        this.m_bySpecifyShape;    ///指定的牌型
        this.m_bySpecifyCard;     ///指定的牌
    }

    ///初始任务变量
    InitGameTask() {
        this.m_byLastCardList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];  ///最后一手牌的列表
        this.m_byLastCardCount = 0;
        this.m_byBackCardType = 0;
        this.m_byTaskType = 0;
        this.m_bySpecifyShape = 0;
        this.m_bySpecifyCard = 0;
    }
    ///获取底牌牌型
    GetBackCardType(bbackCardList, cbCardCount) {
        if (3 != cbCardCount) {
            return false;
        }

        var iTempBackCard = [].concat(bbackCardList.slice(0, 3));
        //memcpy(iTempBackCard , bbackCardList , sizeof(iTempBackCard)) ; 

        this.SortCard(iTempBackCard, null, cbCardCount);

        if (iTempBackCard[0] == 0x4F && iTempBackCard[1] == 0x4E) {
            this.m_byBackCardType = structData.TYPE_ROCKET;
        }
        else if (iTempBackCard[0] == 0x4F) {
            this.m_byBackCardType = structData.TYPE_BIG_KING;
        }
        else if (iTempBackCard[0] == 0x4E) {
            this.m_byBackCardType = structData.TYPE_SMALL_KING;
        }
        else {
            if (this.GetCardHuaKind(iTempBackCard[0], true) == this.GetCardHuaKind(iTempBackCard[1], true) && this.GetCardHuaKind(iTempBackCard[1], true) == this.GetCardHuaKind(iTempBackCard[2], true)) {
                this.m_byBackCardType = structData.TYPE_SAME_HUA;
            }
            else if (this.GetCardBulk(iTempBackCard[0]) == this.GetCardBulk(iTempBackCard[1]) && this.GetCardBulk(iTempBackCard[1]) == this.GetCardBulk(iTempBackCard[2])) {
                this.m_byBackCardType = structData.TYPE_TRIPLE_CARD;
            }
            else if (this.GetCardBulk(iTempBackCard[0]) == this.GetCardBulk(iTempBackCard[1]) || this.GetCardBulk(iTempBackCard[1]) == this.GetCardBulk(iTempBackCard[2])) {
                this.m_byBackCardType = structData.TYPE_DOUBLE_CARD;
            }
            else if (true == this.IsBackCardStraight(iTempBackCard, cbCardCount)) {
                this.m_byBackCardType = structData.TYPE_STRAIT;
            }
            else {
                this.m_byBackCardType = structData.TYPE_NONE;
            }
        }

        return (this.m_byBackCardType > 0);
    }
    ///底牌是否为顺子
    IsBackCardStraight(iCardList, iCardCount) {
        if (iCardCount != 3) {
            return false;
        }
        var temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        for (var i = 0; i < iCardCount; i++) {
            temp[this.GetCardBulk(iCardList[i])]++;
        }
        for (var i = 0; i < 15; i++) {
            if (temp[i] != 0)//有值
            {
                for (var j = i; j < i + iCardCount; j++) {
                    if (temp[j] != 1 || j >= 15)
                        return false;
                }
                return true;
            }
        }
        return false;
    }
    // 获取指定牌面值牌的数量
    GetCardNumCount(iCardList, iCardCount, bCardNum) {
        if (bCardNum > structData.MAX_CARD_TYPE + 2 || bCardNum < 3) {
            return 0;
        }
        var temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        for (var i = 0; i < iCardCount; i++) {
            temp[this.GetCardBulk(iCardList[i])]++;
        }
        return temp[bCardNum];
    }
    ///获取随机任务
    GetRandTask(inDex = 0) {
        if (structData.TYPE_NONE != this.m_byBackCardType) {
            return;
        }
        this.m_byTaskType = Math.round(Math.random() * 32767) % structData.MAX_TASK_TYPE + 100;

        if (structData.TYPE_SOME_SHAPE == this.m_byTaskType) {
            this.m_bySpecifyShape = Math.round(Math.random() * 32767) % structData.MAX_CARD_SHAPE;
        }
        else {
            this.m_bySpecifyCard = Math.round(Math.random() * 32767) % structData.MAX_CARD_SHAPE + 3;
        }
    }
    ///    设置任务变量
    SetGameTask(gameTask) {
        gameTask.byBackCardType = this.m_byBackCardType;
        gameTask.byTaskType = this.m_byTaskType;
        gameTask.bySpecifyShape = this.m_bySpecifyShape;
        gameTask.bySpecifyCard = this.m_bySpecifyCard;
        gameTask.byBackCardMutiple = this.GetBackCardMytiple();
    }
    ///设置最后一手牌的数据
    SetLastCardData(iCardList, iCardCount) {
        if (null == iCardList) {
            return;
        }
        if (0 >= iCardCount) {
            return;
        }

        if (structData.TYPE_NONE != this.m_byBackCardType)  ///已经有底牌翻倍了
        {
            return;
        }
        this.m_byLastCardCount = iCardCount;
        this.m_byLastCardList = [].concat(iCardList.slice(0, iCardCount));
        //  memcpy(m_byLastCardList, iCardList, sizeof(BYTE) * (iCardCount));
        return;
    }
    ///判断是否完成任务了
    IsFinishTask() {
        if (structData.TYPE_NONE != this.m_byBackCardType) ///底牌有翻倍
        {
            return false;
        }

        if (structData.TYPE_LAST_NONE == this.m_byTaskType)  ///没有任务
        {
            return false;
        }

        if (0 > this.m_bySpecifyShape || this.m_bySpecifyShape >= structData.MAX_CARD_SHAPE) {
            return false;
        }

        switch (this.m_byTaskType) {
            case structData.TYPE_HAVE_A_CARD:
                {
                    if (this.GetCardNumCount(this.m_byLastCardList, this.m_byLastCardCount, this.m_bySpecifyCard) > 0) {
                        return true;
                    }
                    break;
                }
            case structData.TYPE_SOME_SHAPE:
                {
                    var iShape = this.GetCardShape(this.m_byLastCardList, this.m_byLastCardCount);

                    if (this.m_bySpecifyShape == 6) {
                        if (iShape >= UG_THREE_ONE_SEQUENCE && iShape <= UG_THREE_TWO_SEQUENCE) {
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                    else if (this.m_bySpecifyShape == 7) {
                        if (iShape >= UG_BOMB) {
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                    else {
                        return (iShape == byCardShape[this.m_bySpecifyShape]);
                    }

                }
            case structData.TYPE_SINGLE_SOME_CARD:
            case structData.TYPE_DOUBLE_SOME_CARD:
                {
                    if (this.m_byLastCardCount != (this.m_byTaskType - structData.TYPE_SOME_SHAPE)) {
                        return false;
                    }

                    var iCardCount = this.GetCardNumCount(this.m_byLastCardList, this.m_byLastCardCount, this.m_bySpecifyCard);
                    return (iCardCount == (this.m_byTaskType - structData.TYPE_SOME_SHAPE));

                }
            default:
                {
                    break;
                }
        }

        return false;
    }
    ///获取任务倍数
    GetTaskMutiple(bFinish) {
        if (false == bFinish) {
            return 100;
        }
        var sGamePoint = 100;
        if (this.m_byTaskType == structData.TYPE_LAST_NONE) {
            sGamePoint = 100;
        }
        else {
            if (this.m_byTaskType == structData.TYPE_HAVE_A_CARD) {
                sGamePoint = 200;
            }
            else {
                sGamePoint = 250;
            }
        }
        return sGamePoint;
    }
    ///获取底牌倍数
    GetBackCardMytiple() {
        var sGamePoint = 1;
        if (structData.TYPE_NONE != this.m_byBackCardType) {
            if (this.m_byBackCardType == structData.TYPE_ROCKET) {
                sGamePoint = 4;
            }
            else if (this.m_byBackCardType == structData.TYPE_DOUBLE_CARD
                || this.m_byBackCardType == structData.TYPE_SMALL_KING
                || this.m_byBackCardType == structData.TYPE_BIG_KING) {
                sGamePoint = 2;
            }
            else {
                sGamePoint = 3;  //三倍
            }
        }
        else {
            return 1;
        }
        return sGamePoint;
    }
}