import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    
    // Simulate a brief delay for a better UI feel
    setTimeout(() => {
      login();
      setIsLoggingIn(false);
    }, 1000);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-fuchsia-500 to-rose-400 p-6 text-white text-center">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white/30 backdrop-blur-3xl rounded-[40px] p-12 shadow-2xl border border-white/40"
      >
        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[32px] flex items-center justify-center mb-8 shadow-2xl mx-auto border border-white/30">
          <MessageSquare size={48} className="text-white fill-white" />
        </div>
        
        <h1 className="text-6xl font-black tracking-tighter mb-4 italic">Pulse</h1>
        <p className="text-lg text-white/90 font-bold uppercase tracking-widest mb-10">Modern Messaging</p>

        <motion.button
          whileHover={{ scale: isLoggingIn ? 1 : 1.05, backgroundColor: isLoggingIn ? 'white' : 'rgba(255, 255, 255, 0.9)' }}
          whileTap={{ scale: isLoggingIn ? 1 : 0.95 }}
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full flex items-center justify-center gap-3 bg-white text-indigo-600 px-8 py-5 rounded-3xl font-black text-lg shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <LogIn size={24} />
          )}
          {isLoggingIn ? 'SIGNING IN...' : 'GET STARTED'}
        </motion.button>
        
        <div className="mt-8 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
          Demo Mode (Local Storage)
        </div>
      </motion.div>
      
      <div className="absolute bottom-10 flex gap-6 text-white/40 text-[10px] font-bold uppercase tracking-widest">
        <span>Fast</span>
        <div className="w-1 h-1 bg-white/40 rounded-full my-auto"></div>
        <span>Secure</span>
        <div className="w-1 h-1 bg-white/40 rounded-full my-auto"></div>
        <span>Glass</span>
      </div>
    </div>
  );
}
