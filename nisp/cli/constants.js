const moment = require('moment');

var data = {
    COMMAND_ID_BITS: 12,
    COMMAND_STATE_BITS: 2,
    POSITION_CODE_BITS: 4,
    TIMESTAMP_SHADOW_BITS: 48,
    RANDOM_CODE_BITS: 6,
    TS_PACKAGE_LEN: 8,
    EVENT_ID_LEN: 18,
    EPOCH_MOMENT: moment('2020-12-21'),
    EPOCH_DEFAULT: 1608480000,
    HEARTBEAT_ID: 0,
    POSITION_CODE_MIN: 0,
	POSITION_CODE_MAX: 7,
	RANDOM_CODE_MIN: 0,
	COMMAND_ID_MIN: 0,
	STATE_MIN: 0,
	STATE_MAX: 3,
	STATE_INIT_END: 1,
	STATE_PROCESS_APPLY: 2,
    KEY_EVENT_ID: 'eid',
	KEY_DATA: 'data',
	KEY_ERROR_CODE: 'ec',
	KEY_NAME: 'name',
    ERROR_DEF: {
		'1000': '[{0}] 连接建立。',
	    '1001': '[{0}] unpack_event_id方法遇到非法id<{1}>，时间逆流，unpack失败。',
	    '1002': '[{0}] unpack_event_id方法random_code校验失败({1} ≠ {2})。',
	    '1003': '[{0}] Command创建失败，初始化数值<{1}, {2}>异常，超过系统设定的范围。',
	    '1100': '[{0}] separate_bits方法中的参数值异常。',
	}
};

data.STATE_INIT = data.STATE_MIN;
data.STATE_PROCESS_END = data.STATE_MAX;
data.RANDOM_CODE_MAX = (1 << data.RANDOM_CODE_BITS) - 1;
data.COMMAND_ID_MAX = (1 << data.COMMAND_ID_BITS) - 1;

module.exports = Object.freeze(data);