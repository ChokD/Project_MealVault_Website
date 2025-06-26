import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';

const initialMessage = { 
  sender: 'ai', 
  text: 'สวัสดีค่ะ มีอะไรให้ช่วยเกี่ยวกับเมนูอาหาร หรือวัตถุดิบไหมคะ?' 
};

function ChatbotPage() {
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/chatbot/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const aiMessage = { sender: 'ai', text: data.reply };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = { sender: 'ai', text: `ขออภัยค่ะ เกิดข้อผิดพลาด: ${error.message}` };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearChat = () => {
    setMessages([initialMessage]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20 flex flex-col items-center w-full">
        <div className="w-full max-w-3xl flex-grow flex flex-col bg-white shadow-lg rounded-t-xl my-4">
          
          {/* --- ส่วนหัวของ Chat --- */}
          <div className="p-4 border-b flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Mealer AI</h1>
            <button 
              onClick={handleClearChat}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              title="เริ่มต้นการสนทนาใหม่"
            >
              ล้างแชท
            </button>
          </div>
          
          {/* --- ส่วนแสดงข้อความ (ที่เคยหายไป) --- */}
          <div className="flex-grow p-6 space-y-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end space-x-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${msg.sender === 'user' ? 'bg-green-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                  <p style={{whiteSpace: 'pre-wrap'}}>{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl max-w-lg bg-gray-200 text-gray-800 rounded-bl-none">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* --- ส่วนพิมพ์ข้อความ (ที่เคยหายไป) --- */}
          <div className="p-4 bg-gray-100 border-t rounded-b-xl">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="ลองถามอะไรสักหน่อยสิ..."
                disabled={isLoading}
              />
              <button onClick={handleSend} disabled={isLoading} className="bg-green-500 text-white font-bold rounded-full px-6 py-2 hover:bg-green-600 disabled:bg-gray-400 transition-colors">
                ส่ง
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ChatbotPage;