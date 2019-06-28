/**
 * @file 模拟远程 signal 流
 */

const localVideo = document.getElementById('local-v')
const remoteVideo = document.getElementById('remote-v')
const io1 = io.connect('http://localhost:3000')
const io2 = io.connect('http://localhost:3000')

// 加入相同的房间
io1.emit('join', 'webrtc')
io2.emit('join', 'webrtc')

const localPeer = new RTCPeerConnection(null)
const remotePeer = new RTCPeerConnection(null)

// 发送 local ice
localPeer.addEventListener('icecandidate', function (event) {
  if (event.candidate) {
    io1.emit('webrtc', {
      type: 'candidate',
      payload: event.candidate
    })
  }
})

// 发送 remote ice
remotePeer.addEventListener('icecandidate', function (event) {
  if (event.candidate) {
    io2.emit('webrtc', {
      type: 'candidate',
      payload: event.candidate
    })
  }
})

remotePeer.addEventListener('addstream', function (event) {
  remoteVideo.srcObject = event.stream
})

// 获取摄像头
navigator.mediaDevices.getUserMedia({
  video: true,
}).then(function (stream) {
  localPeer.addStream(stream)
  localVideo.srcObject = stream
})

// 开始建立连接
document.getElementById('rtc-conn').onclick = function () {
  localPeer.createOffer({
    offerToReceiveVideo: 1
  }).then(function (des) {
    localPeer.setLocalDescription(des)
    // 把 offer 发送到 remote
    io1.emit('webrtc', {
      type: 'offer',
      payload: des
    })
  })
}

io1.on('exchange', function (data) {
  if (data.type == 'answer') {
    console.log('local answer')
    localPeer.setRemoteDescription(data.payload)
  }

  if (data.type == 'candidate') {
    console.log('local candidate')
    const iceCandidate = new RTCIceCandidate(data.payload)
    localPeer.addIceCandidate(iceCandidate).catch(e => console.log(e))
  }
})

io2.on('exchange', function (data) {
  // 接收到 offer，发送 answer
  if (data.type == 'offer') {
    console.log('remote offer')
    remotePeer.setRemoteDescription(data.payload)
    remotePeer.createAnswer().then(function (des) {
      remotePeer.setLocalDescription(des)

      // 把 answer 发回给 local
      io2.emit('webrtc', {
        type: 'answer',
        payload: des
      })
    })
  }

  if (data.type == 'candidate') {
    console.log('remote candidate')
    const iceCandidate = new RTCIceCandidate(data.payload)
    remotePeer.addIceCandidate(iceCandidate).catch(e => console.log(e))
  }
})