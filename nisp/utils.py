from ni.config.tools import Logger
from nisp.const import BIN_REG


def insert_bit(num: int, bit_position: int, bit: bool = False):
    if (num > 0) and (bit_position >= 0):
        right = num & ((1 << bit_position) - 1)
        if bit:
            return ((num - right) << 1) + right + (1 << bit_position)
        else:
            return ((num - right) << 1) + right
    else:
        raise ValueError(logger.info([1100]))


def remove_bit(num: int, bit_position: int):
    length = num.bit_length()
    if (num > 0) and (bit_position >= 0) and (length > bit_position):
        bin_value = bin(num)[2:]
        if bit_position == 0:
            result = int(bin_value[:-1], 2)
            bit_remove = bin_value[-1]
        else:
            index = length - bit_position - 1
            result = int(bin_value[:index] + bin_value[index + 1:], 2)
            bit_remove = bin_value[index:index + 1]
        return result, bit_remove
    else:
        raise ValueError(logger.info([1102]))


def separate_bits(num: int, bits_length: int):
    if (num >= 0) and (bits_length > 0):
        right = num & ((1 << bits_length) - 1)
        left = num >> bits_length
        return left, right
    else:
        raise ValueError(logger.info([1101]))

# 1000 - 1099 server
# 1100 - 1199 utils
# 1200 - 1299 datamodel


ERROR_DEF = {
    '1000': '[{0}] 新连接建立。',
    '1001': '[{0}] 非法id；时间逆流。',
    '1100': '[{0}] insert_bit方法中的参数值异常。',
    '1101': '[{0}] separate_bits方法中的参数值异常。',
    '1102': '[{0}] remove_bit方法中的参数值异常。',
    '1200': '[{0}] {1}值({2})异常，合理范围应为[{3}, {4}]。',
    '1201': '[{0}] "{1}"类型为{2}，{3}比较方法只接受{3}或者<class \'int\'>。',
    '1202': '[{0}] "{1}"类型为{2}，<class \'nisp.datamodel.Command\'>比较方法只接受<class \'nisp.datamodel.Command\'>。',
    '1203': '[{0}] "{1}"类型为{2}，<class \'nisp.datamodel.EventId\'>比较方法只接受<class \'nisp.datamodel.EventId\'>、<class \'int\'>或者<class \'str\'>。',
    '1204': '[{0}] EventId.unpack方法参数类型只接受<class \'nisp.datamodel.EventId\'>、<class \'int\'>或者<class \'str\'>，当前参数"{1}"类型为{2}。',
    '1205': '[{0}] EventId.unpack方法时间逆流。',
    '1206': '[{0}] EventId.unpack方法random_code校验失败({1} ≠ {2})。',
    '1207': '[{0}] EventId.unpack方法nic校验失败({1} ≠ {2})。',
    '1208': '[{0}] EventId.timestamp_shadow方法时间逆流。',
}

logger = Logger(ERROR_DEF, 'nisp')