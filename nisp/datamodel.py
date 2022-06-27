from nisp.utils import logger, insert_bit, separate_bits, remove_bit
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


class ActionId(Id):

    def __init__(self, aid: int):
        Id.register('ActionId', ACTION_ID_MIN, ACTION_ID_MAX, ACTION_ID_BITS)
        super().__init__(aid)


class ActionState(Id):

    def __init__(self, state: int = STATE_INIT):
        Id.register('ActionState', STATE_MIN, STATE_MAX, ACTION_STATE_BITS)
        super().__init__(state)

    def next(self):
        if self.value == STATE_MAX:
            pass
        else:
            self.value = self.value + 1


class Action(object):

    def __init__(self, aid: int, state: int = STATE_INIT):
        self.id = ActionId(aid)
        self.state = ActionState(state)

    def next(self):
        self.state.next()

    def __str__(self):
        return self.state.__str__() + self.id.__str__()

    def __repr__(self):
        return self.id.__repr__() + '\n' + self.state.__repr__()

    def __eq__(self, other):
        if isinstance(other, Action):
            return (self.id == other.id) and (self.state == other.state)
        else:
            raise TypeError(logger.error([1202, other, type(other)]))

    def __ne__(self, other):
        return not self.__eq__(other)


class EventId(object):
    _epoch = EPOCH_DEFAULT

    def __init__(self, aid: int = 0, state: int = STATE_INIT, network_interface_controller: str = None, timestamp: moment = None):
        random_code = BIN_REG.format(random.randint(RANDOM_CODE_MIN, RANDOM_CODE_MAX), RANDOM_CODE_BITS)
        position_code_value = random.randint(POSITION_CODE_MIN, POSITION_CODE_MAX)
        position_code = BIN_REG.format(position_code_value, POSITION_CODE_BITS)
        if network_interface_controller is None:
            nic = EventId.network_interface_controller()
        else:
            nic = network_interface_controller
        self._action = Action(aid, state)
        timestamp_shadow, self._ts = EventId.timestamp_shadow(random_code, position_code_value, timestamp)
        encode = random_code + timestamp_shadow + position_code + str(self._action) + nic
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
        return self._ts + self._action.__str__() + self._nic

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
            raise ValueError(logger.error([1001]))
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
    def timestamp(ts: int):
        return EPOCH_MOMENT.add(ts + EventId._epoch - EPOCH_DEFAULT, 'ms')

    @staticmethod
    def network_interface_controller():
        return BIN_REG.format(int(hex(uuid.getnode())[-6:], 16), NIC_BITS)

    @staticmethod
    def unpack(event_id):
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
        left, aid = separate_bits(left, ACTION_ID_BITS)
        left, state = separate_bits(left, ACTION_STATE_BITS)
        action = Action(aid, state)
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
                raise ValueError
            else:
                nic = BIN_REG.format(nic_value, NIC_BITS)
                nic_check = EventId.network_interface_controller()
                if nic != nic_check:
                    logger.warning()
                return action, timestamp, nic
        else:
            raise ValueError
