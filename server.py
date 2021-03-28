from flask import Flask, request, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room

clients = []

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return render_template('client.html')

@socketio.on("message")
def handleMessage(data):
    emit("new_message",data,broadcast=True)
    
if __name__ == "__main__":
    socketio.run(app, debug=True, host='0.0.0.0', port=5004)