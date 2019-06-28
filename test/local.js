/**
 * @file 本地流
 */

const offerOptions = {
  offerToReceiveVideo: 1
};

// 如果不立即收集并建立 jsep，会拿到所有的 candidate
// 包括 udp(host)、tcp(host)、srflx(stun)、relay(turn)
// 所以收集到一个 candidate 就交换
navigator.mediaDevices.getUserMedia({
  video: true,
}).then(function (stream) {
  console.log(stream.getVideoTracks())
  const localPeer = new RTCPeerConnection(null)
  const remotePeer = new RTCPeerConnection(null)

  const sd = localPeer.createDataChannel('sd', null)
  sd.onopen = function () {
    sd.send('hello world')
  }

  remotePeer.addEventListener('datachannel', function (event) {
    event.channel.onmessage = function (event) {
      console.log(event.data)
    }
  })

  localPeer.addEventListener('icecandidate', function (event) {
    if (event.candidate) {
      const iceCandidate = new RTCIceCandidate(event.candidate)
      remotePeer.addIceCandidate(iceCandidate)
      console.log('local', event.candidate)
    }
  })

  remotePeer.addEventListener('icecandidate', function (event) {
    if (event.candidate) {
      const iceCandidate = new RTCIceCandidate(event.candidate)
      localPeer.addIceCandidate(iceCandidate)
      console.log('remote', event.candidate)
    }
  })

  remotePeer.addEventListener('addstream', function (event) {
    const mediaStream = event.stream
  });

  // localPeer.addStream(stream);

  localPeer.createOffer(offerOptions).then(function (odes) {
    localPeer.setLocalDescription(odes)
    remotePeer.setRemoteDescription(odes)

    remotePeer.createAnswer().then(function (ades) {
      localPeer.setRemoteDescription(ades)
      remotePeer.setLocalDescription(ades)
    })
  })

})