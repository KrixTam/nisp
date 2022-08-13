'use strict';

const moment = require('moment');

const epoch_moment = new moment('2020-12-21');

var data = {
    COMMAND_ID_BITS: 12,
    COMMAND_STATE_BITS: 2,
    POSITION_CODE_BITS: 4,
    TIMESTAMP_BITS: 42,
    TIMESTAMP_SHADOW_BITS: 48,
    RANDOM_CODE_BITS: 6,
    TS_PACKAGE_LEN: 8,
    EVENT_ID_LEN: 18,
    EPOCH_MOMENT: '2020-12-21',
    EPOCH_DEFAULT: 1608480000,
    POSITION_CODE_MIN: 0,
	POSITION_CODE_MAX: 7,
	RANDOM_CODE_MIN: 0,
	COMMAND_ID_MIN: 0,
	STATE_MIN: -1,
	STATE_MAX: 3,
	STATE_INIT_PRE: -1,
	STATE_INIT: 0,
	STATE_INIT_END: 1,
	STATE_PROCESS_APPLY: 2,
	STATE_PROCESS_END: 3,
	HEARTBEAT_ID: '000000000000',
    KEY_EVENT_ID: 'eid',
	KEY_DATA: 'data',
	KEY_ERROR_CODE: 'ec',
	KEY_NAME: 'name',
    ERROR_DEF: {
    	'999': '[{0}] 临时打印信息：{1}\n',
		'1000': '[{0}] NISP连接建立。',
	    '1001': '[{0}] unpack_event_id方法遇到非法id<{1}>，时间逆流，unpack失败。',
	    '1002': '[{0}] unpack_event_id方法random_code校验失败({1} ≠ {2})。',
	    '1003': '[{0}] Command创建失败，初始化数值<{1}, {2}>异常，超过系统设定的范围。',
	    '1004': '[{0}] Event创建时遇到非法时间<{1}>，导致时间逆流现象，获取id失败。',
	    '1005': '[{0}] Command<{1}>未注册，处理回调方法不能为null，注册并创建Command失败。',
	    '1006': '[{0}] Command<{1}>已注册，不能重复注册。',
	    '1007': '[{0}] register_command的参数init_callback和process_callback类型必须为<function>。',
	    '1100': '[{0}] separate_bits方法中的参数值异常。',
	    '1200': '[{0}] NISPClient获得异常反馈数据<{1}>。',
	    '1201': '[{0}] NISPClient服务异常，错误信息：{1}',
	    '1202': '[{0}] init_commands失败，参数commands值不符合要求<{1}>。',
	    '1203': '[{0}] NISP连接被服务端断开。',
	    '1204': '[{0}] generate_event_index调用参数不符合要求。',
	    '1205': '[{0}] NISP服务端心跳异常，主动断开连接。',
	    '1206': '[{0}] NISP服务已断开，请重新连接后再执行apply_command<{1}>。',
	    '1207': '[{0}] NISP服务已断开，请重新连接后再执行send_command<{1}>。',
	    '1208': '[{0}] NISP服务端消息异常，主动断开连接。',
	}
};

// 错误码分类：
// 1001-1099 datamodel
// 1100-1199 utils
// 1000, 1200-1299 client

data.RANDOM_CODE_MAX = (1 << data.RANDOM_CODE_BITS) - 1;
data.COMMAND_ID_MAX = (1 << data.COMMAND_ID_BITS) - 1;
data.REQUEST = '{ "' + data.KEY_EVENT_ID + '": "{eid}", "' + data.KEY_ERROR_CODE + '": {ec}, "' + data.KEY_DATA + '": {data} }';
// data.KEY_DATA = 'data';

module.exports = Object.freeze(data);
