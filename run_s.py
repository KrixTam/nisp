from nisp.server import NISPServer
from twisted.internet import reactor

config = {'socket': './nisp.socket'}
server = NISPServer(**config)

server.run()
reactor.run()

