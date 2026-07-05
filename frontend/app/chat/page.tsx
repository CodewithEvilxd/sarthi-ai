"use client";
import React from 'react';
import ChatWindow from '@/components/ChatWindow';

export default function ChatPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center md:text-left space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-100">Consult Sarthi Assistant</h1>
        <p className="text-slate-400 text-sm">
          Speak directly to Sarthi's Chief Coordinating Agent, who automatically routes your query to health or environmental sub-agents and retrieves guidelines using RAG.
        </p>
      </div>
      <ChatWindow />
    </div>
  );
}
