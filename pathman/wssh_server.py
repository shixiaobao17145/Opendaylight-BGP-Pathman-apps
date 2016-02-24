from gevent import monkey
monkey.patch_all()

from flask import Flask, request, abort, render_template
from werkzeug.exceptions import BadRequest
import gevent
import wssh

import logging
from logging.handlers import RotatingFileHandler

import threading

from  pathman_ini import *

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/hello')
def hello():
    return 'hello'


@app.route('/wssh/<hostname>/<username>')
def connect(hostname, username):
    app.logger.debug('{remote} -> {username}@{hostname}: {command}'.format(
            remote=request.remote_addr,
            username=username,
            hostname=hostname,
            command=request.args['run'] if 'run' in request.args else
                '[interactive shell]'
        ))

    # Abort if this is not a websocket request
    if not request.environ.get('wsgi.websocket'):
        app.logger.error('Abort: Request is not WebSocket upgradable')
        raise BadRequest()

    bridge = wssh.WSSHBridge(request.environ['wsgi.websocket'])
    print username
    print request.args.get('password')
    try:
        bridge.open(
            hostname=hostname,
            username=username,
            password=request.args.get('password'),
            port=int(request.args.get('port')),
            private_key=request.args.get('private_key'),
            key_passphrase=request.args.get('key_passphrase'),
            allow_agent=app.config.get('WSSH_ALLOW_SSH_AGENT', False))
    except Exception as e:
        app.logger.exception('Error while connecting to {0}: {1}'.format(
            hostname, e.message))
        request.environ['wsgi.websocket'].close()
        return str()
    if 'run' in request.args:
        bridge.execute(request.args.get('run'))
    else:
        bridge.shell()

    # We have to manually close the websocket and return an empty response,
    # otherwise flask will complain about not returning a response and will
    # throw a 500 at our websocket client
    request.environ['wsgi.websocket'].close()
    return str()


def start(host,port,allow_agent=False):
    import argparse
    from gevent.pywsgi import WSGIServer
    from geventwebsocket.handler import WebSocketHandler
    from jinja2 import FileSystemLoader
    import os

    root_path = os.path.dirname(wssh.__file__)
 #   root_path = '/home/bob/test/wssh/wssh'#os.path.dirname(wssh.__file__)
#    print "RootPath===>",root_path
    app.jinja_loader = FileSystemLoader(os.path.join(root_path, 'templates'))
    app.static_folder = os.path.join(root_path, 'static')


#    global wssh_server_log_file
    handler = RotatingFileHandler(wssh_server_log_file, maxBytes=10000000, backupCount=5)
    handler.setLevel(logging.DEBUG)
    app.logger.addHandler(handler)

    app.config['WSSH_ALLOW_SSH_AGENT'] = allow_agent

    agent = 'wsshd/{0}'.format(wssh.__version__)

    print '{0} running on {1}:{2}'.format(agent, host, port)

    app.debug = True
    http_server = WSGIServer((host, port), app,
        log=None,
        handler_class=WebSocketHandler)
    try:
        http_server.serve_forever()
    except KeyboardInterrupt:
        pass

def threading_start(port,host='0.0.0.0',allow_agent=False):
    t = WsshServerThread(host,port,allow_agent)
    t.start()
    return t
    


class WsshServerThread(threading.Thread):
    def __init__(self,host,port,allow_agent):
        self.host = host;
        self.port = port;
        self.allow_agent = allow_agent;
        threading.Thread.__init__(self)
        
    def run(self):
        start(self.host,self.port,self.allow_agent);
        print "Connection from : "+ip+":"+str(port)


#if __name__ == '__main__':
#    start('0.0.0.0',5000);
