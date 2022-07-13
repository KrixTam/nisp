const moment = require('moment');

module.exports = Object.freeze({
    COMMAND_ID_BITS: 12,
    COMMAND_STATE_BITS: 2,
    POSITION_CODE_BITS: 4,
    TIMESTAMP_SHADOW_BITS: 48,
    RANDOM_CODE_BITS: 6,
    TS_PACKAGE_LEN: 8,
    EVENT_ID_LEN: 18,
    EPOCH_MOMENT: moment('2020-12-21'),
    EPOCH_DEFAULT: 1608480000,
    ERROR_DEF: {
		'1000': '[{0}] 连接建立。',
	    '1001': '[{0}] unpack_event_id方法遇到非法id<{1}>，时间逆流，unpack失败。',
	    '1002': '[{0}] unpack_event_id方法random_code校验失败({1} ≠ {2})。',
	    '1100': '[{0}] separate_bits方法中的参数值异常。',
	}
});