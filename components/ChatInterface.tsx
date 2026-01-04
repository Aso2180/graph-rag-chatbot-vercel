'use client';

import { useState, useEffect } from 'react';
import LegalDisclaimer from './LegalDisclaimer';
import MemberDashboard from './MemberDashboard';
import { validateUploadPermission } from '@/lib/member/validation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: {
    graphSources: number;
    webSources: number;
  };
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useGraphContext, setUseGraphContext] = useState(true);
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const messageContent = input; // Save input value before clearing
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          useGraphContext,
          useWebSearch
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          sources: data.sources
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 統合された検証システムを使用
    const fileSizeMB = file.size / (1024 * 1024);
    const validationResult = validateUploadPermission(memberEmail, file.type, fileSizeMB);
    
    if (!validationResult.isValid) {
      alert(validationResult.error);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('memberEmail', memberEmail);

    try {
      setIsLoading(true);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setUploadedFiles(prev => [...prev, data.fileName]);
        setShowUpload(false);
        
        // システムメッセージを追加
        const systemMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `📄 PDF「${file.name}」のアップロードが完了しました。文書の内容はGraph RAG検索で利用可能になります。`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, systemMessage]);
      } else {
        alert(data.error || 'アップロードに失敗しました。');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('アップロード中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
      // ファイル入力をリセット
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <LegalDisclaimer />
      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl font-bold text-blue-600 bg-yellow-200 px-2">GAIS [UPDATED]</div>
              <h1 className="text-2xl font-bold bg-green-200">AI使用上の法的リスク分析 GraphRAG Chatbot</h1>
            </div>
            <p className="text-gray-600 text-sm">生成AI協会会員向け法的リスク検討支援システム</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-3 py-1 bg-[#1e73be] text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              📄 PDF Upload
            </button>
            {memberEmail && (
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                📊 Dashboard
              </button>
            )}
          </div>
        </div>
        
        {showUpload && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold mb-3">PDF文書のアップロード</h3>
            
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                GAIS会員メールアドレス *
              </label>
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="例: member@example.com"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1e73be] focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                PDFファイル *
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="w-full text-sm"
              />
            </div>
            
            <p className="text-xs text-gray-600 mt-1">
              法的資料、規制文書、ガイドライン等をアップロードしてGraph RAGに追加できます（最大10MB）
            </p>
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="mb-3 p-2 bg-blue-50 rounded">
            <h4 className="text-xs font-semibold text-blue-800">アップロード済み文書: {uploadedFiles.length}件</h4>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm">
          <label htmlFor="graph-context-toggle" className="inline-flex items-center">
            <input
              id="graph-context-toggle"
              name="graphContext"
              type="checkbox"
              checked={useGraphContext}
              onChange={(e) => setUseGraphContext(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Graph RAG検索</span>
          </label>
          
          <label htmlFor="web-search-toggle" className="inline-flex items-center">
            <input
              id="web-search-toggle"
              name="webSearch"
              type="checkbox"
              checked={useWebSearch}
              onChange={(e) => setUseWebSearch(e.target.checked)}
              className="form-checkbox h-4 w-4 text-green-600"
            />
            <span className="ml-2">Web検索</span>
          </label>
        </div>

        {showDashboard && memberEmail && (
          <div className="mb-3 p-4 bg-white rounded-lg shadow">
            <MemberDashboard memberEmail={memberEmail} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg shadow-inner p-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>法的リスク分析について何でもお聞きください。</p>
            <p className="text-sm mt-2">
              Graph RAG: {useGraphContext ? '✅' : '❌'} | Web検索: {useWebSearch ? '✅' : '❌'}
            </p>
            <p className="text-xs mt-2 text-gray-400">
              PDFをアップロードして専門知識を拡張できます
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 shadow'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.sources && message.role === 'assistant' && (
                    <div className="flex gap-2 mt-2 text-xs opacity-70">
                      {message.sources.graphSources > 0 && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          📚 Graph: {message.sources.graphSources}
                        </span>
                      )}
                      {message.sources.webSources > 0 && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          🌐 Web: {message.sources.webSources}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 shadow p-3 rounded-lg">
                  <p className="text-sm mb-2">
                    {useGraphContext && '📚 文書検索中...'} 
                    {useWebSearch && '🔍 Web検索中...'}
                  </p>
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          id="message-input"
          name="message"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your message..."
          disabled={isLoading}
          autoComplete="off"
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}