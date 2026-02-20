import { useState, useRef, useEffect } from "react";
import axios from "axios";

export const useCall = (socket, selectedUser) => {
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
const pendingCandidates = useRef([]);
  const [call, setCall] = useState({
    status: "idle", 
    type: null,   
    incoming: null,
    activeUser: null,
    localStream: null,
    remoteStream: null,
    muted: false,
    videoEnabled: true
  });

  // Create Peer Connection
  const createPeer = (receiverId) => {

  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("iceCandidate", {
        receiverId,
        candidate: event.candidate
      });
    }
  };

  pc.ontrack = (event) => {
    setCall(prev => ({
      ...prev,
      remoteStream: event.streams[0]
    }));
  };

  peerRef.current = pc;
  return pc;
};

  // Start Call (Caller)
  const startCall = async (type) => {

  if (!selectedUser || !socket) return;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: type === "video"
  });

  localStreamRef.current = stream;

  setCall(prev => ({
    ...prev,
    status: "calling",
    type,
    activeUser: selectedUser,
    localStream: stream
  }));

  const pc = createPeer(selectedUser._id);

  stream.getTracks().forEach(track =>
    pc.addTrack(track, stream)
  );

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("callUser", {
    receiverId: selectedUser._id,
    offer,
    callType: type
  });
};

  //  Accept Call (Receiver)
  const acceptCall = async () => {

  window.__ringtone?.pause();
  window.__ringtone = null;

  if (!call.incoming) return;

  const { callerId, offer, callType, callerName, profilePic } =
    call.incoming;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: callType === "video"
  });

  localStreamRef.current = stream;

  const pc = createPeer(callerId);

  stream.getTracks().forEach(track =>
    pc.addTrack(track, stream)
  );

  await pc.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socket.emit("answerCall", { callerId, answer });

  setCall({
    status: "connected",
    type: callType,
    incoming: null,
    activeUser: {
      _id: callerId,
      fullName: callerName,
      profilePic
    },
    localStream: stream,
    remoteStream: null,
    muted: false,
    videoEnabled: true
  });
};

  //  End Call
  const cleanup = () => {

  localStreamRef.current?.getTracks().forEach(t => t.stop());
  peerRef.current?.close();

  peerRef.current = null;
  localStreamRef.current = null;

  pendingCandidates.current = [];

  setCall({
    status: "idle",
    type: null,
    incoming: null,
    activeUser: null,
    localStream: null,
    remoteStream: null,
    muted: false,
    videoEnabled: true
  });
};

const endCall = async () => {

  window.__ringtone?.pause();
  window.__ringtone = null;

  const receiverId =
    call.activeUser?._id || selectedUser?._id;

  if (receiverId) {
    socket.emit("endCall", { receiverId });

    const label =
      call.type === "video" ? "Video call" : "Audio call";

    await axios.post(`/api/messages/send/${receiverId}`, {
      text: `__CALL__${label}`
    });
  }

  cleanup();
};

  //  Toggle Mute
  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;

    setCall(prev => ({
      ...prev,
      muted: !track.enabled
    }));
  };
  const toggleVideo = () => {
  const track = localStreamRef.current?.getVideoTracks()[0];
  if (!track) return;

  track.enabled = !track.enabled;

  setCall(prev => ({
    ...prev,
     videoEnabled: track.enabled
  }));
};


  //  Socket Listeners
  useEffect(() => {

  if (!socket) return;

  const handleIncoming = (data) => {
    setCall(prev => ({
      ...prev,
      status: "ringing",
      incoming: data
    }));
  };

  const handleAnswered = async ({ answer }) => {

    if (!peerRef.current) return;

    await peerRef.current.setRemoteDescription(
      new RTCSessionDescription(answer)
    );

    setCall(prev => ({
      ...prev,
      status: "connected"
    }));
  };

  const handleIce = async ({ candidate }) => {

  if (!peerRef.current) return;

  if (!peerRef.current.remoteDescription) return;

  try {
    await peerRef.current.addIceCandidate(
      new RTCIceCandidate(candidate)
    );
  } catch (err) {
    console.error("ICE error:", err);
  }
};

  const handleEnded = () => {
    cleanup();
  };

  socket.on("incomingCall", handleIncoming);
  socket.on("callAnswered", handleAnswered);
  socket.on("iceCandidate", handleIce);
  socket.on("callEnded", handleEnded);

  return () => {
    socket.off("incomingCall", handleIncoming);
    socket.off("callAnswered", handleAnswered);
    socket.off("iceCandidate", handleIce);
    socket.off("callEnded", handleEnded);
  };

}, [socket]);

  return {
    call,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo
  };
};
