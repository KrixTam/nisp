from nisp.utils import logger, separate_bits
from nisp.const import *
import random
from abc import abstractmethod
from string import Template


class Id(object):
    _subclasses = {}

    def __init__(self, value: int):
        name = type(self).__name__
        if Id.valid(name, value):
            self.value = value
        else:
            raise ValueError(logger.error([1200, name, value, Id._subclasses[name][KEY_MIN], Id._subclasses[name][KEY_MAX]]))

    @classmethod
    def register(cls, name: str, min_value: int, max_value: int, length: int):
        if name in cls._subclasses:
            pass
        else:
            cls._subclasses[name] = {
                KEY_MAX: max_value,
                KEY_MIN: min_value,
                KEY_LEN: length
            }

    @staticmethod
    def valid(name: str, value: int):
        if (value < Id._subclasses[name][KEY_MIN]) or (value > Id._subclasses[name][KEY_MAX]):
            return False
        else:
            return True

    def __str__(self):
        return BIN_REG.format(self.value, Id._subclasses[type(self).__name__][KEY_LEN])

    def __repr__(self):
        return type(self).__name__ + '(' + str(self) + ')'

    def __eq__(self, other):
        if isinstance(other, type(self)):
            return self.value.__eq__(other.value)
        if isinstance(other, int):
            return self.value.__eq__(other)
        raise TypeError(logger.error([1201, other, type(other), type(self)]))

    def __ne__(self, other):
        return not self.__eq__(other)


class CommandId(Id):

    def __init__(self, cid: int):
        Id.register('CommandId', COMMAND_ID_MIN, COMMAND_ID_MAX, COMMAND_ID_BITS)
        super().__init__(cid)


class CommandState(Id):

    def __init__(self, state: int = STATE_INIT):
        Id.register('CommandState', STATE_MIN, STATE_MAX, COMMAND_STATE_BITS)
        super().__init__(state)

    def next(self):
        if self.value == STATE_MAX:
            pass
        else:
            self.value = self.value + 1


class Command(object):
    _registration = {}

    def __init__(self, cid: int, state: int = STATE_INIT):
        self.id = CommandId(cid)
        self.state = CommandState(state)

    def next(self, **kwargs):
        if self.state == STATE_INIT:
            return self.init(**kwargs)
        if self.state == STATE_PROCESS_APPLY:
            return self.process(**kwargs)
        return None, 0

    def __str__(self):
        return self.state.__str__() + self.id.__str__()

    def __repr__(self):
        return self.id.__repr__() + '\n' + self.state.__repr__()

    def __eq__(self, other):
        if isinstance(other, Command):
            return (self.id == other.id) and (self.state == other.state)
        else:
            raise TypeError(logger.error([1202, other, type(other)]))

    def __ne__(self, other):
        return not self.__eq__(other)

    @staticmethod
    def get_command(cid: int, state: int = STATE_INIT):
        command_id = str(CommandId(cid))
        if command_id in Command._registration:
            return Command._registration[command_id](state)
        else:
            return Command(cid, state)

    @staticmethod
    def register(cid: int, command_class):
        command_id = str(CommandId(cid))
        if command_id in Command._registration:
            return False
        else:
            Command._registration[command_id] = command_class
            return True

    @abstractmethod
    def init(self, **kwargs):
        self.state.next()
        return None, 0

    @abstractmethod
    def process(self, **kwargs):
        self.state.next()
        return None, 0


