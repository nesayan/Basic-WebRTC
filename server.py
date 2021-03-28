from flask import Flask, request, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room

ROOM = "room"

#sio = socketio.AsyncServer(cors_allowed_origins="*")
#app = web.Application()
#sio.attach(app)
app = Flask(__name__)
socket = SocketIO(app, cors_allowed_origins="*")
clients = []

@app.route('/', methods=['GET'])
def index():
    return render_template('client.html')

@socket.on('connect')
def conn():
    clients.append(request.sid)
    emit('ready', room=ROOM, skip_sid=request.sid)
    join_room(room=ROOM,sid=request.sid)
    print("[ CLIENT CONNECTED ]", request.sid)

@socket.on('disconnect')
def disconn():
    clients.remove(request.sid)
    leave_room(room=ROOM, sid=request.sid)
    print("[ CLIENT DISCONNECTED ]", request.sid)

@socket.on('data')
def emitData(data):
    print('Message from {}: {}'.format(request.sid, data))
    emit('data', data, room=ROOM, skip_sid=request.sid)

if __name__ == "__main__":
    #web.run_app(app, host= "127.0.0.1", port= 5000)
    socket.run(app, debug=False, host='https://webrtc-vid.herokuapp.com/', port=8080)
