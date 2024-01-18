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
            cid, state, timestamp = EventId.unpack(received_data[KEY_EVENT_ID])
            eid_01 = EventId(cid.value, state.value, timestamp)
            print(eid_01)
            cid, state, timestamp = EventId.unpack(self.eid.value)
            eid_02 = EventId(cid.value, STATE_PROCESS_END, timestamp)
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

