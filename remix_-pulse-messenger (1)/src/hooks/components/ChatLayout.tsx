import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, LogOut, MessageSquare, Search, Phone, Video, Info, UserPlus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { useChat, UserProfile } from '../hooks/useChat';
import { cn } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function ChatLayout() {
  const { user, logout } = useAuth();
  const { conversations, activeChat, setActiveChat, messages, users, sendMessage, startConversation } = useChat();
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await sendMessage(inputText);
    setInputText('');
    setSuggestions([]);
  };

  const getSmartSuggestions = async () => {
    if (messages.length === 0) return;
    const lastMsgs = messages.slice(-5).map(m => `${users[m.senderId]?.displayName || 'Unknown'}: ${m.text}`).join('\n');
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on the following chat history, suggest 3 short, relevant, natural-sounding replies for ${user?.displayName}.
        Chat History:
        ${lastMsgs}
        
        Provide only the suggestions as a JSON array of strings.`,
        config: { responseMimeType: 'application/json' }
      });
      
      const res = JSON.parse(response.text || '[]');
      setSuggestions(res.slice(0, 3));
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = (Object.values(users) as UserProfile[]).filter(u => 
    u.uid !== user?.uid && 
    (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeConversation = conversations.find(c => c.id === activeChat);
  const chatPartnerId = activeConversation?.participants.find(p => p !== user?.uid);
  const chatPartner = chatPartnerId ? users[chatPartnerId] : null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-600 via-fuchsia-500 to-rose-400 p-4 md:p-6 overflow-hidden font-sans">
      <div className="flex-1 bg-white/60 backdrop-blur-2xl rounded-[32px] md:rounded-[40px] shadow-2xl border border-white/40 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "border-r border-white/30 flex flex-col transition-all duration-300",
          isSidebarOpen ? "w-[320px] md:w-[360px]" : "w-0 overflow-hidden"
        )}>
          {/* Sidebar Header */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <img src={user?.photoURL || ''} className="w-12 h-12 rounded-full border-2 border-white/50 shadow-sm" alt="Profile" />
               <div className="hidden md:block">
                 <h2 className="font-bold text-slate-900 tracking-tight">Chats</h2>
                 <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{user?.displayName}</p>
               </div>
            </div>
            <div className="flex gap-2">
              <button onClick={logout} className="p-2 hover:bg-white/40 rounded-full text-slate-700 transition-colors" title="Logout">
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-4 top-3 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search messages..." 
                className="w-full bg-white/40 border border-white/20 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none placeholder-slate-500 text-slate-800 text-sm shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations or User Search Results */}
          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            {searchQuery ? (
              <div>
                <h3 className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Users</h3>
                {filteredUsers.map(u => (
                  <button 
                    key={u.uid}
                    onClick={() => {
                      startConversation(u.uid);
                      setSearchQuery('');
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/30 rounded-3xl transition-all group"
                  >
                    <img src={u.photoURL} className="w-12 h-12 rounded-2xl border border-white" alt={u.displayName} />
                    <div className="text-left">
                      <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{u.displayName}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{u.status}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                {conversations.map(conv => {
                  const partnerId = conv.participants.find(p => p !== user?.uid);
                  const partner = partnerId ? users[partnerId] : null;
                  if (!partner) return null;

                  return (
                    <button 
                      key={conv.id}
                      onClick={() => setActiveChat(conv.id)}
                      className={cn(
                        "w-full px-4 py-3 flex items-center gap-3 transition-all rounded-3xl mb-1",
                        activeChat === conv.id 
                          ? "bg-white/50 border border-white/40 shadow-sm" 
                          : "hover:bg-white/30 border border-transparent"
                      )}
                    >
                      <div className="relative">
                         <img src={partner.photoURL} className="w-12 h-12 rounded-2xl border border-white shadow-sm" alt={partner.displayName} />
                         {partner.status === 'online' && (
                           <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                         )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className="font-bold text-slate-900 truncate">{partner.displayName}</p>
                          {conv.updatedAt && (
                            <p className="text-[10px] font-bold text-indigo-600 uppercase">
                               {format(conv.updatedAt.toDate(), 'HH:mm')}
                            </p>
                          )}
                        </div>
                        <p className={cn(
                          "text-xs truncate",
                          activeChat === conv.id ? "text-slate-800 font-semibold" : "text-slate-500"
                        )}>{conv.lastMessage}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-white/20 relative overflow-hidden backdrop-blur-sm">
          {activeChat && chatPartner ? (
            <>
              {/* Chat Header */}
              <header className="px-6 md:px-8 py-4 md:py-6 border-b border-white/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 hover:bg-white/40 rounded-full transition-colors">
                    <MessageSquare size={20} />
                  </button>
                  <div className="flex items-center gap-4">
                    <img src={chatPartner.photoURL} className="w-12 h-12 rounded-2xl border border-white shadow-sm" alt={chatPartner.displayName} />
                    <div>
                      <h1 className="text-xl font-bold text-slate-900 leading-tight">{chatPartner.displayName}</h1>
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-2 h-2 rounded-full", chatPartner.status === 'online' ? "bg-green-500" : "bg-slate-400")}></div>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{chatPartner.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <button className="p-3 bg-white/40 hover:bg-white/60 rounded-2xl border border-white/40 shadow-sm transition-all text-slate-700">
                    <Phone size={18} />
                  </button>
                  <button className="p-3 bg-white/40 hover:bg-white/60 rounded-2xl border border-white/40 shadow-sm transition-all text-slate-700">
                    <Video size={18} />
                  </button>
                  <button className="p-3 bg-white/40 hover:bg-white/60 rounded-2xl border border-white/40 shadow-sm transition-all text-slate-700 font-bold text-lg leading-none">
                    <Info size={18} />
                  </button>
                </div>
              </header>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                 {messages.map((msg, i) => {
                   const isMe = msg.senderId === user?.uid;
                   const showAvatar = !isMe && (i === 0 || messages[i-1].senderId !== msg.senderId);
                   
                   return (
                     <div key={msg.id} className={cn("flex items-end gap-3", isMe ? "flex-row-reverse self-end" : "justify-start")}>
                        {!isMe && (
                          <div className="w-9 h-9 flex-shrink-0">
                            {showAvatar && <img src={chatPartner.photoURL} className="w-9 h-9 rounded-xl border border-white bg-blue-100" alt="" />}
                          </div>
                        )}
                        <div className="flex flex-col space-y-1 max-w-[75%] md:max-w-[70%]">
                          <div className={cn(
                            "p-4 shadow-sm backdrop-blur-md transition-all",
                            isMe 
                              ? "bg-indigo-600 text-white rounded-l-3xl rounded-br-3xl rounded-tr-md shadow-lg shadow-indigo-200/50" 
                              : "bg-white/80 rounded-r-3xl rounded-bl-3xl rounded-tl-md border border-white/60 text-slate-800"
                          )}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                          </div>
                          <span className={cn(
                            "text-[10px] text-slate-500 font-medium px-2",
                            isMe ? "text-right" : "text-left"
                          )}>
                            {msg.createdAt ? format(msg.createdAt.toDate(), 'HH:mm') : ''}
                          </span>
                        </div>
                     </div>
                   );
                 })}
              </div>

              {/* AI Suggestions */}
              <div className="px-8 py-2 flex flex-wrap gap-2 items-center">
                <button 
                  onClick={getSmartSuggestions}
                  className="px-4 py-2 bg-slate-900 text-white rounded-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider shadow-lg hover:bg-slate-800 transition-all"
                >
                  <Sparkles size={14} className="text-purple-400" /> Suggestions
                </button>
                <AnimatePresence>
                  {suggestions.map((s, i) => (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      key={i}
                      onClick={() => setInputText(s)}
                      className="px-4 py-2 bg-white/40 text-slate-700 rounded-full text-xs font-bold hover:bg-white/60 transition-all border border-white/40 shadow-sm"
                    >
                      {s}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              {/* Input */}
              <footer className="p-4 md:p-8 flex items-center gap-4">
                <div className="flex items-center gap-2 pr-3 md:border-r border-white/20">
                  <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/40 text-slate-700 transition-colors">
                    <UserPlus size={20} />
                  </button>
                </div>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Write your message..."
                    className="w-full bg-white/60 backdrop-blur-md border border-white/40 rounded-[28px] py-4 px-6 focus:outline-none text-slate-800 shadow-sm placeholder-slate-400"
                  />
                  <div className="absolute right-4 top-3">
                    <button 
                      onClick={handleSend}
                      disabled={!inputText.trim()}
                      className={cn(
                        "p-2 rounded-full transition-all",
                        inputText.trim() ? "text-indigo-600 hover:scale-110" : "text-slate-300"
                      )}
                    >
                      <Send size={20} className="fill-current" />
                    </button>
                  </div>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
               <div className="w-24 h-24 bg-white/30 backdrop-blur-xl border border-white/40 rounded-[32px] flex items-center justify-center shadow-2xl">
                  <MessageSquare size={48} className="text-indigo-600 fill-indigo-600/10" />
               </div>
               <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Choose a chat</h2>
                  <p className="text-slate-600 font-medium max-w-xs mx-auto">Select a friend to start chatting or search for someone new to Pulse.</p>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
