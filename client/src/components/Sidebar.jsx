import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Globe, MessageSquare, Shield, Camera, Sun, Moon, Plus, Search, X } from 'lucide-react';

// Simple helper to generate a consistent color based on a username string
const getAvatarColorClass = (username) => {
  const colors = [
    'linear-gradient(135deg, #f87171 0%, #dc2626 100%)', // red
    'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', // orange
    'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', // amber
    'linear-gradient(135deg, #34d399 0%, #059669 100%)', // emerald
    'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)', // cyan
    'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)', // blue
    'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)', // indigo
    'linear-gradient(135deg, #c084fc 0%, #9333ea 100%)', // purple
    'linear-gradient(135deg, #f472b6 0%, #db2777 100%)', // pink
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const Sidebar = ({ 
  users, 
  onlineUserIds, 
  activeChat, 
  setActiveChat, 
  unreadMap,
  clearUnread,
  theme,
  toggleTheme,
  accentColor,
  setAccentColor,
  allUsers = [],
  onStartNewChat
}) => {
  const { user, logout, updateAvatar } = useAuth();
  const fileInputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleUserSelect = (targetUser) => {
    setActiveChat(targetUser);
    clearUnread(targetUser._id);
  };

  const handleGlobalSelect = () => {
    setActiveChat(null);
    clearUnread('global');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Maximum size is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await updateAvatar(reader.result);
      } catch (err) {
        alert("Failed to update avatar: " + err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRight: '1px solid var(--panel-border)',
      background: 'var(--sidebar-bg)',
      overflow: 'hidden',
      transition: 'background 0.3s ease'
    }}>
      
      {/* Current User Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--panel-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--sidebar-header-bg)',
        transition: 'background 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            onClick={handleAvatarClick}
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              cursor: 'pointer',
              overflow: 'hidden',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: getAvatarColorClass(user?.username || 'A'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'white',
                textTransform: 'uppercase'
              }}>
                {user?.username?.charAt(0)}
              </div>
            )}
            
            {/* Hover Camera Icon overlay */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
            >
              <Camera size={14} color="white" />
            </div>
          </div>

          <input 
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{user?.username}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span className="status-dot status-online" style={{ width: '6px', height: '6px' }}></span> Active Now
            </span>
          </div>
        </div>
        
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={toggleTheme} 
              className="glass-btn glass-btn-secondary" 
              style={{ padding: '8px', borderRadius: '8px' }}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button 
              onClick={logout} 
              className="glass-btn glass-btn-secondary" 
              style={{ padding: '8px', borderRadius: '8px' }}
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
      </div>

      {/* Main Navigation Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Global Chat Item */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '12px', display: 'block', marginBottom: '8px' }}>
            Channels
          </span>
          <div 
            onClick={handleGlobalSelect}
            className={`glass-panel-interactive`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              borderRadius: '10px',
              cursor: 'pointer',
              background: activeChat === null ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              border: activeChat === null ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid transparent',
              color: activeChat === null ? 'white' : 'var(--text-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: activeChat === null ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <Globe size={16} />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 550 }}>Global Chatroom</span>
            </div>
            
            {unreadMap['global'] > 0 && (
              <span style={{
                background: 'var(--secondary-gradient)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '20px',
                boxShadow: '0 2px 5px rgba(236,72,153,0.3)'
              }}>
                {unreadMap['global']}
              </span>
            )}
          </div>
        </div>

        {/* Direct Messages List */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Direct Messages
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="glass-btn glass-btn-secondary"
              style={{
                width: '24px',
                height: '24px',
                padding: 0,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Add new chat member"
            >
              <Plus size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {users.length === 0 ? (
              <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center' }}>
                No other users found
              </div>
            ) : (
              users.map(u => {
                const isOnline = onlineUserIds.includes(u._id);
                const isActive = activeChat?._id === u._id;
                const unreadCount = unreadMap[u._id] || 0;

                return (
                  <div
                    key={u._id}
                    onClick={() => handleUserSelect(u)}
                    className="glass-panel-interactive"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                      border: isActive ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid transparent',
                      color: isActive ? 'white' : 'var(--text-primary)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        {u.avatar ? (
                          <img 
                            src={u.avatar} 
                            alt={u.username}
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '8px', 
                              objectFit: 'cover',
                              display: 'block'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: getAvatarColorClass(u.username),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: 'white',
                            textTransform: 'uppercase'
                          }}>
                            {u.username.charAt(0)}
                          </div>
                        )}
                        <span 
                          className={`status-dot ${isOnline ? 'status-online' : 'status-offline'}`}
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: '10px',
                            height: '10px',
                            border: '2px solid #0f0a19',
                            borderRadius: '50%'
                          }}
                        />
                      </div>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: isActive ? 600 : 500, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap'
                      }}>
                        {u.username}
                      </span>
                    </div>

                    {unreadCount > 0 && (
                      <span style={{
                        background: 'var(--secondary-gradient)',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '20px',
                        boxShadow: '0 2px 5px rgba(236,72,153,0.3)'
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Accent Color Customizer Panel */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--panel-border)',
        background: 'var(--sidebar-header-bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'background 0.3s ease'
      }}>
        <span style={{ 
          fontSize: '0.65rem', 
          fontWeight: 700, 
          color: 'var(--text-muted)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em' 
        }}>
          Accent Theme
        </span>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['violet', 'emerald', 'cyan', 'rose', 'amber'].map(color => {
            const colorsMap = {
              violet: '#8b5cf6',
              emerald: '#10b981',
              cyan: '#06b6d4',
              rose: '#f43f5e',
              amber: '#f59e0b'
            };
            const isActive = accentColor === color;
            return (
              <button
                key={color}
                onClick={() => setAccentColor(color)}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: colorsMap[color],
                  border: isActive ? '2px solid white' : '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  boxShadow: isActive ? `0 0 10px ${colorsMap[color]}` : 'none',
                  transform: isActive ? 'scale(1.2)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  padding: 0
                }}
                title={`Switch to ${color} theme`}
              />
            );
          })}
        </div>
      </div>

      {/* Footer Branding Info */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--panel-border)',
        background: 'var(--sidebar-header-bg)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        transition: 'background 0.3s ease'
      }}>
        <Shield size={14} />
        <span>© 2026 Vinay Yadav</span>
      </div>

      {/* Start Chat Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(3, 7, 18, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          color: 'var(--text-primary)'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            background: 'var(--panel-bg)',
            border: '1px solid var(--panel-border)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '80vh',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Start a Conversation</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchQuery('');
                }}
                className="glass-btn glass-btn-secondary"
                style={{ padding: '6px', borderRadius: '6px' }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input"
                style={{ width: '100%', paddingLeft: '38px', fontSize: '0.88rem' }}
              />
            </div>

            {/* Modal User List */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px',
              paddingRight: '4px'
            }}>
              {allUsers
                .filter(u => u._id !== user._id && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(u => (
                  <div
                    key={u._id}
                    onClick={() => {
                      onStartNewChat(u);
                      setIsModalOpen(false);
                      setSearchQuery('');
                    }}
                    className="glass-panel-interactive"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    {u.avatar ? (
                      <img 
                        src={u.avatar} 
                        alt={u.username}
                        style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: getAvatarColorClass(u.username),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {u.username.charAt(0)}
                      </div>
                    )}
                    <span style={{ fontSize: '0.9rem', fontWeight: 550 }}>{u.username}</span>
                  </div>
                ))}
              {allUsers.filter(u => u._id !== user._id && u.username.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', padding: '20px 0', fontStyle: 'italic' }}>
                  No matches found
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
