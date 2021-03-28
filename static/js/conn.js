$(document).ready(function() {
    var socket = io(location.protocol+'//'+document.domain+':'+location.port, {autoConnect: false});

    let localStreamElement = document.getElementById("localStream");
    let remoteStreamElement = document.getElementById('remoteStream');
    var btn_start = document.getElementById("btn_start");
    var btn_close = document.getElementById("btn_close");
    
    let pc;
    var sender;
    var localStream = null;
    const PC_CONFIG = {
        iceServers: [    
            {
                urls: 'stun:stun.l.google.com:19302'
            }
        ]
    };

    socket.on('connect', function () {
        console.log("Connected to server!");
    });

    socket.on('disconnect', function () {
        closeLocalStream();
        socket.disconnect();
        console.log("Disconnected to server!");
    });

    btn_start.onclick = function() {
        if(localStream != null)
            console.log("Already started");
        else {
            getLocalStream();
        }
        btn_start.disabled = true;
        btn_close.disabled = false;
    }

    btn_close.onclick = function() {
        if(localStream == null)
            console.log("Already closed");
        else {
            closeLocalStream();
            console.log("Local stream closed");
            pc.close();
            remoteStreamElement.srcObject = null;
            console.log("Disconnected from peer");
            location.reload();
        }
        btn_start.disabled = false;
        btn_close.disabled = true;
    }

    socket.on('ready', () => {
        console.log("Ready");
        createPeerConnection();
        sendOffer();
    });

    socket.on('data', (data) => {
        console.log('Data received: ',data);
        handleSignalingData(data);
    });

    let sendData = (data) => {
        socket.emit('data', data);
    }

    let getLocalStream = () => {
        navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            console.log('Stream found', stream);
            localStreamElement.srcObject = stream;
            localStream = stream;
            // Connect after making sure that local stream is availble
            socket.connect();
        })
        .catch(error => {
            console.error('Stream not found: ', error);
        });
    }

    let createPeerConnection = () => {
        try
        {
            pc = new RTCPeerConnection(PC_CONFIG);
            pc.onicecandidate = onIceCandidate;
            pc.onaddstream = onAddStream;
            pc.addStream(localStream);
            pc.oniceconnectionstatechange = stateHandler;
            console.log('PeerConnection created');
        } catch (error) {
            console.error('PeerConnection failed: ', error);
        }
    }

    let onIceCandidate = (event) => {
        if (event.candidate) {
            console.log('Sending ICE candidate');
            sendData({
            type: 'candidate',
            candidate: event.candidate
            });
        }
    }

    let onAddStream = (event) => {
        console.log('Add stream', event.stream);
        remoteStreamElement.srcObject = event.stream;
    }

    let sendOffer = () => {
        console.log('Send offer');
        pc.createOffer().then(
            setAndSendLocalDescription,
            (error) => { console.error('Send offer failed: ', error); }
        );
    }

    let sendAnswer = () => {
        console.log('Send answer');
        pc.createAnswer().then(
            setAndSendLocalDescription,
            (error) => { console.error('Send answer failed: ', error); }
        );
    }

    let setAndSendLocalDescription = (sessionDescription) => {
    pc.setLocalDescription(sessionDescription);
    console.log('Local description set');
    sendData(sessionDescription);
    }

    let stateHandler = () => {
        if(pc.iceConnectionState == 'disconnected')
        {
            console.log('Peer disconnected');
            pc.close();
            closeLocalStream();
            remoteStreamElement.srcObject = null;
            location.reload();
        }
    }

    let handleSignalingData = (data) => {
        switch (data.type)
        {
            case 'offer':
                createPeerConnection();
                pc.setRemoteDescription(new RTCSessionDescription(data));
                sendAnswer();
                break;
            case 'answer':
                pc.setRemoteDescription(new RTCSessionDescription(data));
                break;
            case 'candidate':
                pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                break;
        }
    }

    let closeLocalStream = () => {
        const stream = localStreamElement.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => {
            track.stop();
        });
        localStreamElement.srcObject = null;
        localStream = null;
    }

});