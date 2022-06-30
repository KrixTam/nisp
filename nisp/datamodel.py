from nisp.utils import logger, separate_bits
from nisp.const import *
import uuid
import random
from abc import abstractmethod


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

    def __init__(self, cid: int, state: int = STATE_INIT):
        self.id = CommandId(cid)
        self.state = CommandState(state)

    def next(self):
        if self.state == STATE_INIT:
            self.init()
        if self.state == STATE_PROCESS_APPLY:
            self.process()

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

    @abstractmethod
    def init(self):
        self.state.next()

    @abstractmethod
    def process(self):
        self.state.next()


class EventId(object):
    _epoch = EPOCH_DEFAULT

    def __init__(self, cid: int = 0, state: int = STATE_INIT, network_interface_controller: str = None, timestamp: moment = None):
        random_code = BIN_REG.format(random.randint(RANDOM_CODE_MIN, RANDOM_CODE_MAX), RANDOM_CODE_BITS)
        position_code_value = random.randint(POSITION_CODE_MIN, POSITION_CODE_MAX)
        position_code = BIN_REG.format(position_code_value, POSITION_CODE_BITS)
        if network_interface_controller is None:
            nic = EventId.network_interface_controller()
        else:
            nic = BIN_REG.format(int(network_interface_controller, 2), NIC_BITS)
        self._cid = CommandId(cid)
        self._state = CommandState(state)
        timestamp_shadow, self._ts = EventId.timestamp_shadow(random_code, position_code_value, timestamp)
        encode = random_code + timestamp_shadow + position_code + str(self._cid) + str(self._state) + nic
        self._value = int(encode, 2)
        self._nic = nic

    def __str__(self):
        return HEX_REG.format(self._value, EVENT_ID_LEN)

    def __eq__(self, other):
        if isinstance(other, str):
            return str(self) == other
        if isinstance(other, EventId):
            return str(self) == str(other)
        if isinstance(other, int):
            return self._value == other
        raise TypeError(logger.error([1203, other, type(other)]))

    def __ne__(self, other):
        return not self.__eq__(other)

    @property
    def core(self):
        return self._ts + str(self._cid) + str(self._state) + self._nic

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
    def network_interface_controller():
        return BIN_REG.format(int(hex(uuid.getnode())[-6:], 16), NIC_BITS)

    @staticmethod
    def unpack(event_id, ignore_nic=True):
        if isinstance(event_id, str):
            value = int(event_id, 16)
        else:
            if isinstance(event_id, int):
                value = event_id
            else:
                if isinstance(event_id, EventId):
                    value = int(str(event_id), 16)
                else:
                    raise TypeError(logger.error([1204, event_id, type(event_id)]))
        left, nic_value = separate_bits(value, NIC_BITS)
        left, cid_value = separate_bits(left, COMMAND_ID_BITS)
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
            if timestamp >= moment():
                raise ValueError(logger.error([1205]))
            else:
                nic = BIN_REG.format(nic_value, NIC_BITS)
                nic_check = EventId.network_interface_controller()
                if ignore_nic:
                    pass
                else:
                    if nic != nic_check:
                        raise ValueError(logger.error([1207, nic, nic_check]))
                return cid, state, timestamp, nic
        else:
            raise ValueError(logger.error([1206, random_code, random_code_check]))
