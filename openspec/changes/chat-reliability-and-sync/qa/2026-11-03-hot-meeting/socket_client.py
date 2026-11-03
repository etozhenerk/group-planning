"""JSON-protocol load client for the isolated Centrifuge fixture, never product code."""
import base64
import hashlib
import json
import os
import socket
import struct
import threading


class HintSocket:
    def __init__(self, port, token, meeting):
        self.connection = socket.create_connection(('127.0.0.1', port), timeout=10)
        self.connection.settimeout(5)
        self.lock = threading.Lock()
        self.closed = threading.Event()
        self.publications = 0
        self.error = None
        self.close_info = None
        self.buffer = b''
        key = base64.b64encode(os.urandom(16)).decode()
        headers = ('GET /api/v1/realtime HTTP/1.1\r\nHost: 127.0.0.1:' + str(port) +
                   '\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\n' +
                   'Sec-WebSocket-Key: ' + key + '\r\nOrigin: https://sdd.invalid\r\n' +
                   'Cookie: __Host-somewhere_session=' + token + '\r\n\r\n')
        self.connection.sendall(headers.encode())
        response = b''
        while b'\r\n\r\n' not in response:
            chunk = self.connection.recv(4096)
            if not chunk:
                raise EOFError('WebSocket handshake closed')
            response += chunk
            if len(response) > 16384:
                raise RuntimeError('oversized WebSocket handshake')
        header, self.buffer = response.split(b'\r\n\r\n', 1)
        expected = base64.b64encode(hashlib.sha1((key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').encode()).digest())
        if not header.startswith(b'HTTP/1.1 101 ') or expected.lower() not in header.lower():
            raise RuntimeError('WebSocket upgrade rejected')
        self.send({'id': 1, 'connect': {}})
        self.wait_reply(1)
        self.send({'id': 2, 'subscribe': {'channel': 'meeting:' + meeting}})
        self.wait_reply(2)
        self.reader = threading.Thread(target=self.read_loop, daemon=True)
        self.reader.start()

    def exact(self, length):
        while len(self.buffer) < length:
            data = self.connection.recv(max(4096, length - len(self.buffer)))
            if not data:
                raise EOFError('test socket closed')
            self.buffer += data
        data, self.buffer = self.buffer[:length], self.buffer[length:]
        return data

    def send_frame(self, opcode, payload):
        mask = os.urandom(4)
        size = len(payload)
        header = bytes([0x80 | opcode, 0x80 | size]) if size < 126 else bytes([0x80 | opcode, 0x80 | 126]) + struct.pack('!H', size)
        masked = bytes(value ^ mask[index % 4] for index, value in enumerate(payload))
        with self.lock:
            self.connection.sendall(header + mask + masked)

    def send(self, payload):
        self.send_frame(1, json.dumps(payload, separators=(',', ':')).encode())

    def read_messages(self):
        assembled = b''
        while True:
            first, second = self.exact(2)
            size = second & 0x7f
            if size == 126:
                size = struct.unpack('!H', self.exact(2))[0]
            elif size == 127:
                size = struct.unpack('!Q', self.exact(8))[0]
            if size > 1 << 20 or second & 0x80:
                raise RuntimeError('unexpected server frame')
            payload = self.exact(size)
            opcode = first & 0x0f
            if opcode == 8:
                self.close_info = {'code': struct.unpack('!H', payload[:2])[0] if len(payload) >= 2 else None,
                                   'reason': payload[2:].decode(errors='replace')[:80]}
                raise EOFError('server closed test socket')
            if opcode == 9:
                self.send_frame(10, payload)
                continue
            if opcode == 10:
                continue
            assembled += payload
            if first & 0x80:
                break
        return [json.loads(line) for line in assembled.decode().splitlines() if line]

    def handle(self, message):
        if not message:
            self.send({})
        if message.get('push', {}).get('pub') is not None:
            self.publications += 1
        if message.get('push', {}).get('disconnect'):
            details = message['push']['disconnect']
            self.close_info = {'code': details.get('code'), 'reason': str(details.get('reason', ''))[:80]}
        if message.get('error') or message.get('push', {}).get('disconnect'):
            raise RuntimeError('protocol error in test socket')

    def wait_reply(self, expected):
        for _ in range(20):
            for message in self.read_messages():
                self.handle(message)
                if message.get('id') == expected:
                    return
        raise RuntimeError('missing protocol reply')

    def read_loop(self):
        while not self.closed.is_set():
            try:
                for message in self.read_messages():
                    self.handle(message)
            except socket.timeout:
                continue
            except Exception as error:
                if not self.closed.is_set():
                    self.error = type(error).__name__
                return

    def close(self):
        self.closed.set()
        try:
            self.connection.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass
        self.connection.close()
        if hasattr(self, 'reader'):
            self.reader.join(timeout=2)
