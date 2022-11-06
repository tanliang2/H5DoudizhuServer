'use strict'//
/**
 * config
 */
export default {
    //游戏基础配置
    game: {
        //游戏顺序（1：逆时针 0：顺时针）
        TurnRule: 1,
        //是否抢地主（1：游戏必须抢地主 0：由游戏决定地主）
        robnt: 1,
        //是否可以加倍
        adddouble: 1,
        //是否有明牌环节
        showcard: 1,
        //游戏基础倍数（基础倍数必须>:1）
        BaseMutiple: 1,
        //加倍限制（配置0为不限制）
        AddDoubleLimit: 0,
        //房间最大输赢（配置0为不限制）
        GameMaxLimit: 0,
        //游戏最大倍数（配置0为不限制）
        LimitPoint: 0
    },
    //游戏时间配置
    other: {
        //开始等待时间
        begintime: 15,
        //思考时间
        thinktime: 20,
        //抢地主时间
        RobNTTime: 10,
        //叫分时间
        CallScoretime: 15,
        //加棒时间
        adddoubletime: 5
    },
    //根据房间读取配置
    room: {
        //游戏顺序（1：逆时针 0：顺时针）
        TurnRule: 1,
        //是否抢地主（1：游戏必须抢地主 0：由游戏决定地主）
        robnt: 1,
        //是否可以加倍
        adddouble: 1,
        //是否有明牌环节
        showcard: 1,
        //游戏基础倍数（基础倍数必须>:1）
        BaseMutiple: 1,
        //加倍限制（配置0为不限制）
        AddDoubleLimit: 0,
        //房间最大输赢（配置0为不限制）
        GameMaxLimit: 0,
        //游戏最大倍数（配置0为不限制）
        LimitPoint: 0,
    }

};