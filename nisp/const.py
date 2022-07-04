from moment import moment
from ni.config import ParameterValidator


EPOCH_DEFAULT = 1608480000
EPOCH_MOMENT = moment('2020-12-21')

COMMAND_ID_BITS = 12
COMMAND_STATE_BITS = 2
RANDOM_CODE_BITS = 6
NIC_BITS = 24
POSITION_CODE_BITS = 4
TIMESTAMP_BITS = 42
TIMESTAMP_SHADOW_BITS = 48
EVENT_ID_BITS = 96

POSITION_CODE_MIN = 0
POSITION_CODE_MAX = 7

RANDOM_CODE_MIN = 0
RANDOM_CODE_MAX = (1 << RANDOM_CODE_BITS) - 1

COMMAND_ID_MIN = 0
COMMAND_ID_MAX = (1 << COMMAND_ID_BITS) - 1

STATE_MIN = 0
STATE_MAX = 3
STATE_INIT = STATE_MIN
STATE_INIT_END = 1
STATE_PROCESS_APPLY = 2
STATE_PROCESS_END = STATE_MAX

SERVER_INIT = 0
SERVER_RUNNING = 1
SERVER_STOP = 2

HEARTBEAT_ID = 0

TIMEOUT_MIN = 1
TIMEOUT_DEFAULT = 2
TIMEOUT_MAX = 5

KEY_MAX = 'max'
KEY_MIN = 'min'
KEY_LEN = 'len'

BIN_REG = '{0:0{1}b}'
HEX_REG = '{0:0{1}x}'

EVENT_ID_LEN = 24
TS_PACKAGE_LEN = 8

KEY_EVENT_ID = 'eid'
KEY_DATA = 'data'
KEY_ERROR_CODE = 'ec'
KEY_NAME = 'name'

EVENT_ID = {
    'type': 'string',
    'pattern': '^[a-f0-9]{24}'
}

PV_REQUEST = ParameterValidator({
    KEY_EVENT_ID: EVENT_ID,
    KEY_DATA: {'type': 'object'}
})

PV_RESPONSE = ParameterValidator({
    KEY_EVENT_ID: EVENT_ID,
    KEY_DATA: {'type': 'object'},
    KEY_ERROR_CODE: {'type': 'integer'}
})

PV_HEARTBEAT = ParameterValidator({
    KEY_NAME: {
        'type': 'string',
        'pattern': '^[a-f0-9]{4}'
    }
})
