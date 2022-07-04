import unittest
import yaml
from twisted.internet import reactor
from twisted.internet.protocol import Protocol
from twisted.internet.endpoints import UNIXClientEndpoint, connectProtocol
from nisp.server import NISPServer, NISProtocol, HeartBeat
from nisp.datamodel import EventId
from nisp.const import *
import os
from string import Template


config = {'socket': os.path.join(os.getcwd(), 'nisp.socket')}
server = NISPServer(**config)
response_template = Template('{ "' + KEY_EVENT_ID + '": "${eid}", "' + KEY_DATA + '": ${data} }')


class TestClient01(Protocol):  # pragma: no cover

    def __init__(self):
        self.check_result = False

    def dataReceived(self, data):
        received_data = yaml.safe_load(data)
        self.check_result = (len(received_data) == 1) and (NISProtocol.is_existed(received_data[KEY_NAME]))
        self.transport.write(b"{'hello': 123}")

    def connectionLost(self, reason):
        print('disconnect 01')


class TestClient02(Protocol):  # pragma: no cover

    def __init__(self):
        self.check_result = False
        self.name = None
        self.eid = None

    def dataReceived(self, data):
        received_data = yaml.safe_load(data)
        if KEY_NAME in received_data:
            self.name = received_data[KEY_NAME]
            self.eid = EventId()
            response = response_template.substitute(eid=str(self.eid), data='{"name": "' + self.name + '"}').encode('utf-8')
            NISProtocol.register(self.name)
            self.transport.write(response)
        else:
            cid, state, timestamp, nic = EventId.unpack(received_data[KEY_EVENT_ID])
            eid_01 = EventId(cid.value, state.value, nic, timestamp)
            cid, state, timestamp, nic = EventId.unpack(self.eid.value)
            eid_02 = EventId(cid.value, STATE_PROCESS_END, nic, timestamp)
            if received_data[KEY_ERROR_CODE] == 0 and eid_01.core == eid_02.core:
                self.check_result = True
            self.transport.loseConnection()

    def connectionLost(self, reason):
        print('disconnect 02')
        server.stop()


class TestClient03(Protocol):  # pragma: no cover

    def __init__(self):
        self.check_result = False
        self.name = None
        self.eid = None

    def dataReceived(self, data):
        received_data = yaml.safe_load(data)
        if KEY_NAME in received_data:
            self.name = received_data[KEY_NAME]
            self.eid = EventId()
            response = response_template.substitute(eid=str(self.eid), data='{"name": "' + self.name + '1"}').encode('utf-8')
            self.transport.write(response)
        else:
            cid, state, timestamp, nic = EventId.unpack(received_data[KEY_EVENT_ID])
            eid_01 = EventId(cid.value, state.value, nic, timestamp)
            cid, state, timestamp, nic = EventId.unpack(self.eid.value)
            eid_02 = EventId(cid.value, STATE_PROCESS_END, nic, timestamp)
            if received_data[KEY_ERROR_CODE] == 0 and eid_01.core == eid_02.core:
                self.check_result = True
            self.transport.loseConnection()

    def connectionLost(self, reason):
        print('disconnect 03')


class TestClient04(Protocol):  # pragma: no cover

    def __init__(self):
        self.check_result = False
        self.name = None
        self.eid = None

    def dataReceived(self, data):
        received_data = yaml.safe_load(data)
        if KEY_NAME in received_data:
            self.name = received_data[KEY_NAME]
            self.eid = EventId()
            response = '{"eid" : "' + str(self.eid) + '"}'
            response = response.encode('utf-8')
            self.transport.write(response)
        else:
            cid, state, timestamp, nic = EventId.unpack(received_data[KEY_EVENT_ID])
            eid_01 = EventId(cid.value, state.value, nic, timestamp)
            cid, state, timestamp, nic = EventId.unpack(self.eid.value)
            eid_02 = EventId(cid.value, STATE_PROCESS_END, nic, timestamp)
            if received_data[KEY_ERROR_CODE] == 0 and eid_01.core == eid_02.core:
                self.check_result = True
            self.transport.loseConnection()

    def connectionLost(self, reason):
        print('disconnect 04')


class TestServer(unittest.TestCase):

    def test_all(self):
        # test_01
        point_01 = UNIXClientEndpoint(reactor, config['socket'])
        tc_01 = TestClient01()
        connectProtocol(point_01, tc_01)
        # test_03
        point_03 = UNIXClientEndpoint(reactor, config['socket'])
        tc_03 = TestClient03()
        connectProtocol(point_03, tc_03)
        # test_04
        point_04 = UNIXClientEndpoint(reactor, config['socket'])
        tc_04 = TestClient04()
        connectProtocol(point_04, tc_04)
        # test_02
        point_02 = UNIXClientEndpoint(reactor, config['socket'])
        tc_02 = TestClient02()
        connectProtocol(point_02, tc_02)
        # 结果校验
        server.start()
        self.assertTrue(tc_01.check_result)
        self.assertTrue(tc_02.check_result)
        self.assertFalse(tc_03.check_result)
        self.assertFalse(tc_04.check_result)


if __name__ == '__main__':
    unittest.main()  # pragma: no cover