class EventId(object):
    _epoch = EPOCH_DEFAULT

    def __init__(self, client_id: str, cid: int = 0, state: int = STATE_INIT, timestamp: moment = None):
        random_code = BIN_REG.format(random.randint(RANDOM_CODE_MIN, RANDOM_CODE_MAX), RANDOM_CODE_BITS)
        position_code_value = random.randint(POSITION_CODE_MIN, POSITION_CODE_MAX)
        position_code = BIN_REG.format(position_code_value, POSITION_CODE_BITS)
        self._command = Command.get_command(cid, state)
        timestamp_shadow, self._ts = EventId.timestamp_shadow(random_code, position_code_value, timestamp)
        self._random_code = random_code
        self._timestamp_shadow = timestamp_shadow
        self._position_code = position_code
        # 必选：client_id（hex4）
        if (client_id is None) or (not isinstance(client_id, str)) or (len(client_id) != CLIENT_ID_LEN) or (not all(c in '0123456789abcdef' for c in client_id)):
            raise ValueError(logger.error([1200, 'client_id', client_id, 0, 'ffff']))
        self._client_id = client_id

    @property
    def value(self):
        encode = self._random_code + self._timestamp_shadow + self._position_code + str(self._command)
        return int(encode, 2)

    def __str__(self):
        # 18位事件编码 + 4位client_id
        return HEX_REG.format(self.value, EVENT_ID_LEN) + self._client_id

    def __eq__(self, other):
        if isinstance(other, EventId) or isinstance(other, str):
            cid_other, state_other, timestamp_other, client_id_other = EventId.unpack(other)
            cid, state, timestamp, client_id = EventId.unpack(str(self))
            return (cid == cid_other) and (state == state_other) and (timestamp == timestamp_other) and (client_id == client_id_other)
        else:
            raise TypeError(logger.error([1203, other, type(other)]))

    def __ne__(self, other):
        return not self.__eq__(other)

    @property
    def core(self):
        return self._ts + str(self._command)

    def equal(self, other):
        if isinstance(other, EventId):
            return self.core == other.core
        else:
            raise TypeError

    @staticmethod
    def timestamp_shadow(random_code: str, position_code_value: int, timestamp: moment = None):
        ts = timestamp
        if ts is None:
            ts = moment()
        if ts.unix() < EventId._epoch:
            raise ValueError(logger.error([1208]))
        ts = (ts.unix() - EventId._epoch) * 1000 + ts.milliseconds()
        timestamp_bin = BIN_REG.format(ts, TIMESTAMP_BITS)
        length = TS_PACKAGE_LEN - 1
        timestamp_shadow_list = []
        random_code_list = list(random_code)
        random_code_list.reverse()
        left = ts
        for i in range(RANDOM_CODE_BITS):
            left, right = separate_bits(left, length)
            bits = list(BIN_REG.format(right, length))
            bits.reverse()
            bits.insert(position_code_value, random_code_list[i])
            bits.reverse()
            timestamp_shadow_list.append(''.join(bits))
        timestamp_shadow_list.reverse()
        return ''.join(timestamp_shadow_list), timestamp_bin

    @staticmethod
    def unpack(event_id):
        if isinstance(event_id, str):
            if len(event_id) != EVENT_ID_LEN + CLIENT_ID_LEN:
                raise ValueError(logger.error([1200, 'eid_len', len(event_id), EVENT_ID_LEN + CLIENT_ID_LEN, EVENT_ID_LEN + CLIENT_ID_LEN]))
            event_id_str = event_id
        else:
            if isinstance(event_id, int):
                event_id_str = HEX_REG.format(event_id, EVENT_ID_LEN + CLIENT_ID_LEN)
            else:
                if isinstance(event_id, EventId):
                    event_id_str = str(event_id)
                else:
                    raise TypeError(logger.error([1204, event_id, type(event_id)]))
        base = event_id_str[:EVENT_ID_LEN]
        client_id = event_id_str[EVENT_ID_LEN:EVENT_ID_LEN + CLIENT_ID_LEN]
        value = int(base, 16)
        left, cid_value = separate_bits(value, COMMAND_ID_BITS)
        left, state_value = separate_bits(left, COMMAND_STATE_BITS)
        cid = CommandId(cid_value)
        state = CommandState(state_value)
        left, position_code_value = separate_bits(left, POSITION_CODE_BITS)
        random_code_value, timestamp_shadow_value = separate_bits(left, TIMESTAMP_SHADOW_BITS)
        random_code = BIN_REG.format(random_code_value, RANDOM_CODE_BITS)
        left = timestamp_shadow_value
        random_code_check_list = []
        timestamp_list = []
        for i in range(RANDOM_CODE_BITS):
            left, right = separate_bits(left, TS_PACKAGE_LEN)
            package_bits = list(BIN_REG.format(right, TS_PACKAGE_LEN))
            package_bits.reverse()
            random_code_check_list.append(package_bits[position_code_value])
            del package_bits[position_code_value]
            package_bits.reverse()
            timestamp_list.append(''.join(package_bits))
        timestamp_list.reverse()
        random_code_check_list.reverse()
        random_code_check = ''.join(random_code_check_list)
        ts = ''.join(timestamp_list)
        if random_code == random_code_check:
            timestamp = EPOCH_MOMENT.add(int(ts, 2) + EventId._epoch - EPOCH_DEFAULT, 'ms')
            if timestamp > moment():
                raise ValueError(logger.error([1205]))
            # 返回 client_id
            return cid, state, timestamp, client_id
        else:
            raise ValueError(logger.error([1206, random_code, random_code_check]))

    def next(self, **kwargs):
        return self._command.next(**kwargs)

class Event(object):
    template = Template('{ "' + KEY_EVENT_ID + '": "${eid}", "' + KEY_ERROR_CODE + '": ${ec}, "' + KEY_DATA + '": ${data} }')

    def __init__(self, eid: str):
        cid, state, timestamp, client_id = EventId.unpack(eid)
        self._eid = EventId(client_id, cid.value, state.value, timestamp)

    def process(self, data: dict):
        # 事件超时处理
        try:
            _, _, ts, _ = EventId.unpack(self._eid.__str__())
            now = moment()
            ts_ms = ts.unix() * 1000 + ts.milliseconds()
            now_ms = now.unix() * 1000 + now.milliseconds()
            threshold_s = TIMEOUT_DEFAULT
            if now_ms - ts_ms > threshold_s * 1000:
                print(f'[{str(self._eid)}] 事件超时（>{threshold_s}s），断开连接。')
                return None
        except Exception:  # pragma: no cover
            pass

        response_data, error_code = self._eid.next(**data)
        if response_data is None:
            return None
        else:
            return self.generate_response(response_data, error_code)

    def generate_response(self, data_value: dict, error_code: int = 0):
        data = Event.template.substitute(eid=str(self._eid), ec=error_code, data=data_value).encode('utf-8')
        return data
