import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { MessageSquare, Loader2 } from 'lucide-react';
import { playSendSound, playReceiveSound, playRingTone, stopRingTone, playHangupSound } from './utils/audio';
import { CallModal } from './components/CallModal';

const ChatDashboard = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // null = Global Chatroom, otherwise { _id, username }
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]); // Array of { senderId, username, receiverId }
  const [unreadMap, setUnreadMap] = useState({ global: 0 });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [accentColor, setAccentColor] = useState(localStorage.getItem('accentColor') || 'violet');
  const [showChatWindowMobile, setShowChatWindowMobile] = useState(false);

  // WebRTC Audio/Video Call States
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'ringing' | 'connected'
  const [callType, setCallType] = useState('audio'); // 'audio' | 'video'
  const [callPartner, setCallPartner] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const peerConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Custom Accent Gradients Mapping
  const ACCENT_COLORS = {
    violet: {
      primary: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      secondary: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
      glow: 'rgba(139, 92, 246, 0.3)'
    },
    emerald: {
      primary: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
      secondary: 'linear-gradient(135deg, #6ee7b7 0%, #059669 100%)',
      glow: 'rgba(16, 185, 129, 0.3)'
    },
    cyan: {
      primary: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)',
      secondary: 'linear-gradient(135deg, #a5f3fc 0%, #0891b2 100%)',
      glow: 'rgba(6, 182, 212, 0.3)'
    },
    rose: {
      primary: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
      secondary: 'linear-gradient(135deg, #fda4af 0%, #be123c 100%)',
      glow: 'rgba(244, 63, 94, 0.3)'
    },
    amber: {
      primary: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
      secondary: 'linear-gradient(135deg, #fde68a 0%, #d97706 100%)',
      glow: 'rgba(245, 158, 11, 0.3)'
    }
  };

  useEffect(() => {
    const colors = ACCENT_COLORS[accentColor] || ACCENT_COLORS.violet;
    document.documentElement.style.setProperty('--primary-gradient', colors.primary);
    document.documentElement.style.setProperty('--secondary-gradient', colors.secondary);
    document.documentElement.style.setProperty('--panel-border-hover', colors.glow);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // 1. Fetch all registered users in DB
  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/messages/users', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch (err) {
      console.error('Error fetching all users:', err);
    }
  };

  // 1.1 Fetch users with active conversation history
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages/conversations', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  // 2. Fetch history for the active chat room
  const fetchMessages = async () => {
    try {
      const endpoint = activeChat === null 
        ? '/api/messages/global' 
        : `/api/messages/private/${activeChat._id}`;
      
      const res = await fetch(endpoint, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    fetchAllUsers();
    fetchConversations();
  }, [onlineUserIds]);

  useEffect(() => {
    fetchMessages();
  }, [activeChat]);

  // 3. Socket event registrations
  useEffect(() => {
    if (!socket) return;

    // Handle online presence lists
    socket.on('online_users', (userIds) => {
      setOnlineUserIds(userIds);
    });

    // Handle incoming messages
    socket.on('receive_message', (msg) => {
      const isPublicMsg = msg.receiver === null || msg.receiver?._id === null;
      const msgSenderId = msg.sender._id || msg.sender;
      const currentUserId = user._id;
      const isFromSelf = msgSenderId === currentUserId;

      // Play audio Synth beep for messages from other users
      if (!isFromSelf) {
        playReceiveSound();
      }

      if (isPublicMsg) {
        if (activeChat === null) {
          // If viewing global chat, append
          setMessages((prev) => [...prev, msg]);
        } else {
          // If viewing private chat, increment global unread count
          setUnreadMap((prev) => ({
            ...prev,
            global: (prev.global || 0) + 1
          }));
        }
      } else {
        // Private Message
        const msgReceiverId = msg.receiver._id || msg.receiver;

        const isFromActivePartner = activeChat && (msgSenderId === activeChat._id);

        if (isFromActivePartner || isFromSelf) {
          // If current private chat partner sent it, or we sent it from another tab
          setMessages((prev) => [...prev, msg]);
        } else {
          // Message is for us but from someone else, increment unread badge count
          setUnreadMap((prev) => ({
            ...prev,
            [msgSenderId]: (prev[msgSenderId] || 0) + 1
          }));
        }

        // Pull active conversations if sender is not in our current sidebar roster
        if (!isFromSelf) {
          setUsers((prev) => {
            const exists = prev.some(u => u._id === msgSenderId);
            if (!exists) {
              fetchConversations();
            }
            return prev;
          });
        }
      }
    });

    // Handle typing events
    socket.on('typing', (data) => {
      // Add user to typing list if not already present
      setTypingUsers((prev) => {
        if (prev.some(u => u.senderId === data.senderId && u.receiverId === data.receiverId)) {
          return prev;
        }
        return [...prev, data];
      });
    });

    socket.on('stop_typing', (data) => {
      // Remove user from typing list
      setTypingUsers((prev) => 
        prev.filter(u => !(u.senderId === data.senderId && u.receiverId === data.receiverId))
      );
    });

    // Handle incoming calls
    socket.on('incoming_call', (data) => {
      const { callerId, callerName, callerAvatar, signalData, callType: incomingType } = data;
      setCallPartner({ _id: callerId, username: callerName, avatar: callerAvatar });
      setCallType(incomingType);
      setCallState('ringing');
      
      // Play telephone ring
      playRingTone();

      // Store remote offer SDP
      socket.remoteOfferSignal = signalData;
    });

    // Handle call answer (SDP Answer)
    socket.on('call_answered', async (data) => {
      const { signalData } = data;
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signalData));
          setCallState('connected');
        }
      } catch (err) {
        console.error("Failed to set remote answer description:", err);
      }
    });

    // Handle incoming ICE candidate
    socket.on('ice_candidate', async (data) => {
      const { candidate } = data;
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Failed to add ICE candidate:", err);
      }
    });

    // Handle call decline/reject
    socket.on('call_rejected', () => {
      cleanupCall();
      alert("Call was declined.");
    });

    // Handle remote call hangup
    socket.on('call_ended', () => {
      cleanupCall();
    });

    // Handle real-time message deletion
    socket.on('message_deleted', (data) => {
      const { messageId } = data;
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    // Handle real-time conversation deletion
    socket.on('conversation_deleted', (data) => {
      const { deleterId, partnerId } = data;
      const currentUserId = user._id;
      const chatPartnerId = activeChat?._id;

      const isCurrentActiveChat = chatPartnerId && (
        (deleterId === currentUserId && partnerId === chatPartnerId) ||
        (deleterId === chatPartnerId && partnerId === currentUserId)
      );

      if (isCurrentActiveChat) {
        setMessages([]);
      }
      
      fetchConversations();
    });

    return () => {
      socket.off('online_users');
      socket.off('receive_message');
      socket.off('typing');
      socket.off('stop_typing');
      socket.off('incoming_call');
      socket.off('call_answered');
      socket.off('ice_candidate');
      socket.off('call_rejected');
      socket.off('call_ended');
      socket.off('message_deleted');
      socket.off('conversation_deleted');
    };
  }, [socket, activeChat, user]);

  const handleSendMessage = (content, messageType = 'text', mediaUrl = null) => {
    if (!socket) return;
    
    // Play sending swoop sound
    playSendSound();

    socket.emit('send_message', {
      receiverId: activeChat?._id || null,
      content,
      messageType,
      mediaUrl
    });
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to delete message');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleDeleteConversation = async (userId) => {
    try {
      const res = await fetch(`/api/messages/private/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setMessages([]);
        fetchConversations();
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to delete conversation');
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const clearUnread = (id) => {
    setUnreadMap((prev) => ({
      ...prev,
      [id]: 0
    }));
  };

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setShowChatWindowMobile(true);
  };

  // Start DM chat with a new contact from search list
  const handleStartNewChat = (partner) => {
    setUsers((prev) => {
      const exists = prev.some(u => u._id === partner._id);
      if (exists) return prev;
      return [...prev, partner];
    });
    setActiveChat(partner);
    setShowChatWindowMobile(true);
  };

  // WebRTC peer streams cleanup
  const cleanupCall = () => {
    stopRingTone();
    playHangupSound();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setCallState('idle');
    setCallType('audio');
    setCallPartner(null);
    setLocalStream(null);
    setRemoteStream(null);
  };

  // Initialize RTCPeerConnection
  const createPeerConnection = (partnerId, localMediaStream) => {
    const pc = new RTCPeerConnection(peerConfiguration);
    peerConnectionRef.current = pc;

    // Attach local stream tracks
    localMediaStream.getTracks().forEach((track) => {
      pc.addTrack(track, localMediaStream);
    });

    // Exchange ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', {
          targetId: partnerId,
          candidate: event.candidate
        });
      }
    };

    // Attach remote stream tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    return pc;
  };

  // Initiate call
  const handleStartCall = async (partner, type) => {
    if (!socket) return;
    setCallPartner(partner);
    setCallType(type);
    setCallState('calling');

    try {
      const isVideo = type === 'video';
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(partner._id, stream);
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call_user', {
        targetId: partner._id,
        signalData: offer,
        callType: type
      });
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Could not start call: Camera or microphone access was denied.");
      cleanupCall();
    }
  };

  // Accept incoming call
  const handleAcceptCall = async () => {
    if (!socket || !callPartner) return;
    stopRingTone();

    try {
      const isVideo = callType === 'video';
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(callPartner._id, stream);
      
      if (socket.remoteOfferSignal) {
        await pc.setRemoteDescription(new RTCSessionDescription(socket.remoteOfferSignal));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer_call', {
        targetId: callPartner._id,
        signalData: answer
      });

      setCallState('connected');
    } catch (err) {
      console.error("Failed to accept call:", err);
      alert("Failed to accept call: Camera/microphone access is required.");
      handleRejectCall();
    }
  };

  // Reject/Decline incoming call
  const handleRejectCall = () => {
    if (socket && callPartner) {
      socket.emit('call_rejected', { targetId: callPartner._id });
    }
    cleanupCall();
  };

  // Hang up active call
  const handleHangupCall = () => {
    if (socket && callPartner) {
      socket.emit('end_call', { targetId: callPartner._id });
    }
    cleanupCall();
  };

  return (
    <div className="app-container">
      <div className={`glass-panel dashboard-layout ${showChatWindowMobile ? 'show-chat-mobile' : ''}`}>
        <div className="sidebar-panel">
          <Sidebar 
            users={users}
            onlineUserIds={onlineUserIds}
            activeChat={activeChat}
            setActiveChat={handleSelectChat}
            unreadMap={unreadMap}
            clearUnread={clearUnread}
            theme={theme}
            toggleTheme={toggleTheme}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            allUsers={allUsers}
            onStartNewChat={handleStartNewChat}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }} className="chat-panel">
          <ChatWindow 
            activeChat={activeChat}
            messages={messages}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            onDeleteConversation={handleDeleteConversation}
            typingUsers={typingUsers}
            onBack={() => setShowChatWindowMobile(false)}
            onStartCall={handleStartCall}
          />
        </div>
      </div>
      
      {/* Real-time calling overlays */}
      <CallModal 
        callState={callState}
        callType={callType}
        callPartner={callPartner}
        localStream={localStream}
        remoteStream={remoteStream}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onHangup={handleHangupCall}
      />
    </div>
  );
};

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-container" style={{ flexDirection: 'column', gap: '16px', color: 'var(--text-secondary)' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: '#8b5cf6', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>Loading AetherChat session...</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  return isAuthenticated ? <ChatDashboard /> : <AuthPage />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
