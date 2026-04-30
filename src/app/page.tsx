"use client";

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from "react";

export default function ChatPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  // Essa função garante que mandamos apenas o texto para a IA, evitando lixo de ferramentas
  onToolCall: ({ toolCall }) => {
    console.log(">>> [CLIENT] Chamando ferramenta:", toolCall.toolName);
  },
  onError: (err) => {
    console.error("❌ ERRO NO CLIENTE:", err);
  },
});

  // Auto-scroll para as novas mensagens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 p-4 text-white shadow-lg">
        <h1 className="font-bold text-emerald-400">Luna | Lumière V2</h1>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10">Diga um "Oi" para a Luna iniciar...</div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-xl shadow-sm ${
              m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200'
            }`}>
              <span className="whitespace-pre-wrap">{m.content}</span>
            </div>
          </div>
        ))}
        {isLoading && <div className="text-xs text-slate-400 animate-pulse">Luna está pensando...</div>}
      </main>

      <footer className="p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
          <input
            className="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-emerald-500 text-slate-900"
            value={input}
            onChange={handleInputChange}
            placeholder="Fale com a Luna..."
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-6 rounded-xl font-medium transition-colors"
          >
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
}
