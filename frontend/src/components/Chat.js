import React, { useEffect, useRef } from 'react';

const Chat = ({ messages, isLoading }) => {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg">
      <div className="px-6 py-5 bg-white text-gray-900 border-b border-gray-700 shadow-lg">
        <h3 className="text-lg font-bold tracking-tight">AI Assistant</h3>
        <p className="text-xs opacity-90 mt-1">Context-aware conversations</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="text-6xl mb-4 opacity-60">💬</div>
            <h4 className="text-lg font-bold text-white mb-2">Start a conversation</h4>
            <p className="text-sm leading-relaxed text-gray-400">Draw on the canvas, record your explanation, and ask questions!</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex flex-col gap-2 p-4 rounded-lg border backdrop-blur-sm animate-[slideIn_0.3s_ease] shadow-lg ${
              message.role === 'user' 
                ? 'bg-gradient-to-br from-blue-600 to-cyan-600 border-cyan-400 ml-4 text-white' 
                : 'bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-500 mr-4 text-white'
            }`}
          >
            <div className="flex justify-between items-center gap-3">
              <span className="text-xs font-bold">
                {message.role === 'user' ? '👤 You' : '🤖 AI'}
              </span>
              <span className="text-[11px] opacity-70">{message.timestamp}</span>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col gap-2 p-4 rounded-lg border bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-500 mr-4 shadow-lg">
            <div className="flex justify-between items-center gap-3">
              <span className="text-xs font-bold text-white">🤖 AI</span>
            </div>
            <div className="flex gap-1 py-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]"></span>
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both] [animation-delay:-0.16s]"></span>
              <span className="w-2 h-2 bg-pink-400 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both] [animation-delay:-0.32s]"></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

export default Chat;
