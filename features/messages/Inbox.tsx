
import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../App';
import { DirectMessage, User, MessageAttachment, MessageTemplate } from '../../types';
import { Card, Button, Input } from '../../components/ui';
import { Send, User as UserIcon, Shield, Paperclip, X, File, Zap } from 'lucide-react';

type ConversationData = {
    user: User;
    messages: DirectMessage[];
};

const Inbox: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [conversations, setConversations] = useState<{[key: string]: ConversationData}>({});
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Attachments & Templates
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachment, setAttachment] = useState<MessageAttachment | undefined>();
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [showTemplates, setShowTemplates] = useState(false);

    // Initial Load & Polling
    useEffect(() => {
        loadMessages();
        loadTemplates();
        const interval = setInterval(loadMessages, 3000);
        return () => clearInterval(interval);
    }, [user]);

    // Handle incoming navigation from "Message" button in Clients list
    useEffect(() => {
        const initChat = async () => {
             if (location.state && location.state.userId && !loading) {
                const targetId = location.state.userId;
                // If we already have a conversation in the list, select it
                if (conversations[targetId]) {
                    setSelectedUserId(targetId);
                } else {
                    // Otherwise fetch user details and create a temp conversation entry
                    const targetUser = await api.getUserById(targetId);
                    if (targetUser) {
                        setConversations(prev => ({
                            ...prev,
                            [targetId]: { user: targetUser, messages: [] }
                        }));
                        setSelectedUserId(targetId);
                    }
                }
                // Clear state so we don't re-trigger on reload
                window.history.replaceState({}, document.title);
             }
        }
        initChat();
    }, [location.state, loading]); 

    // Scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversations, selectedUserId]);

    const loadTemplates = async () => {
        if (user?.role !== 'CLIENT') {
            const t = await api.getTemplates();
            setTemplates(t);
        }
    }

    const loadMessages = async () => {
        if (!user) return;
        const msgs = await api.getDirectMessages(user.id, user.role);
        
        // Group messages by the "Other User"
        const grouped: {[key: string]: ConversationData} = {};
        
        msgs.forEach(item => {
            const otherId = item.otherUser.id;
            if (!grouped[otherId]) {
                grouped[otherId] = { user: item.otherUser, messages: [] };
            }
            grouped[otherId].messages.push(item as DirectMessage);
        });

        // For Admin & Team members, ensure ALL clients appear in the list
        if (user.role === 'ADMIN' || user.role === 'TEAM') {
            const clients = await api.getClients();
            const allUsers = await api.getAllUsers();
            
            clients.forEach(c => {
                const clientUser = allUsers.find(u => u.id === c.userId);
                if (clientUser) {
                    if (!grouped[clientUser.id]) {
                        grouped[clientUser.id] = { user: clientUser, messages: [] };
                    }
                }
            });
        }

        // Sort messages in each conversation by date
        Object.keys(grouped).forEach(k => {
            grouped[k].messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });

        // Merge with existing state
        setConversations(prev => {
            const merged = { ...grouped };
            if (selectedUserId && !merged[selectedUserId] && prev[selectedUserId]) {
                merged[selectedUserId] = prev[selectedUserId];
            }
            return merged;
        });
        
        // If client, auto-select
        if (user.role === 'CLIENT' && !selectedUserId) {
            const firstId = Object.keys(grouped)[0];
            if (firstId) setSelectedUserId(firstId);
        }
        
        setLoading(false);
    };

    const handleStartSupportChat = async () => {
        const users = await api.getAllUsers();
        const admins = users.filter(u => u.role === 'ADMIN');
        const supportAgent = admins.length > 0 ? admins[admins.length - 1] : null;
        
        if (supportAgent) {
             setConversations(prev => ({
                ...prev,
                [supportAgent.id]: { user: supportAgent, messages: [] }
            }));
            setSelectedUserId(supportAgent.id);
        } else {
            alert("No Admin/Support account found. Please contact system administrator.");
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create a Fake URL for demo purposes (In real app, upload to server here)
        // We use URL.createObjectURL for preview, but in mock DB we just store a string
        const fakeUrl = URL.createObjectURL(file);
        
        let type: 'image' | 'video' | 'pdf' | 'file' = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type === 'application/pdf') type = 'pdf';

        setAttachment({
            id: `att${Date.now()}`,
            name: file.name,
            type,
            url: fakeUrl
        });
    };

    const handleSend = async () => {
        // Validation: Must have either text OR attachment
        if (!user || (!inputText.trim() && !attachment) || !selectedUserId) return;
        
        await api.sendDirectMessage({
            senderId: user.id,
            receiverId: selectedUserId,
            text: inputText || '', // Ensure it's never null
            attachment: attachment
        });
        setInputText('');
        setAttachment(undefined);
        loadMessages();
    };

    const handleSelectTemplate = (content: string) => {
        setInputText(content);
        setShowTemplates(false);
    };

    // Sort conversations
    const conversationList = (Object.values(conversations) as ConversationData[]).sort((a, b) => {
        const lastA = a.messages[a.messages.length - 1]?.createdAt || '';
        const lastB = b.messages[b.messages.length - 1]?.createdAt || '';
        if (lastA === '' && lastB === '') return a.user.name.localeCompare(b.user.name);
        return lastB.localeCompare(lastA);
    });

    const renderAttachment = (att: MessageAttachment) => {
        if (att.type === 'image') {
            return <img src={att.url} alt="attachment" className="max-w-[200px] rounded-lg mt-2 cursor-pointer hover:opacity-90 border border-black/10" />;
        }
        if (att.type === 'video') {
            return <video src={att.url} controls className="max-w-[250px] rounded-lg mt-2" />;
        }
        return (
            <a href={att.url} download={att.name} className="flex items-center gap-2 mt-2 p-2 bg-black/5 rounded-lg text-xs font-medium hover:bg-black/10 transition-colors">
                <File className="w-4 h-4" />
                {att.name}
            </a>
        );
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
            {/* Sidebar List */}
            {(user?.role !== 'CLIENT' || conversationList.length > 1) && (
                 <Card className="w-full md:w-1/3 flex flex-col bg-white overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h2 className="font-semibold text-slate-800">Messages</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {conversationList.length === 0 && <div className="p-4 text-center text-slate-500 text-sm">No active conversations.</div>}
                        {conversationList.map(conv => (
                            <div 
                                key={conv.user.id}
                                onClick={() => setSelectedUserId(conv.user.id)}
                                className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${selectedUserId === conv.user.id ? 'bg-indigo-50' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="relative">
                                            <img src={conv.user.avatar} className="w-10 h-10 rounded-full" alt="" />
                                            {conv.user.role === 'ADMIN' && (
                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5"><Shield className="w-3 h-3 text-indigo-600 fill-current" /></div>
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-slate-900">{conv.user.name}</p>
                                            <p className="text-xs text-slate-500 truncate w-32 font-normal">
                                                {conv.messages.length > 0 ? (conv.messages[conv.messages.length -1].text || '[Attachment]') : <span className="text-indigo-400 italic">Start a conversation</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {conv.messages.length > 0 ? new Date(conv.messages[conv.messages.length - 1].createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 </Card>
            )}

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden relative">
                {selectedUserId && conversations[selectedUserId] ? (
                    <>
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center">
                                <img src={conversations[selectedUserId].user.avatar} className="w-8 h-8 rounded-full mr-3" alt="" />
                                <div>
                                    <h3 className="font-medium text-slate-900">{conversations[selectedUserId].user.name}</h3>
                                    <span className="text-xs text-slate-500">{conversations[selectedUserId].user.email}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                            {conversations[selectedUserId].messages.length === 0 && (
                                <div className="text-center text-slate-400 mt-10">
                                    <p>Start the conversation with {conversations[selectedUserId].user.name}</p>
                                </div>
                            )}
                            {conversations[selectedUserId].messages.map(msg => {
                                const isMe = msg.senderId === user?.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                                            {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                                            {msg.attachment && renderAttachment(msg.attachment)}
                                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={bottomRef} />
                        </div>

                        {/* Attachment Preview Area */}
                        {attachment && (
                            <div className="px-4 pt-2 bg-white flex items-center">
                                <div className="bg-slate-100 rounded-lg p-2 flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-600 truncate max-w-[200px]">{attachment.name}</span>
                                    <button onClick={() => setAttachment(undefined)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )}

                        {/* Templates Popover */}
                        {showTemplates && (
                            <div className="absolute bottom-20 right-4 w-64 bg-white border border-slate-200 shadow-xl rounded-lg z-10 p-2">
                                <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Templates</span>
                                    <button onClick={() => setShowTemplates(false)}><X className="w-3 h-3 text-slate-400" /></button>
                                </div>
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {templates.map(t => (
                                        <button key={t.id} onClick={() => handleSelectTemplate(t.content)} className="w-full text-left text-sm px-2 py-1.5 hover:bg-slate-50 rounded text-slate-700 truncate">
                                            {t.title}
                                        </button>
                                    ))}
                                    {templates.length === 0 && <span className="text-xs text-slate-400 px-2">No templates configured.</span>}
                                </div>
                            </div>
                        )}

                        <div className="p-4 bg-white border-t border-slate-100 flex gap-2 items-end">
                            {/* File Upload */}
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,video/*,application/pdf" />
                            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="px-3" title="Attach File">
                                <Paperclip className="w-4 h-4" />
                            </Button>

                            {/* Templates Button (Admin/Team) */}
                            {user?.role !== 'CLIENT' && (
                                <Button variant="secondary" onClick={() => setShowTemplates(!showTemplates)} className="px-3 text-indigo-600" title="Quick Replies">
                                    <Zap className="w-4 h-4" />
                                </Button>
                            )}

                            <Input 
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                placeholder="Type a message..."
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                            />
                            <Button onClick={handleSend} disabled={!inputText.trim() && !attachment}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="bg-slate-100 p-4 rounded-full mb-4">
                            <UserIcon className="w-8 h-8" />
                        </div>
                        <p>Select a conversation to start messaging</p>
                        {user?.role === 'CLIENT' && (
                             <Button className="mt-4" onClick={handleStartSupportChat} disabled={loading}>Start Chat with Support</Button>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Inbox;
