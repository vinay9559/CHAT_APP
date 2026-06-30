import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, User } from 'lucide-react';

const getAvatarColorClass = (username) => {
  const colors = [
    'linear-gradient(135deg, #f43f5e 0%, #f43f5e 100%)', // Rose
    'linear-gradient(135deg, #3b82f6 0%, #3b82f6 100%)', // Blue
    'linear-gradient(135deg, #10b981 0%, #10b981 100%)', // Emerald
    'linear-gradient(135deg, #f59e0b 0%, #f59e0b 100%)', // Amber
    'linear-gradient(135deg, #8b5cf6 0%, #8b5cf6 100%)', // Violet
  ];
  if (!username) return colors[0];
  let sum = 0;
  for (let i = 0; i < username.length; i++) {
    sum += username.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

export const CallModal = ({
  callState, // 'idle' | 'calling' | 'ringing' | 'connected'
  callType, // 'audio' | 'video'
  callPartner, // user details
  localStream,
  remoteStream,
  onAccept,
  onReject,
  onHangup
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [callTime, setCallTime] = useState(0);

  // Sync media streams to video elements
  useEffect(() => {
    if (callState === 'connected') {
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [callState, localStream, remoteStream]);

  // Track call timer
  useEffect(() => {
    let timerInterval = null;
    if (callState === 'connected') {
      setCallTime(0);
      timerInterval = setInterval(() => {
        setCallTime((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTime(0);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [callState]);

  // Format call duration MM:SS
  const formatDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle local audio track
  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setMicMuted(!micMuted);
    }
  };

  // Toggle local video track
  const toggleCamera = () => {
    if (localStream && callType === 'video') {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setCameraOff(!cameraOff);
    }
  };

  if (callState === 'idle') return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(3, 7, 18, 0.92)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: '#f3f4f6'
    }}>
      {/* 1. OUTGOING CALLING OVERLAY */}
      {callState === 'calling' && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div className="calling-pulsar" style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: getAvatarColorClass(callPartner?.username),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)'
          }}>
            {callPartner?.avatar ? (
              <img 
                src={callPartner.avatar} 
                alt={callPartner.username} 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              callPartner?.username?.charAt(0)
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Calling {callPartner?.username}...</h2>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Waiting for answer
            </span>
          </div>
          <button 
            onClick={onHangup}
            className="glass-btn"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#ef4444',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginTop: '40px',
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)'
            }}
            title="Cancel Call"
          >
            <PhoneOff size={24} color="white" />
          </button>
        </div>
      )}

      {/* 2. INCOMING CALLING OVERLAY */}
      {callState === 'ringing' && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div className="calling-pulsar" style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: getAvatarColorClass(callPartner?.username),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
          }}>
            {callPartner?.avatar ? (
              <img 
                src={callPartner.avatar} 
                alt={callPartner.username} 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              callPartner?.username?.charAt(0)
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Incoming {callType === 'video' ? 'Video' : 'Audio'} Call</h2>
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
              from {callPartner?.username}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '24px', marginTop: '40px' }}>
            <button 
              onClick={onAccept}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#10b981',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
              }}
              title="Accept Call"
            >
              <Phone size={24} color="white" />
            </button>
            <button 
              onClick={onReject}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#ef4444',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)'
              }}
              title="Decline Call"
            >
              <PhoneOff size={24} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* 3. ACTIVE CONNECTED STREAM VIEW */}
      {callState === 'connected' && (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          
          {/* Main Video Stream Container (Video Call only) */}
          {callType === 'video' ? (
            <div style={{ position: 'relative', flex: 1, width: '100%', height: '100%', background: '#000' }}>
              {/* Remote Feed */}
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              
              {/* Local Feed Picture-in-Picture */}
              <div style={{
                position: 'absolute',
                bottom: '100px',
                right: '24px',
                width: '120px',
                height: '160px',
                borderRadius: '12px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden',
                background: '#1f2937',
                zIndex: 10
              }}>
                {cameraOff ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#9ca3af' }}>
                    <VideoOff size={24} style={{ margin: 'auto' }} />
                  </div>
                ) : (
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                )}
              </div>
            </div>
          ) : (
            /* Audio Call Layout with static pulsing avatar */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
              <div className="audio-call-pulsar" style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: getAvatarColorClass(callPartner?.username),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3.5rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                boxShadow: '0 0 40px var(--primary-gradient)',
                animation: 'pulseGlow 2s infinite ease-in-out'
              }}>
                {callPartner?.avatar ? (
                  <img 
                    src={callPartner.avatar} 
                    alt={callPartner.username} 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  callPartner?.username?.charAt(0)
                )}
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 600 }}>{callPartner?.username}</h3>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Secure Audio Connection Active
                </span>
              </div>
            </div>
          )}

          {/* Call Header Overlay (Partner Name and Call Timer) */}
          <div style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            background: 'rgba(3, 7, 18, 0.4)',
            padding: '12px 18px',
            borderRadius: '12px',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{callPartner?.username}</h4>
            <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              {formatDuration(callTime)}
            </span>
          </div>

          {/* Call Footer Control Bar */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'rgba(3, 7, 18, 0.65)',
            padding: '12px 24px',
            borderRadius: '50px',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            zIndex: 100
          }}>
            {/* Mic Toggle Button */}
            <button 
              onClick={toggleMic}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: micMuted ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.2s ease'
              }}
              title={micMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Video Toggle Button (Video call only) */}
            {callType === 'video' && (
              <button 
                onClick={toggleCamera}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: cameraOff ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all 0.2s ease'
                }}
                title={cameraOff ? "Turn Video On" : "Turn Video Off"}
              >
                {cameraOff ? <VideoOff size={18} /> : <Video size={18} />}
              </button>
            )}

            {/* End Call Hangup Button */}
            <button 
              onClick={onHangup}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#ef4444',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
              }}
              title="Hang Up"
            >
              <PhoneOff size={18} color="white" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
