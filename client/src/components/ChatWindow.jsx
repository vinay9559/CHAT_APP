import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, Globe, User, MessageSquare, ShieldAlert, Paperclip, X, ChevronLeft, Phone, Video, Trash2 } from 'lucide-react';

const getAvatarColorClass = (username) => {
  const colors = [
    'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
    'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
    'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
    'linear-gradient(135deg, #34d399 0%, #059669 100%)',
    'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)',
    'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
    'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)',
    'linear-gradient(135deg, #c084fc 0%, #9333ea 100%)',
    'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const ChatWindow = ({ 
  activeChat, 
  messages, 
  onSendMessage, 
  onDeleteMessage,
  onDeleteConversation,
  typingUsers,
  onBack,
  onStartCall
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaInputRef = useRef(null);

  // Auto-scroll to bottom on new messages or chat change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Handle typing state broadcast
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { receiverId: activeChat?._id || null });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop_typing', { receiverId: activeChat?._id || null });
    }, 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim(), 'text', null);
    setInputText('');

    // Trigger stop typing instantly
    if (isTyping) {
      setIsTyping(false);
      if (socket) {
        socket.emit('stop_typing', { receiverId: activeChat?._id || null });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleMediaClick = () => {
    mediaInputRef.current?.click();
  };

  const handleMediaSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.");
      return;
    }

    const type = file.type.startsWith('video/') ? 'video' : 'image';
    if (type === 'image' && !file.type.startsWith('image/')) {
      alert("Unsupported file type. Please select an image or video.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      onSendMessage(inputText.trim(), type, reader.result);
      setInputText('');
    };
    reader.readAsDataURL(file);
  };

  // Clean up typing timeout on unmount or chat switch
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [activeChat]);

  // Filter typing status for this window
  const getRelevantTypingUsers = () => {
    return typingUsers.filter(tu => {
      if (activeChat === null) {
        // Global chat typing: check if user is typing globally (receiverId is null) and is not current user
        return tu.receiverId === null && tu.senderId !== user._id;
      } else {
        // Private chat typing: check if this specific partner is typing to current user
        return tu.senderId === activeChat._id && tu.receiverId === user._id;
      }
    });
  };

  const currentTypingUsers = getRelevantTypingUsers();

  // Helper to format date/time
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--chat-bg)',
      overflow: 'hidden',
      transition: 'background 0.3s ease'
    }}>
      
      {/* Header Info */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--panel-border)',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--sidebar-header-bg)',
        transition: 'background 0.3s ease'
      }}>
        {/* Back Button for mobile layout */}
        <button 
          type="button"
          onClick={onBack}
          className="glass-btn glass-btn-secondary mobile-back-btn"
          style={{ padding: '8px', borderRadius: '8px' }}
          title="Back to lists"
        >
          <ChevronLeft size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa'
          }}>
            {activeChat === null ? <Globe size={18} /> : <User size={18} />}
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>
              {activeChat === null ? 'Global Chatroom' : activeChat.username}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {activeChat === null 
                ? 'Messages are public to all online users' 
                : 'Direct secure communication channel'}
            </span>
          </div>
        </div>

        {/* Call Trigger Buttons (Private DM only) */}
        {activeChat !== null && (
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={() => onStartCall(activeChat, 'audio')}
              className="glass-btn glass-btn-secondary"
              style={{ padding: '8px', borderRadius: '8px' }}
              title="Voice Call"
            >
              <Phone size={16} />
            </button>
            <button
              type="button"
              onClick={() => onStartCall(activeChat, 'video')}
              className="glass-btn glass-btn-secondary"
              style={{ padding: '8px', borderRadius: '8px' }}
              title="Video Call"
            >
              <Video size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete all messages in this chat? This action cannot be undone.")) {
                  onDeleteConversation(activeChat._id);
                }
              }}
              className="glass-btn glass-btn-secondary"
              style={{ padding: '8px', borderRadius: '8px' }}
              title="Delete Chat"
            >
              <Trash2 size={16} style={{ color: 'var(--accent-rose)' }} />
            </button>
          </div>
        )}
      </div>

      {/* Messages Stream */}
      <div 
        className="chat-messages-stream"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            gap: '12px'
          }}>
            <MessageSquare size={48} style={{ strokeWidth: 1.5, opacity: 0.4 }} />
            <p style={{ fontSize: '0.9rem' }}>No messages here yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOutgoing = msg.sender === user._id || msg.sender?._id === user._id;
            const senderName = msg.sender?.username || 'User';
            const senderAvatar = msg.sender?.avatar;

            return (
              <div 
                key={msg._id || index} 
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignSelf: isOutgoing ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  maxWidth: '70%'
                }}
              >
                {/* Render Avatar for incoming message */}
                {!isOutgoing && (
                  <div style={{ width: '28px', height: '28px', flexShrink: 0, position: 'relative' }}>
                    {senderAvatar ? (
                      <img 
                        src={senderAvatar} 
                        alt={senderName} 
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: getAvatarColorClass(senderName),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {senderName.charAt(0)}
                      </div>
                    )}
                  </div>
                )}

                <div 
                  className={`message-wrapper ${isOutgoing ? 'message-wrapper-outgoing' : 'message-wrapper-incoming'}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isOutgoing ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* Show sender username for incoming global messages */}
                  {!isOutgoing && activeChat === null && (
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                      marginBottom: '4px',
                      marginLeft: '4px',
                      textTransform: 'lowercase'
                    }}>
                      {senderName}
                    </span>
                  )}

                  <div 
                    className={`message-bubble ${isOutgoing ? 'message-outgoing' : 'message-incoming'}`}
                    style={{
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      padding: msg.messageType && msg.messageType !== 'text' ? '8px' : '12px 16px'
                    }}
                  >
                    {msg.messageType === 'image' && (
                      <img 
                        src={msg.mediaUrl} 
                        alt="attachment" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '260px', 
                          borderRadius: '10px', 
                          display: 'block',
                          marginBottom: msg.content ? '8px' : '0',
                          cursor: 'pointer' 
                        }}
                        onClick={() => setZoomedImage(msg.mediaUrl)}
                      />
                    )}
                    {msg.messageType === 'video' && (
                      <video 
                        src={msg.mediaUrl} 
                        controls 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '260px', 
                          borderRadius: '10px', 
                          display: 'block',
                          marginBottom: msg.content ? '8px' : '0'
                        }}
                      />
                    )}
                    {msg.content && (
                      <div style={{ padding: msg.messageType && msg.messageType !== 'text' ? '4px 8px' : '0' }}>
                        {msg.content}
                      </div>
                    )}
                  </div>

                  <span style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                    marginRight: isOutgoing ? '4px' : '0',
                    marginLeft: !isOutgoing ? '4px' : '0'
                  }}>
                    {formatTime(msg.createdAt)}
                  </span>

                  {/* Individual Delete Button (only outgoing messages can be deleted) */}
                  {isOutgoing && msg._id && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Delete this message?")) {
                          onDeleteMessage(msg._id);
                        }
                      }}
                      className="message-delete-btn"
                      title="Delete message"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Real-time typing indicators in-bubble */}
        {currentTypingUsers.map(tu => (
          <div 
            key={tu.senderId}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignSelf: 'flex-start',
              alignItems: 'flex-start',
              maxWidth: '70%'
            }}
          >
            {activeChat === null && (
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                marginBottom: '4px',
                marginLeft: '8px'
              }}>
                {tu.username}
              </span>
            )}
            
            <div 
              className="message-bubble message-incoming"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px'
              }}
            >
              <div className="typing-dots">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Panel */}
      <form 
        onSubmit={handleSend}
        style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--panel-border)',
          background: 'var(--composer-bg)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          transition: 'background 0.3s ease'
        }}
      >
        <button 
          type="button"
          onClick={handleMediaClick}
          className="glass-btn glass-btn-secondary"
          style={{ width: '46px', height: '46px', padding: 0, borderRadius: '10px', flexShrink: 0 }}
          title="Attach photo or video"
        >
          <Paperclip size={18} />
        </button>
        <input 
          type="file"
          ref={mediaInputRef}
          accept="image/*,video/*"
          onChange={handleMediaSelect}
          style={{ display: 'none' }}
        />
        <input 
          type="text" 
          placeholder={activeChat === null ? "Send a message to global room..." : `Message @${activeChat.username}...`}
          value={inputText}
          onChange={handleInputChange}
          className="glass-input"
          style={{ flex: 1, fontSize: '0.92rem' }}
          autoFocus
        />
        <button 
          type="submit" 
          className="glass-btn" 
          style={{ width: '46px', height: '46px', padding: 0, borderRadius: '10px', flexShrink: 0 }}
          disabled={!inputText.trim()}
        >
          <Send size={18} />
        </button>
      </form>

      {/* Lightbox Zoom Modal */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'zoom-out',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <button 
            onClick={() => setZoomedImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
          <img 
            src={zoomedImage} 
            alt="Expanded view" 
            style={{
              maxWidth: '95%',
              maxHeight: '95%',
              borderRadius: '8px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              objectFit: 'contain'
            }}
          />
        </div>
      )}

    </div>
  );
};
