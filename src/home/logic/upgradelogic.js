'use strict';
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
var UG_DOUBLE_SEQUENCE = 12				//连对,2+个连续的对子

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
export default class extends think.base {
    init() {
        this.m_bSortCardStyle;  //排序方式
        this.m_iCondition;			//限制条件
        this.m_bKingCanReplace;		//王是否可当
        this.m_iCardShape;	//支持牌型
    }

    //[设置相关]
    //获取扑克数字
    GetCardNum(iCard) {
        return (iCard & UG_VALUE_MASK) + 1;
    }
    //获取扑克花色(默认为真实花色)
    GetCardHuaKind(iCard, bTrueHua = true) {
        var iHuaKind = (iCard & UG_HUA_MASK);
        if (!bTrueHua) {
            return iHuaKind = UG_NT_CARD;
        }
        return iHuaKind;
    }
    //获取扑克相对大小(默认为牌大小,非排序大小)
    GetCardBulk(iCard, bExtVal = false) {
        if ((iCard == 0x4E) || (iCard == 0x4F)) {
            return bExtVal ? (iCard - 14) : (iCard - 62); //大小鬼64+14-62=16	只返回大小猫的值
        }

        var iCardNum = this.GetCardNum(iCard);
        var iHuaKind = this.GetCardHuaKind(iCard, true);

        if (iCardNum == 2) //2王
        {
            if (bExtVal) //有鬼
            {
                return ((iHuaKind >> 4) + (15 * 4));
            }
            else //没有鬼，返回2王
            {
                return 15;
            }
        }

        return ((bExtVal) ? ((iHuaKind >> 4) + (iCardNum * 4)) : (iCardNum));
    }
    //获取扑克牌通过相对大小
    GetCardByValue(iCardValue) {
        var CardArray = [
            0x00,
            0x01, 0x11, 0x21, 0x31,
            0x02, 0x12, 0x22, 0x32,
            0x03, 0x13, 0x23, 0x33,
            0x04, 0x14, 0x24, 0x34,
            0x05, 0x15, 0x25, 0x35,
            0x06, 0x16, 0x26, 0x36,
            0x07, 0x17, 0x27, 0x37,
            0x08, 0x18, 0x28, 0x38,
            0x09, 0x19, 0x29, 0x39,
            0x0A, 0x1A, 0x2A, 0x3A,
            0x0B, 0x1B, 0x2B, 0x3B,
            0x0C, 0x1C, 0x2C, 0x3C,
            0x0D, 0x1D, 0x2D, 0x3D,
            0x4E, 0x4F];

        return CardArray[iCardValue];
    }
    //設置王可以當牌
    SetKingCanReplace(bKingCanReplace = false) {
        this.m_bKingCanReplace = bKingCanReplace;
    }
    //獵取王是否可以當牌
    GetKingCanReplace() {
        return this.m_bKingCanReplace;
    }
    //设置排序方式
    SetSortCardStyle(SortCardStyle) {
        this.m_bSortCardStyle = SortCardStyle;
    }
    //获取排序方式
    GetSortCardStyle() {
        return this.m_bSortCardStyle;
    }
    //排列扑克,按大小(保留系统序例)
    SortCard(iCardList, bUp, iCardCount, bSysSort = false) {
        var bSorted = true, bTempUp;
        var iTemp, iLast = 0, iStationVol = [];
        if (iCardCount > 45) {
            iCardCount = 45;
        }
        iLast = iCardCount - 1;
        //获取位置数值
        for (var i = 0; i < iCardCount; i++) {
            iStationVol[i] = this.GetCardBulk(iCardList[i], true);
        }
        //排序操作(按从大到小排序)
        do {
            bSorted = true;
            for (var i = 0; i < iLast; i++) {
                if (iStationVol[i] < iStationVol[i + 1]) {
                    //交换位置				//==冒泡排序
                    iTemp = iCardList[i];
                    iCardList[i] = iCardList[i + 1];
                    iCardList[i + 1] = iTemp;

                    iTemp = iStationVol[i];
                    iStationVol[i] = iStationVol[i + 1];
                    iStationVol[i + 1] = iTemp;

                    if (bUp != null) {
                        bTempUp = bUp[i];
                        bUp[i] = bUp[i + 1];
                        bUp[i + 1] = bTempUp;
                    }
                    bSorted = false;
                }
            }
            iLast--;
        } while (!bSorted);

        //系统序列不考虑花色牌型问题
        if (bSysSort) {
            this.ReverseCard(iCardList, bUp, iCardCount);
            return true;
        }
        if (this.GetSortCardStyle() == 1) //按牌型排序
            this.SortCardByStyle(iCardList, iCardCount);

        if (this.GetSortCardStyle() == 2)
            this.SortCardByKind(iCardList, iCardCount);

        return true;
    }
    //反转牌顺(从低->高)
    ReverseCard(iCardList, bUp, iCardCount) {
        var iTemp;
        for (var i = 0; i < iCardCount / 2; i++) {
            iTemp = iCardList[i];
            iCardList[i] = iCardList[iCardCount - 1 - i];
            iCardList[iCardCount - 1 - i] = iTemp;
        }
        return true;
    }
    //按牌型排序
    SortCardByStyle(iCardList, iCardCount) {
        //如果排序设置是要求按大小排序
        if (this.m_bSortCardStyle == 0) {
            this.SortCard(iCardList, null, iCardCount);

            return true;
        }

        //下面的代码==按牌形排大小
        var iStationVol = [];
        for (var i = 0; i < iCardCount; i++) {
            iStationVol[i] = this.GetCardBulk(iCardList[i], false);
        }

        var Start = 0;
        var j, step;
        var CardTemp = [];					//用来保存要移位的牌形
        var CardTempVal = [];					//用来保存移位的牌面值
        for (var i = 8; i > 1; i--)				//在数组中找一个连续i张相同的值
        {
            for (j = Start; j < iCardCount; j++) {
                CardTemp[0] = iCardList[j];			//保存当前i个数组相同的值
                CardTempVal[0] = iStationVol[j];
                for (step = 1; step < i && j + step < iCardCount;)			//找一个连续i个值相等的数组(并保存于临时数组中)
                {
                    if (iStationVol[j] == iStationVol[j + step]) {
                        CardTemp[step] = iCardList[j + step];			//用来保存牌形
                        CardTempVal[step] = iStationVol[j + step];		//面值
                        step++;
                    }
                    else
                        break;
                }

                if (step >= i)	//找到一个连续i个相等的数组串起始位置为j,结束位置为j+setp-1
                {			//将从Start开始到j个数组后移setp个
                    if (j != Start) //排除开始就是有序
                    {
                        for (; j >= Start; j--) //从Start张至j张后移动i张
                        {
                            iCardList[j + i - 1] = iCardList[j - 1];
                            iStationVol[j + i - 1] = iStationVol[j - 1];
                        }
                        for (var k = 0; k < i; k++) {
                            iCardList[Start + k] = CardTemp[k];	//从Start开始设置成CardSave
                            iStationVol[Start + k] = CardTempVal[k];
                        }
                    }
                    Start = Start + i;
                }
                j = j + step - 1;
            }
        }
        return true;
    }
    //按花色排序
    SortCardByKind(iCardList, iCardCount) {
        return true;
    }
    //混乱扑克,bHaveKing表示是否有大小猫,false无,ture有
    RandCard(bHaveKing = true) {
        var m_CardArray =
            [
                0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, //方块 2 - A
                0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, //梅花 2 - A
                0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, //红桃 2 - A
                0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, //黑桃 2 - A
                0x4E, 0x4F //小鬼，大鬼
            ];
        m_CardArray.sort(function (a, b) {
            return Math.random() > 0.5;
        })
        return m_CardArray;
    }
    //删除扑克
    RemoveCard(iRemoveCard, iRemoveCount, iCardList, iCardCount) {
        //检验数据
        if (iRemoveCount > iCardCount) return 0;

        var iRecount;
        var iDeleteCount = 0; //把要删除的牌置零

        for (var i = 0; i < iRemoveCount; i++) {
            for (var j = 0; j < iCardCount; j++) {
                if (iRemoveCard[i] == iCardList[j]) {
                    iDeleteCount++;
                    iCardList[j] = 0;
                    break;
                }
            }
        }
        iRecount = this.RemoveNummCard(iCardList, iCardCount); //删除做了标记的牌

        if (iDeleteCount != iRecount)
            return 0;

        return iDeleteCount;
    }
    //获取牌数量
    GetCardCount(iCard, iCardCount) {
        var iCount = 0;
        for (var i = 0; i < iCardCount; i++) {
            if (this.IsLegalCard(iCard[i])) {
                iCount++;
            }
        }
        return iCount;
    }
    IsLegalCard(iCard) {
        var m_Cards =
            [
                0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, //方块 2 - A
                0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, //梅花 2 - A
                0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, //红桃 2 - A
                0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, //黑桃 2 - A
                0x4E, 0x4F //小鬼，大鬼
            ];
        for (var i = 0; i < 54; i++) {
            if (m_Cards[i] == iCard) {
                return true;
            }
        }
        return false;
    }
    //清除 0 位扑克
    RemoveNummCard(iCardList, iCardCount) {
        var iRemoveCount = 0;
        var iCards = [].concat(iCardList);
        for (var i = 0; i < iCardList.length; i++) {
            iCardList[i] = 0;
        }
        var index = 0;
        for (var i = 0; i < iCardCount; i++) {
            if (iCards[i] != 0) {
                iCardList[index++] = iCards[i];
            }
            else {
                iRemoveCount++;
            }
        }
        return iRemoveCount;
    }
    //对比单牌
    CompareOnlyOne(iFirstCard, iNextCard) {
        //第一个表示桌面上最大牌, 第二个表示要出的牌
        return this.GetCardBulk(iFirstCard) < this.GetCardBulk(iNextCard);
    }
    //查找分数
    FindPoint(iCardList, iCardCount) {
        var iPoint = 0; //分数
        for (var i = 0; i < iCardCount; i++) {
            var iNum = this.GetCardNum(iCardList[i]); //牌面点数
            switch (iNum) {
                case 5:
                    iPoint += 5;
                    break;
                case 10:
                case 13:
                    iPoint += 10;
                    break;
            }
        }
        return iPoint;
    }
    //是否为同一数字牌
    IsSameNumCard(iCardList, iCardCount, bExtVal = false) {
        var i, temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < iCardCount; i++) {
            temp[this.GetCardBulk(iCardList[i], false)]++;
        }

