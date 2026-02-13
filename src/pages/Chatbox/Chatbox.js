import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { FiSend, FiUser, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import DashboardNav from '../../components/DashboardNav';
import './Chatbox.css';
import botAvatar from '../../assets/catch-up logo.png'; 
import { useTranslation } from 'react-i18next'; 
import { supabase } from '../../supabase';

const BOT_AVATAR = botAvatar; 

const Chatbox = () => {
  const navigate = useNavigate(); 
  const { t } = useTranslation(); 
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [medicalContext, setMedicalContext] = useState(null);
  const [firstName, setFirstName] = useState(localStorage.getItem('userName') || "Friend");
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [messages, setMessages] = useState(() => {
    const savedChats = localStorage.getItem('chat_history');
    return savedChats ? JSON.parse(savedChats) : [{
        id: 1, sender: 'bot', type: 'text',
        content: `Hi ${localStorage.getItem('userName') || "Friend"}! I'm CatchUp. How can I help you today?`
    }];
  });

  const downloadImage = async (path) => {
    if (!path) return;
    if (path.startsWith('http')) {
        setAvatarUrl(path);
        return;
    }
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) throw error;
      setAvatarUrl(URL.createObjectURL(data));
    } catch (error) {
      console.log('Error downloading image: ', error.message);
    }
  };

  useEffect(() => {
    const fetchContext = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
            const { data, error } = await supabase
                .from('profiles')
                .select('first_name, conditions, medications, allergies, avatar_url')
                .eq('id', session.user.id)
                .single();

            if (data && !error) {
                if (data.first_name) {
                    const realName = data.first_name;
                    setFirstName(realName);
                    localStorage.setItem('userName', realName);
                    
                    setMessages(prevMessages => {
                        const firstMsg = prevMessages[0];
                        if (firstMsg && firstMsg.id === 1 && firstMsg.content.includes("Friend")) {
                            return [{ ...firstMsg, content: `Hi ${realName}! I'm CatchUp. How can I help you today?` }, ...prevMessages.slice(1)];
                        }
                        return prevMessages;
                    });
                }

                if (data.avatar_url) {
                    downloadImage(data.avatar_url);
                }

                setMedicalContext({
                    name: data.first_name,
                    conditions: data.conditions || [],
                    medications: data.medications || "None",
                    allergies: data.allergies || "None"
                });
            }
        }
    };
    fetchContext();
  }, []);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleClearChat = () => {
    if(window.confirm(t('confirm_clear') || "Start a new conversation?")) {
        const resetMessages = [{
          id: Date.now(), sender: 'bot', type: 'text',
          content: `${t('fresh_start') || "Fresh start! 🌿 How can I help you,"} ${firstName}?`
        }];
        setMessages(resetMessages);
        localStorage.setItem('chat_history', JSON.stringify(resetMessages));
    }
  };

  // ✅ UPDATED: Dynamic Backend Connection
  const callSafeBackend = async (userMessage) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Use the environment variable from Vercel, or fallback to local for dev
      const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5050";
      
      const response = await fetch(`${backendBaseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            message: userMessage, 
            userId: userId, 
            context: medicalContext 
          }), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        return errorData.reply || "The server is having trouble responding.";
      }

      const data = await response.json();
      return data.reply || "I'm silent right now.";
    } catch (error) {
      console.error("Chat Error:", error);
      return "Unable to connect to CatchUp. Please ensure your internet is active or try again later.";
    }
  };

  const handleSend = async (textOverride) => {
    if (isTyping) return;
    const textToSend = textOverride || inputText;
    if (!textToSend.trim()) return;

    const newUserMsg = { id: Date.now(), sender: 'user', type: 'text', content: textToSend };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputText('');
    setIsTyping(true);

    const aiResponseText = await callSafeBackend(textToSend);

    const newBotMsg = { id: Date.now() + 1, sender: 'bot', type: 'text', content: aiResponseText };
    setMessages((prev) => [...prev, newBotMsg]);
    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="chat-page-container">
      <DashboardNav />
      <div className="chat-interface-wrapper">
        <div className="chat-header">
           <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
               <button className="mobile-back-btn" onClick={() => navigate(-1)}><FiArrowLeft size={24} /></button>
               <div>
                   <h2 style={{margin:0, fontSize:'18px'}}>{t('assistant_title') || "CatchUp Assistant"}</h2>
                   <div style={{fontSize:'12px', color:'#4CAF50'}}>● {t('online') || "Online"} </div>
               </div>
           </div>
           <button onClick={handleClearChat} style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)'}}>
               <FiTrash2 size={20} />
           </button>
        </div>

        <div className="messages-container">
           {messages.map((msg) => (
             <div key={msg.id} className={`message-row ${msg.sender === 'user' ? 'row-user' : 'row-bot'}`}>
                {msg.sender === 'bot' && <div className="bot-avatar-circle"><img src={BOT_AVATAR} alt="Bot" /></div>}
                
                <div className="message-content-wrapper">
                   <div className={`text-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`} style={{whiteSpace: 'pre-wrap'}}>
                        {msg.content}
                   </div>
                </div>

                {msg.sender === 'user' && (
                    <div className="user-avatar-circle" style={{ overflow: 'hidden', padding: 0 }}>
                        {avatarUrl ? (
                             <img src={avatarUrl} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                             <FiUser style={{ padding: '8px' }} />
                        )}
                    </div>
                )}
             </div>
           ))}
           {isTyping && (
               <div className="message-row row-bot">
                   <div className="bot-avatar-circle"><img src={BOT_AVATAR} alt="Bot" /></div>
                   <div className="text-bubble bubble-bot" style={{fontStyle:'italic', color:'#888'}}>{t('thinking') || "Thinking..."}</div>
               </div>
           )}
           <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
           <div className="input-box-wrapper">
             <input type="text" placeholder={t('type_message') || "Type a message..."} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={handleKeyPress} disabled={isTyping} />
             <button className="send-btn" onClick={() => handleSend()} disabled={isTyping}><FiSend size={20} /></button>
           </div>
           <p className="chat-disclaimer">{t('chat_disclaimer')}</p>
        </div>
      </div>
    </div>
  );
};

export default Chatbox;