import yaml
from twisted.internet.protocol import Factory, Protocol
from twisted.internet.endpoints import UNIXClientEndpoint, connectProtocol
from twisted.internet import reactor
from nisp.const import *
from nisp.datamodel import EventId
from nisp.server import NISProtocol
from string import Template

response_template = Template('{ "' + KEY_EVENT_ID + '": "${eid}", "' + KEY_DATA + '": ${data} }')


class TestClient(Protocol):
    # def dataReceived(self, data):
    #     received_data = yaml.safe_load(data)
    #     print(received_data)
    #     self.transport.loseConnection()
    #     self.transport.write(b"{'hello': 123}")
    #     # reactor.stop()
    def __init__(self):
        self.check_result = False
        self.eid = None
        self.client_id = None

    def dataReceived(self, data):
        received_data = yaml.safe_load(data)
        if KEY_NAME in received_data:
            if self.client_id is None:
                self.client_id = received_data[KEY_NAME]
            self.eid = EventId(self.client_id)
            response = response_template.substitute(eid=str(self.eid), data='{"name": "' + self.client_id + '"}').encode('utf-8')
            NISProtocol.register(self.client_id)
            self.transport.write(response)
        else:
            cid, state, timestamp, _ = EventId.unpack(received_data[KEY_EVENT_ID])
            eid_01 = EventId(self.client_id, cid.value, state.value, timestamp)
            print(eid_01)
            cid, state, timestamp, _ = EventId.unpack(self.eid)
            eid_02 = EventId(self.client_id, cid.value, STATE_PROCESS_END, timestamp)
            print(eid_02)
            if received_data[KEY_ERROR_CODE] == 0 and eid_01.core == eid_02.core:
                self.check_result = True
            self.transport.loseConnection()

    def connectionLost(self, reason):
        print('disconnect')
        reactor.stop()


config = {'socket': './nisp.socket'}
point = UNIXClientEndpoint(reactor, config['socket'])
connectProtocol(point, TestClient())
reactor.run()