        for (i = 0; i < 18; i++) {
            if (temp[i] != 0)
                break;
        }
        if (this.m_bKingCanReplace) {
            if (i < 16)//王带其他牌
                return (temp[i] + temp[16] + temp[17] == iCardCount);
            //else//只有王
            if (i < 17)
                return (temp[16] + temp[17] == iCardCount);
        }
        else
            return (temp[i] == iCardCount);
        return 0;
    }
    //是否为同一花色
    IsSameHuaKind(iCardList, iCardCount, bExtVal = false) {
        if (iCardCount <= 0) return false;

        var iFirstHua = this.GetCardHuaKind(iCardList[0], true); //取得第一张牌的花色

        for (var i = 1; i < iCardCount; i++) //后面的都和第一张的花色比
        {
            if (this.GetCardHuaKind(iCardList[i], true) != iFirstHua) {
                return false;
            }
        }
        return true;
    }
    //查找 >=4 炸弹的数量炸弹基数
    GetBombCount(iCardList, iCardCount, iNumCount = 4, bExtVal = false) {
        var iCount = 0,
            temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (var i = 0; i < iCardCount; i++) {
            temp[this.GetCardBulk(iCardList[i])]++;
        }
        for (var i = 0; i < 16; i++) {
            if (temp[i] >= iNumCount)
                iCount++;
        }
        return iCount;
    }
    //获取指定大小牌个数
    GetCountBySpecifyNumCount(iCardList, iCardCount, Num) {
        var temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var count = 0;
        for (var i = 0; i < iCardCount; i++)
            temp[this.GetCardBulk(iCardList[i])]++;

        for (var i = 0; i < 18; i++)
            if (temp[i] == Num)
                count++;

        return count;
    }
    //获取指定牌个数
    GetCountBySpecifyCard(iCardList, iCardCount, bCard) {
        var count = 0;
        for (var i = 0; i < iCardCount; i++)
            if (iCardList[i] == bCard)
                count++;

        return count;
    }
    //获取指定牌张数牌大小(队例中只能够有一种牌的张数为iCount,不然传出去的将是第一个指定张数的值)
    GetBulkBySpecifyCardCount(iCardList, iCardCount, iCount) {
        var temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (var i = 0; i < iCardCount; i++)
            temp[this.GetCardBulk(iCardList[i])]++;

        for (var i = 17; i > 0; i--)
            if (temp[i] == iCount)
                return i;

        return 0;
    }
    //是否为某指定的顺子(变种顺子)
    IsVariationSequence(iCardList, iCardCount, iCount) {
        var iValue = iCardCount / iCount;
        if (iCardCount != iCount * iValue)						 //张数不相配
            return false;

        var iFirstMax = 0, iSecondMax = 0, iThirdMax = 0, iMin = 18;//找出第一大,第二大,第三大的牌,和最小牌
        var temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (var i = 0; i < iCardCount; i++)						//牌多少
        {
            temp[this.GetCardBulk(iCardList[i])]++;
        }

        for (var i = 0; i < 18; i++) {
            if (temp[i] != 0 && temp[i] != iCount)	//非找定顺子
                return false;
        }

        for (var i = 0; i < 18; i++)						//最小牌最大可能到A
        {
            if (temp[i] != 0)
                iMin = i;
        }

        for (var i = 17; i > 0; i--) {
            if (temp[i] != 0) {
                iFirstMax = i;						//可能是2也可以是A
                for (var j = i - 1; j > 0; j--) {
                    if (temp[j] != 0)//找到第二大的退出循环(无第三大的)//可能是A也可以非A
                    {
                        iSecondMax = j;
                        for (var k = j - 1; j > 0; j--) {
                            if (temp[k] != 0)//查第第三大的退出循环	//可是存在也可以不存在
                            {
                                iThirdMax = k;
                                break;
                            }
                        }
                        break;
                    }
                }
                break;
            }
        }

        if (iFirstMax < 15)	//不存在2的情况,正常情况下
        {
            return (iFirstMax - iMin + 1 == iValue);
        }

        if (iFirstMax == 15)	//存在2,再看是否存在A
        {
            if (iSecondMax == 14)		//存在A
            {
                if (iThirdMax == 0)		//不存在第三大,也只有A2两种牌
                    return true;

                return (iThirdMax - iMin + 1 == iValue - 2);		//存在 A2情况包括处理AA2233
            }
            return (iSecondMax - iMin + 1 == iValue - 1);
        }

        return false;
    }
    //是否为某指定的顺子
    IsSequence(iCardList, iCardCount, iCount) {
        var temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (var i = 0; i < iCardCount; i++) {
            temp[this.GetCardBulk(iCardList[i])]++;
        }

        for (var i = 0; i < 15; i++) {
            if (temp[i] != 0 && temp[i] != iCount)	//非指定顺
                return false;
        }

        var len = iCardCount / iCount;
        //TCHAR sz[200];
        //wsprintf(sz,"iCardCount=%d,iCount=%d,len=%d",iCardCount,iCount,len);
        //WriteStr(sz);
        for (var i = 0; i < 15; i++) {
            if (temp[i] != 0)//有值
            {
                //if(temp[i] == iCount )
                //{	
                for (var j = i; j < i + len; j++) {
                    if (temp[j] != iCount || j >= 15)
                        return false;
                }
                return true;
                //}else 
                //	return false;
            }
        }
        return false;
    }
    //提取指定的牌
    TackOutBySpecifyCard(iCardList, iCardCount, bCardBuffer, iResultCardCount, bCard) {
        iResultCardCount = 0;
        for (var i = 0; i < iCardCount; i++) {
            if (iCardList[i] == bCard)
                bCardBuffer[iResultCardCount++] = iCardList[i];
        }
        return iResultCardCount;
    }
    //提取某张指定数字的牌
    TackOutCardBySpecifyCardNum(iCardList, iCardCount, iBuffer, iBufferCardCount, iCard, bExtVal = false) {
        iBufferCardCount = 0;
        var iCardNum = this.GetCardBulk(iCard); //得到牌面点数
        for (var i = 0; i < iCardCount; i++) {
            if (this.GetCardBulk(iCardList[i]) == iCardNum) //现在要查找的牌点数字
            {
                iBuffer[iBufferCardCount++] = iCardList[i];
            }
        }
        return iBufferCardCount;
    }
    //提取所有符合条件的牌,单张,对牌,三张,4炸弹牌型
    TackOutBySepcifyCardNumCount(iCardList, iCardCount, iDoubleBuffer, bCardNum, bExtVal = false) {
        var iCount = 0, temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (var i = 0; i < iCardCount; i++) {
            temp[this.GetCardBulk(iCardList[i])]++;
        }

        for (var i = 0; i < 18; i++) {
            if (temp[i] >= bCardNum) //现在要查找的牌型:one?double?three?four_bomb?
            {
                for (var j = 0; j < iCardCount; j++) {
                    if (i == this.GetCardBulk(iCardList[j]))
                        iDoubleBuffer[iCount++] = iCardList[j];
                }
            }
        }
        return iCount;
    }
    //提取指定花色牌
    TackOutByCardKind(iCardList, iCardCount, iDoubleBuffer, iCardKind) {
        var count = 0;

        for (var i = 0; i < iCardCount; i++) {
            if (this.GetCardHuaKind(iCardList[i]) == iCardKind) {
                iDoubleBuffer[count++] = iCardList[i];
            }
        }
        return count;
    }
    //拆出(将手中牌多的拆成少的)
    TackOutMuchToFew(iCardList, iCardCount, iDoubleBuffer, iBufferCardCount, iCardMuch, iCardFew) {
        iBufferCardCount = 0;
        var count = 0;
        var iBuffer = [];
        var iCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, iCardMuch);
        if (iCount <= 0)
            return count;
        for (var i = 0; i < iCount; i += iCardMuch) {
            iDoubleBuffer[iBufferCardCount] = [];
            for (var j = 0; j < iCardFew; j++) {
                iDoubleBuffer[iBufferCardCount].push(iBuffer[i]);
            }
            iBufferCardCount += iCardFew;
            count++;
        }
        return iBufferCardCount;
    }
    //查找大于iCard的单牌所在iCardList中的序号
    GetSerialByMoreThanSpecifyCard(iCardList, iCardCount, iCard, iBaseCardCount, bExtValue = false) {
        var MaxCard = 0;
        var Serial = 0;
        var MaxCardNum = 255;
        var BaseCardNum = this.GetCardBulk(iCard);	//当前比较值
        for (var i = 0; i < iCardCount; i++) {
            var temp = this.GetCardBulk(iCardList[i]);

            if (temp < MaxCardNum && temp > BaseCardNum) {
                MaxCardNum = temp;
                Serial = i; //得到序号
                break;
            }
        }
        return Serial;
    }
    //查找==iCard的单牌所在iCardList中的序号(起始位置,到終點位置)
    GetSerialBySpecifyCard(iCardList, iStart, iCardCount, iCard) {
        for (var i = iStart; i < iCardCount; i++) {
            if (iCardList[i] == iCard)
                return i;
        }
        return -1;
    }
    //获取指定顺子中牌点最小值(iSequence 代表顺子的牌数最多为
    GetBulkBySpecifySequence(iCardList, iCardCount, iSequence = 3) {
        var temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (var i = 0; i < iCardCount; i++) {
            temp[this.GetCardBulk(iCardList[i])]++;
        }

        for (var k = 0; k < 15; k++) {
            if (temp[k] == iSequence) {
                return k;
            }
        }
        return 0;
    }
    //获取指定顺子中牌点最大值变种顺子
    GetBulkBySpecifyVariationSequence(iCardList, iCardCount, iSequence = 3) {
        var iFirstMax = 0, iSecondMax = 0, iThirdMax = 0;//找出第一大,第二大,第三大的牌,和最小牌
        var temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (var i = 0; i < iCardCount; i++)						//牌多少
        {
            temp[this.GetCardBulk(iCardList[i])]++;
        }
        for (var i = 17; i > 0; i++) {
            if (temp[i] == iSequence) {
                iFirstMax = i;						//可能是2也可以是A
                for (var j = i - 1; j > 0; j--) {
                    if (temp[j] == iSequence)//找到第二大的退出循环(无第三大的)//可能是A也可以非A
                    {
                        iSecondMax = j;
                        for (var k = j - 1; j > 0; j--) {
                            if (temp[k] == iSequence)//查第第三大的退出循环	//可是存在也可以不存在
                            {
                                iThirdMax = k;
                                break;
                            }
                        }
                        break;
                    }
                }
                break;
            }
        }

        if (iFirstMax == 15)	//存在2,再看是否存在A
        {
            if (iSecondMax == 14)		//存在A
            {
                if (iThirdMax == 0)		//不存在第三大,也只有A2两种牌
                    return 2;

                return iThirdMax;		//存在 A2情况包括处理AA2233
            }
            return iSecondMax;
        }
        return 0;
    }
    //查找最小 (1) or 最大 (255) 牌
    GetBulkBySepcifyMinOrMax(iCardList, iCardCount, MinOrMax, bExtVal = false) {
        var CardNum = this.GetCardBulk(iCardList[0], false);
        if (MinOrMax == 1) //找最小的
        {
            for (var i = 1; i < iCardCount; i++) {
                if (this.GetCardBulk(iCardList[i], false) < CardNum)
                    CardNum = this.GetCardBulk(iCardList[i], false);
            }
        }
        else if (MinOrMax == 255) {
            for (var i = 1; i < iCardCount; i++) {
                if (this.GetCardBulk(iCardList[i], false) > CardNum)
                    CardNum = this.GetCardBulk(iCardList[i], false);
            }
        }
        //返回的是 GetCardBulk() 得到的值
        return CardNum;
    }

    //获取牌型
    GetCardShape(iCardList, iCardCount, bExlVal = false) {
        if (this.IsOnlyOne(iCardList, iCardCount) && (this.m_iCardShape & (0x01))) return UG_ONLY_ONE; //单牌
        if (this.IsDouble(iCardList, iCardCount) && (this.m_iCardShape & (0x01 << 1))) return UG_DOUBLE;	 //对牌
        if (this.IsThreeX(iCardList, iCardCount, 0) && (this.m_iCardShape & (0x01 << 2))) return UG_THREE;	 //三张

        if (this.IsThreeX(iCardList, iCardCount, 1) && (this.m_iCardShape & (0x01 << 3))) return UG_THREE_ONE; //三带一
        if (this.IsThreeX(iCardList, iCardCount, 2) && (this.m_iCardShape & (0x01 << 4))) return UG_THREE_TWO; //三带二
        if (this.IsThreeX(iCardList, iCardCount, 3) && (this.m_iCardShape & (0x01 << 5))) return UG_THREE_DOUBLE;	//三带对


        /* 顺子中包括 同花顺,所以先判断是否同花顺,如果不是，再判断是否是顺子，如果是顺子，就是一般的顺子啦*/
        if (this.IsStraightFlush(iCardList, iCardCount) && (this.m_iCardShape & (0x01 << 7))) return UG_STRAIGHT_FLUSH; //同花顺
        if (this.IsStraight(iCardList, iCardCount) && (this.m_iCardShape & (0x01 << 6))) return UG_STRAIGHT;            //顺子	
        if (this.IsDoubleSequence(iCardList, iCardCount) && (this.m_iCardShape & (0x01 << 8))) return UG_DOUBLE_SEQUENCE;  //连对


        if (this.IsThreeXSequence(iCardList, iCardCount, 3) && (this.m_iCardShape & (0x01 << 12))) return UG_THREE_DOUBLE_SEQUENCE; //连的三带对
        if (this.IsThreeXSequence(iCardList, iCardCount, 2) && (this.m_iCardShape & (0x01 << 11))) return UG_THREE_TWO_SEQUENCE; //连的三带二
        if (this.IsThreeXSequence(iCardList, iCardCount, 1) && (this.m_iCardShape & (0x01 << 10))) return UG_THREE_ONE_SEQUENCE; //连的三带一
        if (this.IsThreeXSequence(iCardList, iCardCount, 0) && (this.m_iCardShape & (0x01 << 9))) return UG_THREE_SEQUENCE; //连三

        if (this.IsFourX(iCardList, iCardCount, 4) && (this.m_iCardShape & (0x01 << 16))) return UG_FOUR_TWO_DOUBLE;		//四带二对(要求是二对)
        if (this.IsFourX(iCardList, iCardCount, 3) && (this.m_iCardShape & (0x01 << 15))) return UG_FOUR_ONE_DOUBLE;		//四带一对(要求成对)
        if (this.IsFourX(iCardList, iCardCount, 2) && (this.m_iCardShape & (0x01 << 14))) return UG_FOUR_TWO;			//四带二(不要求成对)
        if (this.IsFourX(iCardList, iCardCount, 1) && (this.m_iCardShape & (0x01 << 13))) return UG_FOUR_ONE;			//四带一

        if (this.IsFourXSequence(iCardList, iCardCount, 4)) return UG_FOUR_TWO_DOUBLE_SEQUENCE;	//四顺带二对
        if (this.IsFourXSequence(iCardList, iCardCount, 2)) return UG_FOUR_TWO_SEQUENCE;	//四顺带二单张
        if (this.IsFourXSequence(iCardList, iCardCount, 0)) return UG_FOUR_SEQUENCE;	//四顺


        if (this.IsKingBomb(iCardList, iCardCount) && (this.m_iCardShape & (0x01 << 20))) return UG_KING_BOMB;//王炸
        if (this.IsBomb(iCardList, iCardCount) && (this.m_iCardShape & (0x01 << 19))) return UG_BOMB; //4张以上同点牌，炸弹
        return UG_ERROR_KIND;
    }
    //是否单牌
    IsOnlyOne(iCardList, iCardCount) { return iCardCount == 1; };
    //是否对牌
    IsDouble(iCardList, iCardCount, bExtVal = false) {
        if (iCardCount != 2)
            return false;
        return this.IsSameNumCard(iCardList, iCardCount, bExtVal);
    }
    //3 带 1or2(带一对带二单张或带一单张
    IsThreeX(iCardList, iCardCount, iX/*1or2*/, bExtVal = false) {
        if (iCardCount > 5 || iCardCount < 3) {
            return false;
        }
        if (this.GetCountBySpecifyNumCount(iCardList, iCardCount, 3) != 1)//是否存在三张
        {
            return false;
        }
        switch (iX) {
            case 0:
                return iCardCount == 3;//IsSameNumCard(iCardList, iCardCount, bExtVal);//不带
            case 1:
                return iCardCount == 4;//带单张
            case 2:
                return iCardCount == 5;//带二张（可以非对子）
            case 3:					//带一对
                return this.GetCountBySpecifyNumCount(iCardList, iCardCount, 2) == 1;//是否存在对牌
            default:
                break;
        }
        return false;
    }
    //王炸
    IsKingBomb(iCardList, iCardCount) {
        if (iCardCount != KING_COUNT)
            return false;
        for (var i = 0; i < iCardCount; i++)
            if (iCardList[i] != 0x4e && iCardList[i] != 0x4f)
                return false;
        return true;
    }
    //4+张牌 炸弹
    IsBomb(iCardList, iCardCount, bExtVal = false) {
        if (iCardCount < 4)
            return false;

        return this.IsSameNumCard(iCardList, iCardCount, bExtVal); //是否是相同数字
    }
    //同花炸弹
    IsBombSameHua(iCardList, iCardCount) {
        if (!this.IsBomb(iCardList, iCardCount)) return false;
        if (!this.IsSameHuaKind(iCardList, iCardCount)) return false;
        return true;
    }
    //同花(非顺子)
    IsFlush(iCardList, iCardCount) {
        return this.IsSameHuaKind(iCardList, iCardCount);
    }
    //是否是同花顺
    IsStraightFlush(iCardList, iCardCount, bExtVal = false) {
        if (!this.IsSameHuaKind(iCardList, iCardCount, bExtVal)) return false; //同花？
        if (!this.IsStraight(iCardList, iCardCount, bExtVal)) return false; //顺子？
        return true;
    }
    //变种单甩
    IsVariationStraight(iCardList, iCardCount, bExtVal = false) {
        if (iCardCount < 5)
            return false;
        return this.IsVariationSequence(iCardList, iCardCount, 1);
    }
    //单甩
    IsStraight(iCardList, iCardCount, bExtVal = false) {
        if (iCardCount < 5)
            return false;
        return this.IsSequence(iCardList, iCardCount, 1);
    }
    //变种对甩
    IsVariationDoubleSequence(iCardList, iCardCount, bExtVal = false) {
        if (iCardCount % 2 != 0 || iCardCount < 4)
            return false;

        return this.IsVariationSequence(iCardList, iCardCount, 2);
    }
    //对甩 //连对?
    IsDoubleSequence(iCardList, iCardCount, bExtVal = false) {
        if (iCardCount % 2 != 0 || iCardCount < 6)
            return false;

        return this.IsSequence(iCardList, iCardCount, 2);
    }

    //是否变种是连续的三带X(0,1,2,3)
    IsVariationThreeXSequence(iCardList, iCardCount, iSeqX/*0,1or2*/, bExtVal = false) {
        if (iCardCount < 6)		//三顺至少2
            return false;

        var iBuffer = [];
        var TackOutCount = 0;
        switch (iSeqX) {
            case 0:
                if (iCardCount % 3 != 0)
                    return false;
                return this.IsVariationSequence(iCardList, iCardCount, 3);
            case 1://带单
                TackOutCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, 3);
                if (TackOutCount > 0 && TackOutCount / 3 * 4 == iCardCount)
                    return this.IsVariationSequence(iBuffer, TackOutCount, 3);
                break;
            case 2://带二单
                TackOutCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, 3);
                if (TackOutCount > 0 && TackOutCount / 3 * 5 == iCardCount)
                    return this.IsVariationSequence(iBuffer, TackOutCount, 3);
            case 3://带一对
                TackOutCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, 3);
                if (TackOutCount > 0 && TackOutCount / 3 * 5 == iCardCount
                    && this.GetCountBySpecifyNumCount(iCardList, iCardCount, 2))
                    return this.IsVariationSequence(iBuffer, TackOutCount, 3);

                break;
        }
        return false;
    }

    //是否是连续的三带X(0,1,2,3)
    IsThreeXSequence(iCardList, iCardCount, iSeqX/*0,1or2*/, bExtVal = false) {
        if (iCardCount < 6)		//三顺至少2
            return false;

        var iBuffer = [];
        var TackOutCount = 0;
        switch (iSeqX) {
            case 0:
                if (iCardCount % 3 != 0)
                    return false;
                return this.IsSequence(iCardList, iCardCount, 3);
            case 1://带单
                TackOutCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, 3);
                if (TackOutCount > 0 && TackOutCount / 3 * 4 == iCardCount)
                    return this.IsSequence(iBuffer, TackOutCount, 3); //2011-6-28 修改333444请允许带55
                //&& (TackOutCount/3==GetCountBySpecifyNumCount(iCardList,iCardCount,1));//沈阳要求333444不能带55;
                break;
            case 2://带二单
                TackOutCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, 3);
                if (TackOutCount > 0 && TackOutCount / 3 * 5 == iCardCount)
                    return this.IsSequence(iBuffer, TackOutCount, 3);
            case 3://带对
                TackOutCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, 3);
                if (TackOutCount > 0 && TackOutCount / 3 * 5 == iCardCount
                    && this.GetCountBySpecifyNumCount(iCardList, iCardCount, 2) == TackOutCount / 3)
                    return this.IsSequence(iBuffer, TackOutCount, 3);

                break;
        }
        return false;
    }
    //是否三顺带二顺(蝴蝶)
    IsThreeSequenceDoubleSequence(iCardList, iCardCount, bExtVal = false) {
        if (iCardCount < 10)		//三顺至少2二顺也至少二
            return false;

        var iBuffer3 = [], iBuffer2 = [];
        var bValue3 = false, bValue2 = false;	//三顺,二顺是否为顺,
        var TackOutCount3 = 0, TackOutCount2 = 0;

        TackOutCount3 = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer3, 3);//三对
        TackOutCount2 = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer2, 2);//二对
        if (TackOutCount3 <= 0 || TackOutCount2 <= 0 || TackOutCount3 + TackOutCount2 != iCardCount || TackOutCount3 / 3 != TackOutCount2 / 2)
            return false;
        bValue3 = this.IsSequence(iBuffer3, TackOutCount3, 3);
        bValue2 = (this.IsVariationSequence(iBuffer2, TackOutCount2, 2) || this.IsSequence(iBuffer2, TackOutCount2, 2));
        return bValue3 && bValue2;
    }
    //是否三顺带二顺(蝴蝶)
    IsVariationThreeSequenceDoubleSequence(iCardList, iCardCount, bExtVal = false) {
        if (iCardCount < 10)		//三顺至少2二顺也至少二
            return false;

        var iBuffer3 = [], iBuffer2 = [];
        var bValue3 = false, bValue2 = false;	//三顺,二顺是否为顺,
        var TackOutCount3 = 0, TackOutCount2 = 0;

        TackOutCount3 = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer3, 3);//三对
        TackOutCount2 = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer2, 2);//二对

        if (TackOutCount3 <= 0 || TackOutCount2 <= 0 || TackOutCount3 + TackOutCount2 != iCardCount || TackOutCount3 / 3 != TackOutCount2 / 2)
            return false;

        bValue3 = this.IsVariationSequence(iBuffer3, TackOutCount3, 3);
        bValue2 = (this.IsVariationSequence(iBuffer2, TackOutCount2, 2) || this.IsSequence(iBuffer2, TackOutCount2, 2));
        return bValue3 && bValue2;
    }
    //510K 炸弹
    IsSlave510K(iCardList, iCardCount, bExtVal = false) {
        if (iCardCount != 3) return false;
        var Test = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (var i = 0; i < iCardCount; i++) {
            Test[this.GetCardNum(i)]++;
        }

        return (Test[5] == Test[10] == Test[13] == 1);
    }
    //510K 同花炸弹
    IsMaster510K(iCardList, iCardCount, bExtVal = false) {
        if (iCardCount != 3) return false; //数量不对
        if (!this.IsSameHuaKind(iCardList, iCardCount, bExtVal)) return false; //同花 ？
        if (!this.IsSlave510K(iCardList, iCardCount, bExtVal)) return false; //510K ？	
        return true;
    }
    //四带一或者四带二
    IsFourX(iCardList, iCardCount, iX/*1or 2*/) {
        if (iCardCount > 8 || iCardCount < 4)
            return false;

        if (this.GetCountBySpecifyNumCount(iCardList, iCardCount, 4) != 1)//是否有四个牌型
            return false;

        switch (iX) {
            case 0:
                return iCardCount == 4;//四张
            case 1:
                return iCardCount == 5;//四带1张
            case 2:
                return iCardCount == 6;//四带2(不要求成对)
            case 3:
                return (iCardCount == 6 && 1 == this.GetCountBySpecifyNumCount(iCardList, iCardCount, 2));//要求成对
            case 4:
                return (iCardCount == 8 && 2 == this.GetCountBySpecifyNumCount(iCardList, iCardCount, 2));	//四带2对
        }
        return false;
    }
    //是否变种四带X顺
    IsVariationFourXSequence(iCardList, iCardCount, iSeqX) {
        if (iCardCount < 8)		//四顺至少2
            return false;

        var iBuffer = [];
        var TackOutCount = 0;
        switch (iSeqX) {
            case 0:
                if (iCardCount % 4 != 0)
                    return false;
                return this.IsVariationSequence(iCardList, iCardCount, 4);

            case 1://带单张
                TackOutCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, 4);
                if (TackOutCount > 0 && TackOutCount / 4 * 5 == iCardCount)
                    return this.IsVariationSequence(iBuffer, TackOutCount, 4);
                break;

            case 2://带二张(可以非对子）
                TackOutCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, 4);
                if (TackOutCount > 0 && TackOutCount / 4 * 6 == iCardCount)
                    return this.IsVariationSequence(iBuffer, TackOutCount, 4);

            case 3://带一对
                TackOutCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, 4);
                if (TackOutCount > 0 && TackOutCount / 4 * 6 == iCardCount
                    && TackOutCount / 4 == this.GetBulkBySpecifyCardCount(iCardList, iCardCount, 2))
                    return this.IsVariationSequence(iBuffer, TackOutCount, 4);

            case 4://(带二对）
                TackOutCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, 4);
                if (TackOutCount > 0 && TackOutCount / 4 * 6 == iCardCount
                    && TackOutCount / 2 == this.GetBulkBySpecifyCardCount(iCardList, iCardCount, 2))
                    return this.IsVariationSequence(iBuffer, TackOutCount, 4);
                break;
        }
        return false;
    }
    //四带一或者四带二的顺子
    IsFourXSequence(iCardList, iCardCount, iSeqX) {
        if (iCardCount < 8)		//四顺至少2
            return false;

        var iBuffer = [];
        var TackOutCount = 0;
        switch (iSeqX) {
            case 0:
                if (iCardCount % 4 != 0)
                    return false;
                return this.IsSequence(iCardList, iCardCount, 4);

            case 1://带单张
                TackOutCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, 4);
                if (TackOutCount > 0 && TackOutCount / 4 * 5 == iCardCount)
                    return this.IsSequence(iBuffer, TackOutCount, 4);
                break;

            case 2://带二张(可以非对子）
                TackOutCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, 4);
                if (TackOutCount > 0 && TackOutCount / 4 * 6 == iCardCount)
                    return this.IsSequence(iBuffer, TackOutCount, 4);

            case 3://带一对
                TackOutCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, 4);
                if (TackOutCount > 0 && TackOutCount / 4 * 6 == iCardCount
                    && TackOutCount / 4 == this.GetBulkBySpecifyCardCount(iCardList, iCardCount, 2))
                    return this.IsSequence(iBuffer, TackOutCount, 4);

            case 4://(带二对）
                TackOutCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iBuffer, 4);
                if (TackOutCount > 0 && TackOutCount / 4 * 6 == iCardCount
                    && TackOutCount / 2 == this.GetBulkBySpecifyCardCount(iCardList, iCardCount, 2))
                    return this.IsSequence(iBuffer, TackOutCount, 4);
                break;
        }
        return false;
    }

    //自动出牌函数
    AutoOutCard(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount, bFirstOut) {
        iResultCardCount = 0;
        if (bFirstOut) //先手出最右边一手牌
        {
            iResultCardCount = this.TackOutCardBySpecifyCardNum(iHandCard, iHandCardCount, iResultCard, iResultCardCount, iHandCard[iHandCardCount - 1]);
        }
        else //跟牌
        {
            //从手中的牌中找出比桌面上大的牌
            iResultCardCount = this.TackOutCardMoreThanLast(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount, false);

            if (!this.CanOutCard(iResultCard, iResultCardCount, iBaseCard, iBaseCardCount, iHandCard, iHandCardCount)) {
                iResultCardCount = 0;
            }
        }

        return iResultCardCount;
    }
    //是否可以出牌
    CanOutCard(iOutCard, iOutCount, iBaseCard, iBaseCount, iHandCard, iHandCount, bFirstOut = false) {
        var iOutCardShape = this.GetCardShape(iOutCard, iOutCount);

        if (iOutCardShape == UG_ERROR_KIND) //牌型不对
        {
            return false;
        }

        if (bFirstOut) {
            return true;
        }
        var iBaseCardShape = this.GetCardShape(iBaseCard, iBaseCount); //桌面上的牌型

        if (iBaseCardShape > iOutCardShape)						//牌形<
        {
            return false;
        }

        if (iBaseCardShape < iOutCardShape)						//牌形>
        {
            if (UG_SLAVE_510K <= iOutCardShape)					//炸弹
            {
                return true;
            }
            //处理不一样的牌形也可以大变种顺子和顺子大小比较
            if (iBaseCount != iOutCount) //张数限制
                return false;

            switch (iBaseCardShape) {
                case UG_STRAIGHT:									//同花順大于順子
                    {
                        if (iOutCardShape == UG_STRAIGHT_FLUSH)
                            return true;
                    }
                case UG_VARIATION_STRAIGHT:							//最小变种顺子
                    {
                        if (iOutCardShape == UG_STRAIGHT)			//变咱顺子中有效最大值小于正常顺子中最大牌
                            return this.GetBulkBySpecifyVariationSequence(iBaseCard, iBaseCount, 1) < this.GetBulkBySpecifySequence(iOutCard, iOutCount, 1);
                        return false;
                    }

                case UG_VARIATION_DOUBLE_SEQUENCE://最小变种顺子
                    {
                        if (iOutCardShape == UG_DOUBLE_SEQUENCE)	//变咱顺子中有效最大值小于正常顺子中最大牌
                            return this.GetBulkBySpecifyVariationSequence(iBaseCard, iBaseCount, 2) < this.GetBulkBySpecifySequence(iOutCard, iOutCount, 2);
                        return false;
                    }

                case UG_VARIATION_THREE_SEQUENCE:		//变种三顺
                case UG_VARIATION_THREE_ONE_SEQUENCE://变种三顺
                case UG_VARIATION_THREE_TWO_SEQUENCE://变种三带二顺
                case UG_VARIATION_THREE_DOUBLE_SEQUENCE://变种三带二顺
                case UG_VARIATION_THREE_SEQUENCE_DOUBLE_SEQUENCE://变种三顺带二顺
                    {
                        if (iOutCardShape == iBaseCardShape + 1)
                            return this.GetBulkBySpecifyVariationSequence(iBaseCard, iBaseCount, 3) < this.GetBulkBySpecifySequence(iOutCard, iOutCount, 3);
                        return false;
                    }
                case UG_VARIATION_FOUR_SEQUENCE:		//变种四顺
                case UG_VARIATION_FOUR_ONE_SEQUENCE:	//变种四带一顺
                case UG_VARIATION_FOUR_TWO_SEQUENCE:	//变种四带二顺
                case UG_VARIATION_FOUR_ONE_DOUBLE_SEQUENCE://变种四带一对顺
                case UG_VARIATION_FOUR_TWO_DOUBLE_SEQUENCE://变种四带二对顺
                    {
                        if (iOutCardShape == iBaseCardShape + 1)
                            return this.GetBulkBySpecifyVariationSequence(iBaseCard, iBaseCount, 4) < this.GetBulkBySpecifySequence(iOutCard, iOutCount, 4);
                        return false;
                    }
                case UG_THREE_TWO://三帶一對＞三帶二單
                    {
                        if (iOutCardShape == UG_THREE_DOUBLE)
                            return this.GetBulkBySpecifyCardCount(iBaseCard, iBaseCount, 3) < this.GetBulkBySpecifyCardCount(iOutCard, iOutCount, 3);
                        return false;
                    }
                case UG_THREE_TWO_SEQUENCE://三帶一對順(或蝴蝶)>三帶二單順
                    {
                        if (iOutCardShape == UG_THREE_DOUBLE_SEQUENCE || iOutCardShape == UG_THREE_SEQUENCE_DOUBLE_SEQUENCE)
                            return this.GetBulkBySpecifyCardCount(iBaseCard, iBaseCount, 3) < this.GetBulkBySpecifyCardCount(iOutCard, iOutCount, 3);
                        return false;
                    }
                case UG_FOUR_TWO://四帶一對＞四帶二單
                    {
                        if (iOutCardShape == UG_FOUR_ONE_DOUBLE)
                            return this.GetBulkBySpecifyCardCount(iBaseCard, iBaseCount, 4) < this.GetBulkBySpecifyCardCount(iOutCard, iOutCount, 4);
                        return false;
                    }
                case UG_FOUR_TWO_SEQUENCE://四帶一對順＞四帶二單順
                    {
                        if (iOutCardShape == UG_FOUR_ONE_DOUBLE_SEQUENCE)
                            return this.GetBulkBySpecifyCardCount(iBaseCard, iBaseCount, 4) < this.GetBulkBySpecifyCardCount(iOutCard, iOutCount, 4);
                        return false;
                    }
                case UG_THREE_DOUBLE_SEQUENCE:	//蝴蝶大于三順帶對
                    {
                        if (iOutCardShape == UG_THREE_SEQUENCE_DOUBLE_SEQUENCE)
                            return this.GetBulkBySpecifySequence(iBaseCard, iBaseCount, 3) < this.GetBulkBySpecifySequence(iOutCard, iOutCount, 3);
                        return false;
                    }
            }
            return false;
        }

        switch (iBaseCardShape)			//处理牌形一致
        {
            case UG_ONLY_ONE:  //单张
            case UG_DOUBLE:    //对牌
            case UG_THREE:     //三张
                {
                    return this.GetBulkBySepcifyMinOrMax(iBaseCard, iBaseCount, 1) < this.GetBulkBySepcifyMinOrMax(iOutCard, iOutCount, 1);
                }
            case UG_BOMB: //4+张 炸弹
                {
                    if (iBaseCount > iOutCount) //张数大的炸弹大
                        return false;
                    if (iBaseCount == iOutCount) //张数相同,比点数
                        return this.GetBulkBySepcifyMinOrMax(iBaseCard, iBaseCount, 1) < this.GetBulkBySepcifyMinOrMax(iOutCard, iOutCount, 1);
                    return true;
                }

            case UG_FLUSH:			//同花(非顺子）比较同花中最大的牌
                {
                    return this.GetBulkBySepcifyMinOrMax(iBaseCard, iBaseCount, 255) < this.GetBulkBySepcifyMinOrMax(iOutCard, iOutCount, 255);
                }
            case UG_STRAIGHT_FLUSH: //同花顺
            case UG_STRAIGHT:		//顺子
            case UG_DOUBLE_SEQUENCE: //连对
            case UG_THREE_SEQUENCE:  //连三  
            case UG_FOUR_SEQUENCE:	//四顺
                if (iOutCount != iBaseCount)
                    return false;
                {
                    return this.GetBulkBySepcifyMinOrMax(iBaseCard, iBaseCount, 1) < this.GetBulkBySepcifyMinOrMax(iOutCard, iOutCount, 1);
                }

            case UG_THREE_ONE:		//三带一
            case UG_THREE_TWO:		//三带二
            case UG_THREE_DOUBLE:	//三带对
                //比一下三张牌的牌点大小就行拉
                //return (SearchThreeCard(iBaseCard, iBaseCount) < SearchThreeCard(iOutCard, iOutCount));
                {
                    return this.GetBulkBySpecifyCardCount(iBaseCard, iBaseCount, 3) < this.GetBulkBySpecifyCardCount(iOutCard, iOutCount, 3);
                }
            case UG_FOUR_ONE:						//四带一
            case UG_FOUR_TWO:						//四带二
            case UG_FOUR_ONE_DOUBLE:				//四带一对
            case UG_FOUR_TWO_DOUBLE:				//四带二对
                {
                    return this.GetBulkBySpecifyCardCount(iBaseCard, iBaseCount, 4) < this.GetBulkBySpecifyCardCount(iOutCard, iOutCount, 4);
                }

            case UG_THREE_ONE_SEQUENCE: //2+个三带一
            case UG_THREE_TWO_SEQUENCE: //2+个三带二
            case UG_THREE_DOUBLE_SEQUENCE://三带对顺
            case UG_THREE_SEQUENCE_DOUBLE_SEQUENCE:		//三顺带二顺(蝴蝶)
                {
                    if (iOutCount != iBaseCount)
                        return false;
                    return (this.GetBulkBySpecifySequence(iBaseCard, iBaseCount, 3) < this.GetBulkBySpecifyCardCount(iOutCard, iOutCount, 3));
                }
            case UG_FOUR_ONE_SEQUENCE:					//四顺
            case UG_FOUR_TWO_SEQUENCE:
            case UG_FOUR_ONE_DOUBLE_SEQUENCE:
            case UG_FOUR_TWO_DOUBLE_SEQUENCE:
                {
                    return (this.GetBulkBySpecifySequence(iBaseCard, iBaseCount, 4) < this.GetBulkBySpecifyCardCount(iOutCard, iOutCount, 4));
                }
            case UG_MASTER_510K: //同花510K，花色:黑桃 > 红桃 > 梅花 > 方片
                {
                    return (this.GetCardHuaKind(iBaseCard[0], true) < this.GetCardHuaKind(iOutCard[0], true)); //比花色
                }
            case UG_SLAVE_510K: //副510K都一样大
                {
                    return false;
                }
            //变种牌形处理
            case UG_VARIATION_STRAIGHT://单顺
                {
                    if (iOutCount != iBaseCount)
                        return false;
                    return (this.GetBulkBySpecifyVariationSequence(iBaseCard, iBaseCount, 1) < this.GetBulkBySpecifyVariationSequence(iOutCard, iOutCount, 1));
                }
            case UG_VARIATION_DOUBLE_SEQUENCE://对顺
                {
                    if (iOutCount != iBaseCount)
                        return false;
                    return (this.GetBulkBySpecifyVariationSequence(iBaseCard, iBaseCount, 2) < this.GetBulkBySpecifyVariationSequence(iOutCard, iOutCount, 2));
                }
            case UG_VARIATION_THREE_SEQUENCE://三顺
            case UG_VARIATION_THREE_ONE_SEQUENCE://三带一顺
            case UG_VARIATION_THREE_TWO_SEQUENCE://三带二顺
            case UG_VARIATION_THREE_DOUBLE_SEQUENCE://三带对顺
            case UG_VARIATION_THREE_SEQUENCE_DOUBLE_SEQUENCE://三顺带二顺
                {
                    if (iOutCount != iBaseCount)
                        return false;
                    return (this.GetBulkBySpecifyVariationSequence(iBaseCard, iBaseCount, 3) < this.GetBulkBySpecifyVariationSequence(iOutCard, iOutCount, 3));
                }
            case UG_VARIATION_FOUR_SEQUENCE:		//变种四顺
            case UG_VARIATION_FOUR_ONE_SEQUENCE:	//变种四带一顺
            case UG_VARIATION_FOUR_TWO_SEQUENCE:	//变种四带二顺
            case UG_VARIATION_FOUR_ONE_DOUBLE_SEQUENCE://变种四带一对顺
            case UG_VARIATION_FOUR_TWO_DOUBLE_SEQUENCE://变种四带二对顺
                {
                    if (iOutCount != iBaseCount)
                        return false;
                    return (this.GetBulkBySpecifySequence(iBaseCard, iBaseCount, 4) < this.GetBulkBySpecifyCardCount(iOutCard, iOutCount, 4));
                }
        }

        return false;
    }
    //查找比当前出牌大的
    TackOutCardMoreThanLast(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount, bExtVal = false) {
        var iTempCard = [];
        for (var i = 0; i < 45; i++) {
            iTempCard.push(0);
        }

        iResultCardCount = 0;
        var iBaseShape = this.GetCardShape(iBaseCard, iBaseCardCount); //桌面上牌的牌型
        switch (iBaseShape) {
            case UG_ONLY_ONE: //单张
            case UG_DOUBLE:   //对牌
            case UG_THREE:    //三张
            case UG_BOMB:	//四张 炸弹
                {
                    //查找1,2,3,or4张牌
                    var iCount = this.TackOutBySepcifyCardNumCount(iHandCard, iHandCardCount, iTempCard, iBaseCardCount);

                    if (iCount > 0) {
                        var Step = this.GetSerialByMoreThanSpecifyCard(iTempCard, iCount, iBaseCard[0], iBaseCardCount, false);
                        for (var i = 0; i < iBaseCardCount; i++) {
                            iResultCard.push(iTempCard[Step + i]);
                        }
                        //	CopyMemory(iResultCard, &iTempCard[Step], sizeof()*iBaseCardCount);	

                        if (this.CompareOnlyOne(iBaseCard[0], iResultCard[0])) {
                            iResultCardCount = iBaseCardCount;
                        }
                        else {
                            if (iBaseShape != UG_BOMB) {
                                //查找炸弹

                                iCount = this.TackOutBySepcifyCardNumCount(iHandCard, iHandCardCount, iTempCard, 4);
                                if (iCount >= 4) {
                                    for (var i = 0; i < 4; i++) {
                                        iResultCard.push(iTempCard[i]);
                                    }
                                    //     CopyMemory(iResultCard, &iTempCard, sizeof() * 4);
                                    iResultCardCount = 4;
                                    return iResultCardCount;
                                }
                                else {
                                    break;;
                                }
                            }
                            else {
                                break;
                            }
                        }
                    }
                    break;
                }
            //case UG_THREE:    //三张也可以用下面的来提取
            case UG_THREE_ONE: //三带一
                {
                    var res = this.TackOutThreeX(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount, 1);
                    iResultCardCount = res[1];
                    if (res[0])
                        return iResultCardCount;
                    break;
                }
            case UG_THREE_TWO: //三带二张
                {
                    var res = this.TackOutThreeX(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount, 2);
                    iResultCardCount = res[1];
                    if (res[0])
                        return iResultCardCount;
                    break;
                }
            case UG_THREE_DOUBLE:	//三带一对
                {
                    var res = this.TackOutThreeX(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount, 3);
                    iResultCardCount = res[1];
                    if (res[0])
                        return iResultCardCount;
                    break;
                }
            case UG_FLUSH:		//同花
                {
                    //if(TackOutStraightFlush(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount))
                    //	return true;
                    break;
                }

            case UG_STRAIGHT: //顺子
                /*if(TackOutStraightFlush(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount))
                {
                return true; //先找相同牌点的同花顺
                }*/
                var res = this.TackOutSequence(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount, 1);
                iResultCardCount = res[1];
                if (res[0]) {
                    return iResultCardCount; //再找牌点大的顺子
                }
                break;
            case UG_STRAIGHT_FLUSH: //同花顺
                {
                    if (this.TackOutStraightFlush(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount))
                        return true;
                }
                break;
            case UG_DOUBLE_SEQUENCE: //连对
                {
                    var res = this.TackOutSequence(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount, 2);
                    iResultCardCount = res[1];
                    if (res[0]) {
                        return iResultCardCount; //再找牌点大的顺子
                    }
                    break;
                }
            case UG_THREE_SEQUENCE: //连三
                {
                    var res = this.TackOutSequence(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount, 3);
                    iResultCardCount = res[1];
                    if (res[0]) {
                        return iResultCardCount; //再找牌点大的顺子
                    }
                }

            case UG_THREE_ONE_SEQUENCE: //三带一的连牌
                {
                    var res = this.TrackOut3XSequence(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount, 1);
                    iResultCardCount = res[1];
                    if (res[0])
                        break;
                }
            case UG_THREE_TWO_SEQUENCE: //三带二的连牌
                var res = this.TrackOut3XSequence(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount, 2);
                iResultCardCount = res[1];
                if (res[0])
                    return iResultCardCount;
            case UG_THREE_DOUBLE_SEQUENCE://三带对连牌
                {
                    var res = this.TrackOut3XSequence(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount, 3);
                    iResultCardCount = res[1];
                    if (res[0])
                        return iResultCardCount;
                    break;
                }
            case UG_THREE_SEQUENCE_DOUBLE_SEQUENCE:
                {
                    var res = this.TrackOut3Sequence2Sequence(iHandCard, iHandCardCount, iBaseCard, iBaseCardCount, iResultCard, iResultCardCount);
                    iResultCardCount = res[1];
                    if (res[0])
                        return iResultCardCount;
                    break;
                }
            //case UG_FOUR_ONE_SEQUENCE:

            case UG_SLAVE_510K: //只能用同花来压,属于找大的牌型,用下面的来处理
            //	break;
            case UG_MASTER_510K:
                this.TrackOut510K(iHandCard, iHandCardCount, iResultCard, iResultCardCount, true); //找出同花 510K
                if (this.GetCardHuaKind(iBaseCard[0], true) >= this.GetCardHuaKind(iResultCard[0], true)) //比较花色
                {
                    iResultCardCount = 0;
                }
                break;
            default:
                iResultCardCount = 0;
        }

        if (iResultCardCount == 0) //没找到同牌型的大牌,就找大一点的牌型
        {
            for (var i = 0; i < 45; i++) {
                iResultCard[i] = 0;
            }
            switch (iBaseShape) {
                case UG_ONLY_ONE: //可以拆对子,拆三条来压单牌或者对子
                case UG_DOUBLE:
                    {
                        var res = this.TackOutCardByNoSameShape(iHandCard, iHandCardCount, iResultCard, iResultCardCount, iBaseCard, iBaseCardCount);
                        iResultCardCount = res[1];
                        if (res[0])
                            return iResultCardCount;
                        break;
                    }
                case UG_BOMB:
                    {
                        //上面没找到相同数量的大炸弹,这里找数量更多的
                        var res = this.TackOutBomb(iHandCard, iHandCardCount, iResultCard, iResultCardCount, iBaseCardCount + 1);
                        iResultCardCount = res[1];
                        if (res[0])
                            return iResultCardCount;
                    }
                    break;
                default: //如果找不到大的对子单牌就找大的牌型,warning此处不用break;
                    break;
            }
        }

        if (iResultCardCount == 0) {
            for (var i = 0; i < 45; i++) {
                iResultCard[i] = 0;
            }
            // memset(iResultCard, 0, sizeof() * 45);
            iResultCardCount = this.TackOutMoreThanLastShape(iHandCard, iHandCardCount, iResultCard, iResultCardCount, iBaseCard, iBaseCardCount);
        }
        //				if(TackOutMoreThanLastShape(iHandCard, iHandCardCount, iResultCard, iResultCardCount, iBaseCard, iBaseCardCount))
        //				{
        //					return true;
        //				}
        return iResultCardCount;
    }

    //提取单个的三带1 or 2or 3(单,一对,或二单张)
    TackOutThreeX(iCardList, iCardCount, iBaseCard, iBaseCount, iResultCard, iResultCount, iValue) {
        iResultCount = 0;
        if (iCardCount < iBaseCount)
            return [false,iResultCount];
        var iTempCard = [];
        var threecard = this.GetBulkBySpecifyCardCount(iBaseCard, iBaseCount, 3);//桌面牌三张的点数
        //3张牌总个数
        var iCount = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, iTempCard, 3);

        if (iCount > 0)//提取大于桌面的三条
        {
            var byCardTemp = 0x00;
            for (var i = 0; i < iBaseCount; ++i) {
                if (threecard == this.GetCardBulk(iBaseCard[i])) {
                    byCardTemp = iBaseCard[i];
                    break;
                }
            }
            if (0x00 == byCardTemp) {
                return [false,iResultCount];
            }

            var Step = this.GetSerialByMoreThanSpecifyCard(iTempCard, iCount, byCardTemp, 3, true);//牌面值进去
            //if(Step == 0)
            //	return false;
            iResultCard = [].concat(iTempCard.slice(Step, Step + 3))
            //CopyMemory(iResultCard, iTempCard[Step], sizeof()*3);	

            //if(CompareOnlyOne(iBaseCard[0], iResultCard[0]))			//由于传过来的step可能为0得进行一次比较处理
            if (threecard >= this.GetBulkBySpecifyCardCount(iResultCard, 3, 3))
                return [false,iResultCount];
            //iResultCount = 3;
            //else
            //	return false;
        } else
            return [false,iResultCount];
        //将原值移走
        var Tmp = [];
        var iTempCount = iCardCount;
        Tmp = [].concat(iCardList.slice(0, iCardCount));
        //::CopyMemory(Tmp,iCardList,sizeof()*iCardCount);
        this.RemoveCard(iResultCard, 3, Tmp, iTempCount);
        iTempCount -= 3;
        var destCount = iBaseCount - 3;
        //	TCHAR sz[200];
        //	wsprintf(sz,"iValue=%d,destCount=%d",iValue,destCount);
        //	WriteStr(sz,8,8);
        switch (iValue) {
            case 1:
            case 2:
                {
                    iCount = this.TackOutBySepcifyCardNumCount(Tmp, iTempCount, iTempCard, 1);
                    if (iCount >= destCount)//查找到单牌
                    {
                        for (var i = 0; i < destCount; i++) {
                            iResultCard[3 + i] = iTempCard[i];
                        }
                        //	CopyMemory(iResultCard[3],iTempCard,sizeof()*destCount);
                        iResultCount = iBaseCount;
                        break;
                    }
                    //拆对来补单牌
                    iCount = this.TackOutBySepcifyCardNumCount(Tmp, iTempCount, iTempCard, 2);
                    if (iCount >= destCount) {
                        for (var i = 0; i < destCount; i++) {
                            iResultCard[3 + i] = iTempCard[i];
                        }
                        //	CopyMemory(&iResultCard[3],iTempCard,sizeof()*destCount);
                        iResultCount = iBaseCount;
                        break;
                    }

                    //拆三张来补单牌
                    iCount = this.TackOutBySepcifyCardNumCount(Tmp, iTempCount, iTempCard, 3);
                    if (iCount < 3)//仅一三张无法拆
                        break;
                    for (var i = 0; i < destCount; i++) {
                        iResultCard[3 + i] = iTempCard[i];
                    }
                    //	CopyMemory(&iResultCard[3],iTempCard,sizeof()*destCount);
                    iResultCount = iBaseCount;
                    break;
                }
            case 3:
                {
                    iCount = this.TackOutBySepcifyCardNumCount(Tmp, iTempCount, iTempCard, 2);
                    if (iCount > 0) {
                        for (var i = 0; i < destCount; i++) {
                            iResultCard[3 + i] = iTempCard[i];
                        }
                        //	CopyMemory(&iResultCard[3],iTempCard,sizeof()*destCount);
                        iResultCount = iBaseCount;
                        break;
                    }
                    //拆三张来补单牌
                    iCount = this.TackOutBySepcifyCardNumCount(Tmp, iTempCount, iTempCard, 3);
                    if (iCount < 3)//仅一三张无法拆
                        break;

                    for (var i = 0; i < destCount; i++) {
                        iResultCard[3 + i] = iTempCard[i];
                    }
                    //	CopyMemory(&iResultCard[3],iTempCard,sizeof()*destCount);
                    iResultCount = iBaseCount;
                    break;

                }
            default:
                iResultCount = 0;
                break;
        }
        //		wsprintf(sz,"iResultCount=%d,iBaseCount=%d",iResultCount,iBaseCount);
        //	WriteStr(sz,8,8);
        if (iResultCount == iBaseCount)
            return [true,iResultCount];
        iResultCount = 0;
        return [false,iResultCount];
    }
    //提取2个以上连续的三带1,2
    TrackOut3XSequence(iCardList, iCardCount, iBaseCard, iBaseCount, iResultCard, iResultCardCount, xValue) {
        iResultCardCount = 0;
        if (iCardCount < iBaseCount)	//张数不够
            return [false, iResultCardCount];
        var tmpBaseCard = [];
        var tmpbaseCardCount = 0, destCardCount = 0;
        //将桌面牌的三条分离出来
        tmpbaseCardCount = this.TackOutBySepcifyCardNumCount(iBaseCard, iBaseCount, tmpBaseCard, 3);
        if (tmpbaseCardCount < 6)	//至少六张以上
            return [false, iResultCardCount];
        //TCHAR sz[200];
        //wsprintf(sz,"三顺子提取之前%d",iResultCardCount);
        //WriteStr(sz);	
        //先提取比桌面大的三顺
        var res = this.TackOutSequence(iCardList, iCardCount, tmpBaseCard, tmpbaseCardCount, iResultCard, iResultCardCount, 3);
        if (!res[0])
            return res;
        //TCHAR sz[200];
        //wsprintf(sz,"三顺子提取成功%d",iResultCardCount);
        //WriteStr(sz);
        //将手牌复制一份
        var TMP = [];
        var TmpCount = iCardCount;
        Tmp = [].concat(iCardList.slice(0, iCardCount));
        //::CopyMemory(TMP,iCardList,sizeof()*iCardCount);
        this.RemoveCard(iResultCard, iResultCardCount, TMP, TmpCount);
        TmpCount -= iResultCardCount;
        destCardCount = iBaseCount - iResultCardCount;	//补牌数量

        switch (xValue) {
            case 1:
            case 2:
                {
                    tmpbaseCardCount = this.TackOutBySepcifyCardNumCount(TMP, TmpCount, tmpBaseCard, 1);//凑单牌
                    if (tmpbaseCardCount >= destCardCount) {
                        for (var i = 0; i < destCardCount; i++) {
                            iResultCard[iResultCardCount + i] = tmpBaseCard[i];
                        }
                        //::CopyMemory(&iResultCard[iResultCardCount],tmpBaseCard,sizeof()*destCardCount);//够单
                        iResultCardCount += destCardCount;
                    }
                    else {
                        for (var i = 0; i < tmpbaseCardCount; i++) {
                            iResultCard[iResultCardCount + i] = tmpBaseCard[i];
                        }
                        //::CopyMemory(&iResultCard[iResultCardCount],tmpBaseCard,sizeof()*tmpbaseCardCount);
                        iResultCardCount += tmpbaseCardCount;
                        destCardCount -= tmpbaseCardCount;
                        tmpbaseCardCount = this.TackOutBySepcifyCardNumCount(TMP, TmpCount, tmpBaseCard, 2);//用对牌补
                        if (tmpbaseCardCount >= destCardCount) {
                            for (var i = 0; i < destCardCount; i++) {
                                iResultCard[iResultCardCount + i] = tmpBaseCard[i];
                            }
                            //::CopyMemory(&iResultCard[iResultCardCount],tmpBaseCard,sizeof()*destCardCount);
                            iResultCardCount += destCardCount;
                        }
                        else {
                            for (var i = 0; i < tmpbaseCardCount; i++) {
                                iResultCard[iResultCardCount + i] = tmpBaseCard[i];
                            }
                            //	::CopyMemory(&iResultCard[iResultCardCount],tmpBaseCard,sizeof()*tmpbaseCardCount);
                            iResultCardCount += tmpbaseCardCount;
                            destCardCount -= tmpbaseCardCount;
                            tmpbaseCardCount = this.TackOutBySepcifyCardNumCount(TMP, TmpCount, tmpBaseCard, 3);//用三条补
                            //
                            if (tmpbaseCardCount >= destCardCount) {
                                for (var i = 0; i < destCardCount; i++) {
                                    iResultCard[iResultCardCount + i] = tmpBaseCard[i];
                                }
                                //	::CopyMemory(&iResultCard[iResultCardCount],tmpBaseCard,sizeof()*destCardCount);
                                iResultCardCount += destCardCount;
                            }
                        }
                    }
                    break;
                }
            case 3:
                {
                    tmpbaseCardCount = this.TackOutBySepcifyCardNumCount(TMP, TmpCount, tmpBaseCard, 2);//凑对牌
                    if (tmpbaseCardCount >= destCardCount) {
                        for (var i = 0; i < destCardCount; i++) {
                            iResultCard[iResultCardCount + i] = tmpBaseCard[i];
                        }
                        //::CopyMemory(&iResultCard[iResultCardCount], tmpBaseCard, sizeof() * destCardCount);
                        iResultCardCount += destCardCount;
                    }
                    else {
                        for (var i = 0; i < tmpbaseCardCount; i++) {
                            iResultCard[iResultCardCount + i] = tmpBaseCard[i];
                        }
                        //::CopyMemory(&iResultCard[iResultCardCount], tmpBaseCard, sizeof() * tmpbaseCardCount);
                        iResultCardCount += tmpbaseCardCount;
                        destCardCount -= tmpbaseCardCount;
                        //tmpbaseCardCount =TackOutBySepcifyCardNumCount(TMP,TmpCount,tmpBaseCard,3);//用三条补对
                        tmpbaseCardCount = this.TackOutMuchToFew(TMP, TmpCount, tmpBaseCard, tmpbaseCardCount, 3, 2);	//将手中三条拆成对来配
                        if (tmpbaseCardCount >= destCardCount)//三条拆对够补
                        {
                            for (var i = 0; i < destCardCount; i++) {
                                iResultCard[iResultCardCount + i] = tmpBaseCard[i];
                            }
                            //::CopyMemory(&iResultCard[iResultCardCount], tmpBaseCard, sizeof() * destCardCount);
                            iResultCardCount += destCardCount;
                        }
                    }
                    break;
                }
            default:
                break;
        }
        //wsprintf(sz,"iResultCardCount=%d,iBaseCount=%d",iResultCardCount,iBaseCount);
        //WriteStr(sz);
        if (iResultCardCount == iBaseCount)
            return [true, iResultCardCount];
        iResultCardCount = 0;
        return [false, iResultCardCount];
        //return (iResultCardCount == iBaseCount);
    }
    //提取2个以上连续的三带1,2
    TrackOut3Sequence2Sequence(iCardList, iCardCount, iBaseCard, iBaseCount, iResultCard, iResultCardCount) {
        iResultCardCount = 0;
        if (iCardCount < iBaseCount)	//张数不够
            return [false, iResultCardCount];
        var tmpBaseCard = [];
        var tmpbaseCardCount = 0, destCardCount = 0;
        //将桌面牌的三条分离出来
        tmpbaseCardCount = this.TackOutBySepcifyCardNumCount(iBaseCard, iBaseCount, tmpBaseCard, 3);
        if (tmpbaseCardCount < 6)	//至少六张以上
            return [false, iResultCardCount];
        //先提取比桌面大的三顺
         var res = this.TackOutSequence(iCardList, iCardCount, tmpBaseCard, tmpbaseCardCount, iResultCard, iResultCardCount, 3);
        if (!res[0])
            return res;
        //将手牌复制一份(移除三顺牌)
        var TMP = [];
        var TmpCount = iCardCount;
        Tmp = [].concat(iCardList.slice(0, iCardCount));
        //::CopyMemory(TMP,iCardList,sizeof()*iCardCount);
        this.RemoveCard(iResultCard, iResultCardCount, TMP, TmpCount);
        TmpCount -= iResultCardCount;
        destCardCount = iBaseCount - iResultCardCount;	//补牌数量

        var twoList = [];
        var twoCount;
        //将桌面牌的二顺分离出来
        tmpbaseCardCount = this.TackOutBySepcifyCardNumCount(iBaseCard, iBaseCount, tmpBaseCard, 2);
        var res = this.TackOutSequence(TMP, TmpCount, tmpBaseCard, tmpbaseCardCount, twoList, twoCount, 2, true);
        if (!res[0])
            return res;
        //	 TwoSequenceLen = (iBaseCount- tmpbaseCardCount)/2;
        //	tmpbaseCardCount =TackOutBySepcifyCardNumCount(TMP,TmpCount,tmpBaseCard,3);
        for (var i = 0; i < twoCount; i++) {
            iResultCard[iResultCardCount + i] = twoList[i];
        }
        //::CopyMemory(&iResultCard[iResultCardCount],twoList,sizeof()*twoCount);
        iResultCardCount += twoCount;
        return [true, iResultCardCount];
    }
    //获取顺子中最小位置值(xSequence表示默认单顺)
    GetSequenceStartPostion(iCardList, iCardCount, xSequence = 1) {
        var temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var Postion = 0;
        for (var i = 0; i < iCardCount; i++) {
            temp[this.GetCardBulk(iCardList[i])]++;
        }

        for (var i = 0; i < 18; i++) {
            if (temp[i] == xSequence)
                return i;
        }
        return Postion;
    }
    //提取单张的顺子,连对顺子,连三顺子
    TackOutSequence(iCardList, iCardCount, iBaseCard, iBaseCount, iResultCard, iResultCount, xSequence, bNoComp = false) {
        iResultCount = 0;
        var iTack = [];
        var iTackCount = iCardCount;
        //复制一份
        iTack = [].concat(iCardList.slice(0, iCardCount));
        //::CopyMemory(iTack,iCardList,sizeof()*iCardCount);
        var iBuffer = [];
        var iBufferCount = 0;
        var iBaseStart, iDestStart = 0, iDestEnd = 0;
        var iSequenceLen = iBaseCount;
        var temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var num = 0;
        //提取所有炸弹(从手中删除所有炸弹)
        iBufferCount =  this.TackOutAllBomb(iTack, iTackCount, iBuffer, iBufferCount);
        this.RemoveCard(iBuffer, iBufferCount, iTack, iTackCount);
        iTackCount -= iBufferCount;
        //进行一次系统序例化处理(按牌形排序，小->大测试
        this.SortCard(iTack, null, iTackCount, true);
        //用缓冲队例保存
        for (var i = 0; i < iTackCount; i++) {
            temp[this.GetCardBulk(iTack[i])]++;
        }

        switch (xSequence) {
            //单顺
            case 1:
                iSequenceLen = iBaseCount;
                if (!bNoComp)
                    iBaseStart = this.GetSequenceStartPostion(iBaseCard, iBaseCount, 1);
                else
                    iBaseStart = 2;
                for (var i = iBaseStart + 1; i < 15; i++) {
                    if (temp[i] >= 1) {
                        if (iDestStart == 0)
                            iDestStart = i;
                        iDestEnd++;
                        if (iDestEnd == iSequenceLen)
                            break;
                    } else {
                        iDestStart = 0;
                        iDestEnd = 0;
                    }
                }
                if (iDestEnd != iSequenceLen)
                    return [false, iResultCount];
                //提取队列
                for (var j = 0; j < iTackCount; j++) {
                    if (this.GetCardBulk(iTack[j]) == iDestStart)//找到一张牌
                    {
                        iResultCard[iResultCount++] = iTack[j];
                        iDestStart++;
                        iDestEnd--;
                        //break;
                    }
                    //已经找全
                    if (iDestEnd == 0) {
                        return [true, iResultCount];
                    }
                }
                break;
            case 2:
                iSequenceLen = iBaseCount / 2;
                if (!bNoComp)
                    iBaseStart = this.GetSequenceStartPostion(iBaseCard, iBaseCount, 2);
                else
                    iBaseStart = 2;
                for (var i = iBaseStart + 1; i < 15; i++) {
                    if (temp[i] >= 2) {
                        if (iDestStart == 0)
                            iDestStart = i;
                        iDestEnd++;
                        if (iDestEnd == iSequenceLen)
                            break;
                    } else {
                        iDestStart = 0;
                        iDestEnd = 0;
                    }
                }
                if (iDestEnd != iSequenceLen)
                    return [false, iResultCount];
                num = 0;
                //提取队列
                for (var j = 0; j < iTackCount; j++) {
                    if (this.GetCardBulk(iTack[j]) == iDestStart) {
                        iResultCard[iResultCount++] = iTack[j];
                        num++;
                    }

                    if (num == 2)//一对已经找到
                    {
                        num = 0;
                        iDestStart++;
                        iDestEnd--;
                        //已经找全
                        if (iDestEnd == 0)
                            return [true, iResultCount];
                        //break;
                        //i = 0;
                        //continue;
                    }
                }
                break;
            case 3:
                iSequenceLen = iBaseCount / 3;
                if (!bNoComp)
                    iBaseStart = this.GetSequenceStartPostion(iBaseCard, iBaseCount, 3);
                else
                    iBaseStart = 2;
                for (var i = iBaseStart + 1; i < 15; i++) {
                    if (temp[i] >= 3) {
                        if (iDestStart == 0)
                            iDestStart = i;
                        iDestEnd++;
                        if (iDestEnd == iSequenceLen)
                            break;
                    } else {
                        iDestStart = 0;
                        iDestEnd = 0;
                    }
                }
                if (iDestEnd != iSequenceLen)
                    return [false, iResultCount];
                num = 0;
                //提取队列
                for (var j = 0; j < iTackCount; j++) {
                    if (this.GetCardBulk(iTack[j]) == iDestStart) {
                        iResultCard[iResultCount++] = iTack[j];
                        num++;

                        if (num == 3)//找到三张
                        {
                            num = 0;
                            iDestStart++;
                            iDestEnd--;
                            //已经找全
                            if (iDestEnd == 0)
                                return [true, iResultCount];
                        }
                    }
                }

                break;
        }
        return [false, iResultCount];
    }
    //提取同花顺
    TackOutStraightFlush(iCardList, iCardCount, iBaseCard, iBaseCount, iResultCard, iResultCardCount) {
        iResultCardCount = 0;
        if (iCardCount < iBaseCount)
            return false;
        var iBaseMinCard = this.GetBulkBySepcifyMinOrMax(iBaseCard, iBaseCount, 1);//桌面的顺子中最小的牌
        var iTack = [];
        var iTackCount = iCardCount;
        //复制一份
        iTack = [].concat(iCardList.slice(0, iCardCount));
        //::CopyMemory(iTack,iCardList,sizeof()*iCardCount);
        var iBuffer = [];
        var iBufferCount = 0;
        var iDestStart = 0, iDestEnd = 0;
        var iSequenceLen = iBaseCount;
        var temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var num = 0;
        //提取所有炸弹(从手中删除所有炸弹)
        iBufferCount = this.TackOutAllBomb(iTack, iTackCount, iBuffer, iBufferCount);
        this.RemoveCard(iBuffer, iBufferCount, iTack, iTackCount);
        iTackCount -= iBufferCount;

        this.SortCard(iTack, null, iTackCount, true);

        var iTempKind = [];
        var iTempKindCount = 0;
        //用缓冲队例保存
        for (var kind = 0; kind <= 48; kind += 16) {	//提取方块
            iResultCardCount = 0;
            iTempKindCount = this.TackOutByCardKind(iTack, iTackCount, iTempKind, kind);
            if (iTempKindCount >= iBaseCount)					//大于桌面
            {
                for (var i = 0; i < iTempKindCount; i++) {
                    temp[this.GetCardBulk(iTempKind[i])]++;
                }

                for (var i = iBaseMinCard + 1; i < 15; i++)//对队例进行遍历
                {
                    if (temp[i] >= 1)		//某花色有牌
                    {
                        if (iDestStart == 0)
                            iDestStart = i;
                        iDestEnd++;
                        if (iDestEnd == iSequenceLen)
                            break;
                    } else {
                        iDestStart = 0;
                        iDestEnd = 0;
                    }
                }

                if (iDestEnd != iBaseCount)	//某种花色不符合,换另外一种花色
                    continue;
                //提取队列
                for (var j = 0; j < iTempKindCount; j++) {
                    if (this.GetCardBulk(iTempKind[j]) == iDestStart) {
                        iResultCard[iResultCardCount++] = iTempKind[j];
                        iDestStart++;
                        iDestEnd--;
                    }
                    //已经找全
                    if (iDestEnd == 0)
                        return true;
                }
            }

        }

        return false;
    }
    // TackOutStraightFlush( iCardList,  iCardCount,  iBaseCard,  iBaseCount,  iResultCard,  &iResultCardCount,  bExtVal=false);
    //提取所的炸弹
    TackOutAllBomb(iCardList, iCardCount, iResultCard, iResultCardCount, iNumCount = 4) {
        iResultCardCount = 0;
        var bCardBuffer = [];
        var bombcount = this.GetBombCount(iCardList, iCardCount, iNumCount);
        if (bombcount < 0)
            return false;
        for (var i = iNumCount; i < 9; i++) {
            var count = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, bCardBuffer, i);
            if (count > 0) {
                for (var j = 0; j < count; j++) {
                    iResultCard[iResultCardCount + j] = bCardBuffer[j];
                }
                //	::CopyMemory(&iResultCard[iResultCardCount],bCardBuffer,sizeof()*count);
                iResultCardCount += count;
                break;
            }
        }
        return iResultCardCount;
    }
    //提取炸弹(张数默认为4)
    TackOutBomb(iCardList, iCardCount, iResultCard, iResultCardCount, iNumCount = 4) {
        iResultCardCount = 0;
        var bCardBuffer = [];
        var bombcount = this.GetBombCount(iCardList, iCardCount, iNumCount);
        if (bombcount < 0)
            return [false,iResultCardCount];
        for (var i = iNumCount; i < 9; i++) {
            var count = this.TackOutBySepcifyCardNumCount(iCardList, iCardCount, bCardBuffer, i);
            if (count > 0) {
                for (var j = 0; j < i; j++) {
                    iResultCard[j] = bCardBuffer[j];
                }
                //::CopyMemory(iResultCard,bCardBuffer,sizeof()*i);
                iResultCardCount = i;
                break;
            }
        }
        if (iResultCardCount == 0)
            iResultCardCount = this.TackOutKingBomb(iCardList, iCardCount, iResultCard, iResultCardCount);
        return [true,iResultCardCount];
    }
    //提取王炸
    TackOutKingBomb(iCardList, iCardCount, iResultCard, iResultCardCount) {
        iResultCardCount = 0;

        var bCardBuf = [];
        var kingcount = 0;
        var SingKing = KING_COUNT / 2;
        var count = this.TackOutBySpecifyCard(iCardList, iCardCount, bCardBuf, kingcount, 0x4e);
        if (count != SingKing)
            return false;

        iResultCard = [].concat(bCardBuf.slice(0, count));
        //::CopyMemory(iResultCard,bCardBuf,sizeof()*count);

        count = this.TackOutBySpecifyCard(iCardList, iCardCount, bCardBuf, kingcount, 0x4f);
        if (count != SingKing) {
            return false;
        }
        for (var i = 0; i < count; i++) {
            iResultCard[SingKing + i] = bCardBuf[i];
        }
        //::CopyMemory(&(iResultCard[SingKing]),bCardBuf,sizeof()*count);
        return iResultCardCount;
    }
    //提取510K
    TrackOut510K(iCardList, iCardCount, iResultCard, iResultCardCount, bExtVal = false) {
        iResultCardCount = 0;
        var temp = [];
        for (var i = 0; i < 48; i++) {
            temp.push(0);
        }
        var huasei = [];
        for (var i = 0; i < 4; i++) {
            huasei[i] = [];
            for (var j = 0; j < 16; j++) {
                huasei[i].push(0);
            }
        }
        var k = 0, num = [0, 0, 0, 0];
        //得到510K数据
        for (var i = 0; i < iCardCount; i++) {
            var n = this.GetCardNum(iCardList[i]);
            if (n == 5 || n == 10 || n == 13) {
                temp[k++] = iCardList[i];
                var kind = this.GetCardHuaKind(iCardList[i], true) >> 4;

                huasei[kind][num[kind]++] = iCardList[i];
            }
        }
        //5,10,k数目少于3个
        if (num[0] + num[1] + num[2] + num[3] < 3)
            return false;
        //要求主510K数量少于3个
        if (bExtVal && num[0] < 3 && num[1] < 3 && num[2] < 3 && num[3] < 3)
            return false;
        for (var i = 0; i < 4; i++) {
            if (this.Test510K(huasei[i], num[i]))//某一花色是否为主510K
            {
                this.Copy510K(huasei[i], num[i], iResultCard, iResultCardCount);

                if (bExtVal) //是否需要提取主510K
                    return true;
                else {
                    this.RemoveCard(iResultCard, iResultCardCount, huasei[i], num[i]);//将主510K移出选定花色队伍
                    this.RemoveCard(iResultCard, iResultCardCount, temp, k);	//将主510K移出510K队伍
                    num[i] -= iResultCardCount;
                    k -= iResultCardCount;
                }
                //			return true;
            }
        }

        if (bExtVal) return false; //需要同花510K

        if (this.Test510K(temp, k)) {
            this.Copy510K(temp, k, iResultCard, iResultCardCount);
            return true;
        }
        return false;
    }
    //测试510K
    Test510K(iCardList, iCardCount, bExtVal = false) {
        var five = false, ten = false, k = false;
        for (var i = 0; i < iCardCount; i++) {
            if (this.GetCardNum(iCardList[i]) == 5)
                five = true;
            else if (this.GetCardNum(iCardList[i]) == 10)
                ten = true;
            else
                k = true;
        }
        //有5,10,k
        if (five && ten && k)
            return true;
        return false;
    }
    //拷背
    Copy510K(iCardList, iCardCount, iResultCard, iResultCardCount) {
        iResultCardCount = 0;
        var five, ten, k;
        for (var i = 0; i < iCardCount; i++) {
            if (this.GetCardNum(iCardList[i]) == 5)
                five = iCardList[i];
            else if (this.GetCardNum(iCardList[i]) == 10)
                ten = iCardList[i];
            else k = iCardList[i];
        }
        iResultCard[0] = five;
        iResultCard[1] = ten;
        iResultCard[2] = k;
        iResultCardCount = 3;
        return true;
    }
    //拆大桌面牌
    TackOutCardByNoSameShape(iCardList, iCardCount, iResultCard, iResultCardCount, iBaseCard, iBaseCardCount) {
        if (iCardCount < 1) {
            return [false,iResultCardCount];
        }
        iResultCardCount = 0;
        var temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var t = this.GetCardBulk(iBaseCard[0], false); //得到桌面上那个牌的值
        for (var i = 0; i < iCardCount; i++) {
            temp[this.GetCardBulk(iCardList[i], false)]++;
        }
        //拆(炸牌不拆)
        for (var i = 0; i < 18; i++) {
            if (temp[i] < 4 &&               //非炸弹牌
                temp[i] > iBaseCardCount &&  //张数比桌面牌多
                i > t)                      //且数字大
            {
                for (var j = 0; j < iCardCount; j++)  ///从小到达拷贝(考虑到牌的提取)
                {
                    if (this.GetCardBulk(iCardList[j], false) == i) {
                        iResultCard[iResultCardCount++] = iCardList[j];

                        if (iResultCardCount == iBaseCardCount) {
                            return [true,iResultCardCount];
                        }
                    }
                }
            }
        }
        return [false,iResultCardCount];
    }
    ///提取指定的牌
    TackOutCardBySpecifyCard(iCardList, iCardCount, iResultCard, iResultCardCount, iBaseCard, iBaseCardCount, iSepcifyCard) {
        if (iCardCount < 1) {
            return false;
        }

        if (iBaseCardCount > 0 && (this.GetCardBulk(iBaseCard[0], false) >= this.GetCardBulk(iSepcifyCard, false))) {
            return false;
        }

        iResultCardCount = 0;

        var temp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        var t = this.GetCardBulk(iBaseCard[0], false); //得到桌面上那个牌的值

        for (var i = 0; i < iCardCount; i++) {
            temp[this.GetCardBulk(iCardList[i], false)]++;
        }

        iResultCard[iResultCardCount++] = iSepcifyCard;

        for (var j = iCardCount - 1; j >= 0; j--)  ///从小到达拷贝(考虑到牌的提取)
        {
            if (this.GetCardBulk(iCardList[j], false) == this.GetCardBulk(iSepcifyCard, false)
                && iCardList[j] != iSepcifyCard) {
                if (temp[this.GetCardBulk(iSepcifyCard, false)] >= 4 && iBaseCardCount != 0) {
                    return false;
                }

                iResultCard[iResultCardCount++] = iCardList[j];

                if (iResultCardCount == iBaseCardCount) {
                    return true;
                }
            }
        }

        if (iBaseCardCount == 0 && iResultCardCount > 0) {
            return true;
        }

        return false;
    }
    //用大的牌牌大桌面上的牌
    TackOutMoreThanLastShape(iCardList, iCardCount, iResultCard, iResultCardCount, iBaseCard, iBaseCardCount) {
        iResultCardCount = 0;
        var ishape = this.GetCardShape(iBaseCard, iBaseCardCount);
        switch (ishape) {
            case UG_SLAVE_510K: //一般510K
                {
                    if (this.TrackOut510K(iCardList, iCardCount, iResultCard, iResultCardCount, true))
                        break;
                    else
                        iResultCardCount = this.TackOutBomb(iCardList, iCardCount, iResultCard, iResultCardCount)[1];
                    break;
                }
            case UG_MASTER_510K: //510K 同花
                {
                    iResultCardCount = this.TackOutBomb(iCardList, iCardCount, iResultCard, iResultCardCount)[1];
                    break;
                }
            default:
                iResultCardCount = this.TackOutBomb(iCardList, iCardCount, iResultCard, iResultCardCount)[1]; //找炸弹
                break;
        }
        return iResultCardCount;
    }

    ///设置游戏牌型
    SetCardShape(iCardShape) { this.m_iCardShape = iCardShape; }
    ///查找最小 (1) or 最大 (255) 牌值
    ///
    /// [@param in bExtVal] 真，不考虑2、王
    GetCardMinOrMax(iCardList, iCardCount, MinOrMax, bExtVal = false) {
        var nIndex = 0;
        var CardNum;

        if (MinOrMax == 1) //找最小的
        {
            CardNum = 65536;
            for (var i = 0; i < iCardCount; i++) {
                // 不考虑 2 、王
                if (bExtVal && (2 == this.GetCardNum(iCardList[i]) || 0x4E == iCardList[i] || 0x4F == iCardList[i]))
                    continue;

                if (this.GetCardBulk(iCardList[i], false) < CardNum) {
                    CardNum = this.GetCardBulk(iCardList[i], false);
                    nIndex = i;
                }
            }
        }
        else if (MinOrMax == 255) {
            CardNum = -1;
            for (var i = 0; i < iCardCount; i++) {
                if (bExtVal && (2 == this.GetCardNum(iCardList[i]) || 0x4E == iCardList[i] || 0x4F == iCardList[i]))
                    continue;

                if (this.GetCardBulk(iCardList[i], false) > CardNum) {
                    CardNum = this.GetCardBulk(iCardList[i], false);
                    nIndex = i;
                }
            }
        }

        if (bExtVal && (65536 == CardNum || -1 == CardNum))
            return 255;

        return iCardList[nIndex];
    }

}