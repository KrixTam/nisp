import unittest
from nisp.datamodel import EventId, Command
from moment import moment
from nisp.const import HEX_REG, EVENT_ID_LEN


class TestEventId(unittest.TestCase):
    def test_timestamp_shadow_01(self):
        ts = moment('2021-01-02 12:23:22')
        ts_shadow, timestamp_bin = EventId.timestamp_shadow('101100', 0, ts)
        self.assertEqual('000000010000100000000111101001111000101000100000', ts_shadow)

    def test_timestamp_shadow_02(self):
        ts = moment('2011-01-02 12:23:22')
        with self.assertRaises(ValueError):
            EventId.timestamp_shadow('101100', 0, ts)

    def test_unpack(self):
        ts = moment('2021-01-02 12:23:22')
        ts_shadow = '000000010000100000000111101001111000101000100000'
        random_code = '101100'
        position_code = '0000'
        command_01 = Command(4)
        event_id = int(random_code + ts_shadow + position_code + str(command_01), 2)
        client_id = 'abcd'
        event_id_str = HEX_REG.format(event_id, EVENT_ID_LEN)
        cid_02, state_02, timestamp, client_id_unpack = EventId.unpack(event_id_str + client_id)
        command_02 = Command(cid_02.value, state_02.value)
        self.assertEqual(command_01, command_02)
        self.assertEqual(ts, timestamp)
        self.assertEqual(client_id, client_id_unpack)

    def test_basic_01(self):
        ts = moment('2021-01-02 12:23:22')
        eid = EventId('abcd', 0, 0, ts)
        cid_01, state_01, timestamp_01, client_id_01 = EventId.unpack(str(eid))
        eid_01 = EventId(client_id_01, cid_01.value, state_01.value, timestamp_01)
        self.assertEqual(eid_01.core, eid.core)

    def test_basic_02(self):
        ts = moment('2021-01-02 12:23:22')
        eid = EventId('abcd', 0, 0, ts)
        cid_01, state_01, timestamp_01, client_id_01 = EventId.unpack(eid)
        eid_01 = EventId(client_id_01, cid_01.value, state_01.value, timestamp_01)
        self.assertTrue(eid_01.equal(eid))

    def test_basic_03(self):
        ts = moment('2021-01-02 12:23:22')
        eid = EventId('abcd', 0, 0, ts)
        cid_01, state_01, timestamp_01, client_id_01 = EventId.unpack(eid)
        eid_01 = EventId(client_id_01, cid_01.value, state_01.value, timestamp_01)
        self.assertTrue(eid_01.equal(eid))

    def test_basic_04(self):
        ts = moment('2021-01-02 12:23:22')
        eid = EventId('abcd', 0, 0, ts)
        cid_01, state_01, timestamp_01, client_id_01 = EventId.unpack(eid)
        eid_01 = EventId(client_id_01, cid_01.value, state_01.value, timestamp_01)
        self.assertTrue(eid_01.equal(eid))

    def test_basic_05(self):
        eid_str = '3400201e9e288403e7abcd'
        eid = 62864735122016490714803149
        cid_01, state_01, timestamp_01, client_id_01 = EventId.unpack(eid)
        eid_01 = EventId(client_id_01, cid_01.value, state_01.value, timestamp_01)
        self.assertTrue(eid_01 == eid_str)

    def test_error_01(self):
        with self.assertRaises(TypeError):
            EventId.unpack(['1231'])

    def test_error_02(self):
        eid = EventId('abcd', cid=1)
        with self.assertRaises(TypeError):
            eid.__ne__([123])

    def test_error_03(self):
        eid = EventId('abcd', cid=1)
        with self.assertRaises(TypeError):
            eid.equal([123])

    def test_error_04(self):
        with self.assertRaises(ValueError):
            EventId.unpack('8080100e4e14c14000abcd')

    def test_error_05(self):
        # from moment import moment
        # EventId._epoch = moment('1990-12-11').unix()
        # print(EventId(timestamp=moment('2018-10-28')))
        with self.assertRaises(ValueError):
            EventId.unpack('58ca6e32b444000000abcd')
    
    def test_error_06(self):
        with self.assertRaises(ValueError):
            EventId(None)

    def test_error_07(self):
        with self.assertRaises(ValueError):
            EventId.unpack('58ca6e32b444000000')

    def test_next(self):
        eid = EventId('abcd', cid=12)
        a = eid.core
        a_37 = a[-13]
        eid.next()
        b = eid.core
        b_37 = b[-13]
        self.assertEqual(a[:-13], b[:-13])
        self.assertEqual(a[-12:], b[-12:])
        self.assertEqual(a_37, '0')
        self.assertEqual(b_37, '1')


if __name__ == '__main__':
    unittest.main()  # pragma: no cover
