import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: { toDate: () => Date };
  type: 'text' | 'image' | 'system';
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: { toDate: () => Date };
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  status: string;
  email?: string;
}

const DEFAULT_USERS: Record<string, UserProfile> = {
  'user-1': { uid: 'user-1', displayName: 'Alex Rivera', photoURL: 'https://i.pravatar.cc/150?u=user-1', status: 'online' },
  'user-2': { uid: 'user-2', displayName: 'Sarah Chen', photoURL: 'https://i.pravatar.cc/150?u=user-2', status: 'online' },
  'user-3': { uid: 'user-3', displayName: 'Jordan Sky', photoURL: 'https://i.pravatar.cc/150?u=user-3', status: 'offline' },
  'user-4': { uid: 'user-4', displayName: 'Jamie Fox', photoURL: 'https://i.pravatar.cc/150?u=user-4', status: 'online' },
};

export function useChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users] = useState<Record<string, UserProfile>>(DEFAULT_USERS);

  // Load conversations from local storage
  useEffect(() => {
    if (!user) return;
    
    const loadData = () => {
      const savedConvs = localStorage.getItem(`pulse_convs_${user.uid}`);
      if (savedConvs) {
        setConversations(JSON.parse(savedConvs).map((c: any) => ({
          ...c,
          updatedAt: { toDate: () => new Date(c.updatedAt) }
        })));
      } else {
        // Initial mock conversations
        const initial = [
          { 
            id: 'conv-1', 
            participants: [user.uid, 'user-2'], 
            lastMessage: 'Hey! How is the new app coming along?', 
            updatedAt: { toDate: () => new Date() } 
          },
          { 
            id: 'conv-2', 
            participants: [user.uid, 'user-3'], 
            lastMessage: 'Let me know when you are free for a call.', 
            updatedAt: { toDate: () => new Date(Date.now() - 3600000) } 
          }
        ];
        setConversations(initial);
        localStorage.setItem(`pulse_convs_${user.uid}`, JSON.stringify(initial.map(c => ({...c, updatedAt: c.updatedAt.toDate().toISOString()}))));
      }
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [user]);

  // Load messages for active chat
  useEffect(() => {
    if (!activeChat || !user) {
      setMessages([]);
      return;
    }

    const loadMsgs = () => {
      const savedMsgs = localStorage.getItem(`pulse_msgs_${activeChat}`);
      if (savedMsgs) {
        setMessages(JSON.parse(savedMsgs).map((m: any) => ({
          ...m,
          createdAt: { toDate: () => new Date(m.createdAt) }
        })));
      } else {
        setMessages([]);
      }
    };

    loadMsgs();
    window.addEventListener('storage', loadMsgs);
    return () => window.removeEventListener('storage', loadMsgs);
  }, [activeChat, user]);

  const sendMessage = async (text: string) => {
    if (!user || !activeChat || !text.trim()) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.uid,
      text: text.trim(),
      createdAt: { toDate: () => new Date() },
      type: 'text'
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem(`pulse_msgs_${activeChat}`, JSON.stringify(updatedMessages.map(m => ({...m, createdAt: m.createdAt.toDate().toISOString()}))));

    // Update conversation last message
    const updatedConvs = conversations.map(c => {
      if (c.id === activeChat) {
        return {
          ...c,
          lastMessage: text.trim(),
          updatedAt: { toDate: () => new Date() }
        };
      }
      return c;
    });
    setConversations(updatedConvs);
    localStorage.setItem(`pulse_convs_${user.uid}`, JSON.stringify(updatedConvs.map(c => ({...c, updatedAt: c.updatedAt.toDate().toISOString()}))));
  };

  const startConversation = async (otherUserId: string) => {
    if (!user) return;

    const existing = conversations.find(c => c.participants.includes(otherUserId));
    if (existing) {
      setActiveChat(existing.id);
      return;
    }

    const newConv: Conversation = {
      id: `conv-${Math.random().toString(36).substr(2, 9)}`,
      participants: [user.uid, otherUserId],
      lastMessage: 'Started a new conversation',
      updatedAt: { toDate: () => new Date() }
    };

    const updatedConvs = [newConv, ...conversations];
    setConversations(updatedConvs);
    localStorage.setItem(`pulse_convs_${user.uid}`, JSON.stringify(updatedConvs.map(c => ({...c, updatedAt: c.updatedAt.toDate().toISOString()}))));
    setActiveChat(newConv.id);
  };

  return {
    conversations,
    activeChat,
    setActiveChat,
    messages,
    users,
    sendMessage,
    startConversation
  };
}
