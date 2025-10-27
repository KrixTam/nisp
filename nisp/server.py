import yaml
from ni.config import Config
from twisted.internet.protocol import Factory, Protocol
from twisted.internet import reactor
from nisp.utils import logger
from nisp.const import *
from nisp.datamodel import Command, Event
import random
from string import Template


class HeartBeat(Command):

    def __init__(self, state):
        super().__init__(HEARTBEAT_ID, state)

    def init(self, **kwargs):
        if PV_HEARTBEAT.validates(kwargs, True):
            client_id = kwargs[KEY_NAME]
            if NISProtocol.is_existed(client_id):
                # timeout 检查
                last = NISProtocol._clients.get(client_id)
                now = moment()
                if last is not None:
                    last_ms = last.unix() * 1000 + last.milliseconds()
                    now_ms = now.unix() * 1000 + now.milliseconds()
                    threshold_s = getattr(NISProtocol, 'timeout', HEARTBEAT_TIMEOUT_DEFAULT)
                    if now_ms - last_ms > threshold_s * 1000:
                        print(f'[{client_id}] 心跳超时（>{threshold_s}s），断开连接。')
                        return None, 0
                # 正常心跳则刷新最近时间戳
                NISProtocol.update(client_id)
                self.state.next()
                self.state.next()
                return self.process(**kwargs)
            else:
                return None, 0
        else:
            return None, 0

    def process(self, **kwargs):
        self.state.next()
        return {}, 0


class NISProtocol(Protocol):
    _clients = {}
    _template = Template("{'name': '${name}'}")
    # 超时秒数，默认使用常量，服务端初始化时会覆盖
    timeout = HEARTBEAT_TIMEOUT_DEFAULT

    def __init__(self):
        name = HEX_REG.format(random.randint(0, 65535), 4)
        while name in NISProtocol._clients:  # pragma: no cover
            name = HEX_REG.format(random.randint(0, 65535), 4)
        self._name = name
        NISProtocol.register(name)

    def connectionMade(self):
        logger.info([1000])
        self.transport.write(NISProtocol._template.substitute(name=self._name).encode('utf-8'))

    def dataReceived(self, data):
        received_data = yaml.safe_load(data)
        # print(received_data)
        # print(self._name)
        if PV_REQUEST.validates(received_data, True):
            event = Event(received_data[KEY_EVENT_ID])
            response_data = event.process(received_data[KEY_DATA])
            if response_data is None:
                self.lose_connection()
            else:
                self.transport.write(response_data)
        else:
            self.lose_connection()

    def lose_connection(self):
        NISProtocol.lose(self._name)
        self.transport.loseConnection()

    @staticmethod
    def register(client_id: str):
        if NISProtocol.is_existed(client_id):
            pass
        else:
            NISProtocol._clients[client_id] = moment()

    @staticmethod
    def lose(client_id: str):
        if NISProtocol.is_existed(client_id):
            del NISProtocol._clients[client_id]

    @staticmethod
    def is_existed(client_id: str):
        return client_id in NISProtocol._clients

    @staticmethod
    def update(client_id: str):
        # 心跳刷新最近活动时间
        if NISProtocol.is_existed(client_id):
            NISProtocol._clients[client_id] = moment()


class NISPFactory(Factory):
    protocol = NISProtocol

    def __init__(self):
        super(NISPFactory, self).__init__()


class NISPServer:
    def __init__(self, **kwargs):
        Command.register(HEARTBEAT_ID, HeartBeat)
        self._config = Config({
            'name': 'NISPServer',
            'default': {
                'socket': '/tmp/nisp.sock',
                'timeout': TIMEOUT_DEFAULT
            },
            'schema': {
                'type': 'object',
                'properties': {
                    'mode': {'type': 'string'},
                    'timeout': {
                        'type': 'integer',
                        'minimum': TIMEOUT_MIN,
                        'maximum': TIMEOUT_MAX
                    }
                }
            }
        })
        for key, value in kwargs.items():
            if key in self._config:
                self._config[key] = value
        self.serverFactory = NISPFactory()
        self._state = SERVER_INIT
        # 透传timeout到协议层，供心跳判断使用
        NISProtocol.timeout = self._config['timeout']

    def run(self):
        if SERVER_INIT == self._state:
            port = reactor.listenUNIX(self._config['socket'], self.serverFactory)
            self._state = SERVER_RUNNING

    def start(self):
        self.run()
        reactor.run()

    def stop(self):
        self._state = SERVER_STOP
        reactor.stop()
