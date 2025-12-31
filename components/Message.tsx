
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message as MessageType } from '../types';
import { Copy, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface MessageProps {
    message: MessageType;
    isLastMessage?: boolean;
    onRegenerate?: () => void;
}

const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        toast.success('کد کپی شد!');
    };

    return (
        <div className="relative my-2 rounded-md">
            <div className="flex items-center justify-between bg-gray-700 text-white px-4 py-1.5 rounded-t-md text-sm">
                <span>{language || 'code'}</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-gray-300">
                    <Copy size={14} /> کپی
                </button>
            </div>
            <SyntaxHighlighter language={language} style={oneDark} PreTag="div" customStyle={{ margin: 0, borderRadius: '0 0 0.375rem 0.375rem' }}>
                {String(value).replace(/\n$/, '')}
            </SyntaxHighlighter>
        </div>
    );
};

export const Message: React.FC<MessageProps> = ({ message, isLastMessage, onRegenerate }) => {
    const isUser = message.role === 'user';
    
    const renderContent = () => {
        switch (message.type) {
            case 'image':
                return (
                    <div>
                        {message.content.prompt && <p className="mb-2">{message.content.prompt}</p>}
                        <img src={message.content.url} alt="Generated or uploaded content" className="rounded-lg max-w-sm" />
                    </div>
                );
            case 'video':
                 return (
                    <div>
                        {message.content.prompt && <p className="mb-2">{message.content.prompt}</p>}
                        <video controls src={message.content.url} className="rounded-lg max-w-sm" />
                    </div>
                );
            case 'audio':
                return (
                    <div>
                        <p className="mb-2 italic">"{message.content.text}"</p>
                        <audio controls src={message.content.url} className="w-full"></audio>
                    </div>
                );
            case 'text':
            case 'code':
            case 'file':
            case 'grounding':
                 const textToRender = message.type === 'file' ? `فایل \`${message.content.name}\` آپلود شد:\n\n\`\`\`\n${message.content.text}\n\`\`\`` : message.content;
                return (
                    <ReactMarkdown
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                    <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                );
                            }
                        }}
                    >
                        {textToRender}
                    </ReactMarkdown>
                );
            default:
                return <p>{String(message.content)}</p>;
        }
    };
    
    const renderGrounding = () => {
        if (!message.grounding || message.grounding.length === 0) return null;
        
        return (
            <div className="mt-2 pt-2 border-t border-[var(--border-color)]/30">
                <h4 className="text-xs font-bold mb-1">منابع:</h4>
                <ul className="text-xs space-y-1">
                    {message.grounding.map((chunk, index) => {
                        const source = chunk.web || chunk.maps;
                        if (!source) return null;
                        return (
                            <li key={index}>
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block">
                                    {index + 1}. {source.title}
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    return (
        <div className={`flex items-start gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {!isUser && (
                 <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                    AI
                </div>
            )}
            
            <div className={`prose max-w-none break-words p-3 rounded-lg shadow-md relative
                ${isUser ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'}`}>
                {renderContent()}
                {renderGrounding()}
                {!isUser && (
                     <div className="absolute -bottom-4 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 hover:text-[var(--accent-color)]"><ThumbsUp size={14} /></button>
                        <button className="p-1 hover:text-[var(--accent-color)]"><ThumbsDown size={14} /></button>
                         {isLastMessage && onRegenerate && (
                             <button onClick={onRegenerate} className="p-1 hover:text-[var(--accent-color)]" title="بازسازی پاسخ"><RefreshCw size={14} /></button>
                         )}
                    </div>
                )}
            </div>

             {isUser && (
                 <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md bg-gray-300 dark:bg-gray-600">
                    شما
                </div>
            )}
        </div>
    );
};
