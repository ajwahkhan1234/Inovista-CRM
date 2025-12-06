
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Project, Task, TaskStatus, Message, User, ProjectFile, Priority } from '../../types';
import { Button, Card, Badge, Input, Modal, Select } from '../../components/ui';
import { useAuth } from '../../App';
import { GoogleGenAI } from "@google/genai";
import { Plus, Paperclip, MessageSquare, Bot, Calendar, Layout, Send, Download, Trash2, Edit2, Lock, Globe, User as UserIcon, Save, Shield, Eye, EyeOff } from 'lucide-react';

// --- Kanban Board Component ---
const KanbanColumn: React.FC<{ 
  title: string; 
  status: TaskStatus; 
  tasks: Task[]; 
  isReadOnly: boolean;
  onDrop: (taskId: string, status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}> = ({ title, status, tasks, isReadOnly, onDrop, onEditTask, onDeleteTask }) => {
  const handleDragOver = (e: React.DragEvent) => {
    if (!isReadOnly) e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isReadOnly) return;
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onDrop(taskId, status);
  };

  return (
    <div 
      className={`flex flex-col rounded-lg p-3 min-h-[500px] transition-colors ${isReadOnly ? 'bg-slate-50' : 'bg-slate-100'}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1 flex justify-between">
        {title} 
        <span className="bg-slate-200 text-slate-600 px-2 rounded-full">{tasks.length}</span>
      </h4>
      <div className="flex-1 space-y-3">
        {tasks.map(task => (
          <div
            key={task.id}
            draggable={!isReadOnly}
            onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
            className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 relative group ${!isReadOnly ? 'cursor-move hover:shadow-md' : ''}`}
          >
            <div className="flex justify-between items-start mb-2">
              <Badge variant={task.priority === 'HIGH' ? 'danger' : task.priority === 'MEDIUM' ? 'warning' : 'neutral'}>
                {task.priority}
              </Badge>
              {!isReadOnly && (
                <div className="hidden group-hover:flex space-x-1">
                   <button onClick={() => onEditTask(task)} className="p-1 text-slate-400 hover:text-indigo-600 rounded">
                      <Edit2 className="w-3 h-3" />
                   </button>
                   <button onClick={() => onDeleteTask(task.id)} className="p-1 text-slate-400 hover:text-red-600 rounded">
                      <Trash2 className="w-3 h-3" />
                   </button>
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-slate-800 mb-2">{task.title}</p>
            <div className="flex justify-between items-center mt-3">
               <div className="flex items-center text-xs text-slate-400">
                 <Calendar className="w-3 h-3 mr-1" />
                 {task.dueDate?.slice(5) || 'No date'}
               </div>
               <img src={`https://picsum.photos/seed/${task.assigneeId}/30`} className="w-6 h-6 rounded-full" alt="Assignee" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Project AI Assistant Component ---
const ProjectAssistant: React.FC<{ project: Project; tasks: Task[] }> = ({ project, tasks }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const apiKey = process.env.API_KEY;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });
      
      // Build context about the project
      const taskSummary = tasks.map(t => `- [${t.status}] ${t.title} (Priority: ${t.priority})`).join('\n');
      const systemContext = `
        You are an AI Project Assistant for FlowHub.
        
        CURRENT PROJECT DATA:
        Name: ${project.name}
        Description: ${project.description}
        Status: ${project.status}
        Progress: ${project.progress}%
        
        CURRENT TASKS:
        ${taskSummary}
        
        INSTRUCTIONS:
        - Answer questions based on the project data above.
        - Be professional, concise, and helpful.
        - If asked to create tasks, suggest them based on the project description.
        - Do not hallucinate data not present in the context.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: [{ text: systemContext + '\n\nUser Question: ' + userMsg }] }
        ],
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || 'No response generated.' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble connecting to the AI service right now.' }]);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!apiKey) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Bot className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900">AI Assistant Disabled</h3>
              <p className="text-sm text-slate-500 mt-2">API Key not configured in environment.</p>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-[600px] border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Project Assistant</h3>
                <p className="text-xs text-slate-500">Ask about tasks, status, or ideas</p>
              </div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.length === 0 && (
                <div className="text-center text-slate-400 mt-20">
                    <p className="mb-2">👋 Hi! I'm your AI assistant.</p>
                    <p className="text-sm">Try asking: <br/> "What tasks are high priority?" <br/> "Draft an email update for the client." <br/> "Suggest next steps for this project."</p>
                </div>
            )}
            {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                        <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                    </div>
                </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center space-x-2">
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
        </div>
        <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative">
              <Input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  placeholder="Ask anything about this project..."
                  className="pr-20"
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <div className="absolute right-1 top-1">
                <Button size="sm" onClick={handleSend} disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
        </div>
    </div>
  );
};

// --- Project Messages Component ---
const ProjectMessages: React.FC<{ projectId: string }> = ({ projectId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<(Message & { user: User })[]>([]);
    const [text, setText] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 3000); // Polling for demo
        return () => clearInterval(interval);
    }, [projectId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadMessages = () => {
        api.getMessages(projectId).then(setMessages);
    };

    const handleSend = async () => {
        if (!text.trim() || !user) return;
        await api.addMessage({
            projectId,
            userId: user.id,
            text: text
        });
        setText('');
        loadMessages();
    };

    return (
        <Card className="h-[600px] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
                    Project Discussion
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 && <p className="text-center text-slate-400 text-sm">No messages yet. Start the conversation!</p>}
                {messages.map(msg => {
                    const isMe = msg.userId === user?.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <img src={msg.user.avatar} className="w-8 h-8 rounded-full border border-slate-200" alt={msg.user.name} />
                                <div className={`mx-2 p-3 rounded-lg text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                                    <div className={`text-xs opacity-75 mb-1 font-semibold ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}>{msg.user.name}</div>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>
            <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <Input 
                    value={text} 
                    onChange={e => setText(e.target.value)} 
                    placeholder="Type a message..." 
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <Button onClick={handleSend}><Send className="w-4 h-4" /></Button>
            </div>
        </Card>
    );
};

// --- Credentials Card ---
const CredentialsCard: React.FC<{ project: Project; onUpdate: (p: Project) => void; readOnly: boolean }> = ({ project, onUpdate, readOnly }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [data, setData] = useState({
        websiteUrl: project.websiteUrl || '',
        websiteUsername: project.websiteUsername || '',
        websitePassword: project.websitePassword || '',
    });

    const handleSave = async () => {
        const updated = { ...project, ...data };
        await api.updateProject(updated);
        onUpdate(updated);
        setIsEditing(false);
    };

    if (readOnly && !project.websiteUrl) return null;

    return (
        <Card className="p-4 mb-6 bg-slate-50 border-indigo-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-indigo-600" />
                    Project Credentials
                </h3>
                {!readOnly && (
                    <button 
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                        {isEditing ? <Save className="w-3 h-3 mr-1" /> : <Edit2 className="w-3 h-3 mr-1" />}
                        {isEditing ? 'Save' : 'Edit'}
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Website URL</label>
                    {isEditing ? (
                        <Input value={data.websiteUrl} onChange={e => setData({...data, websiteUrl: e.target.value})} />
                    ) : (
                        <a href={data.websiteUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center break-all">
                            <Globe className="w-3 h-3 mr-1 shrink-0" /> {data.websiteUrl || 'Not set'}
                        </a>
                    )}
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Username</label>
                    {isEditing ? (
                         <Input value={data.websiteUsername} onChange={e => setData({...data, websiteUsername: e.target.value})} />
                    ) : (
                        <span className="font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 block">
                            {data.websiteUsername || 'Not set'}
                        </span>
                    )}
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Password</label>
                    {isEditing ? (
                         <Input value={data.websitePassword} onChange={e => setData({...data, websitePassword: e.target.value})} />
                    ) : (
                        <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200">
                            <span className="font-mono text-slate-700 block mr-2">
                                {showPassword ? (data.websitePassword || 'Not set') : '••••••••'}
                            </span>
                            <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600">
                                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}

// --- Main Project Detail ---
const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | undefined>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'KANBAN' | 'FILES' | 'AI' | 'MESSAGES'>('KANBAN');
  const [loading, setLoading] = useState(true);

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM' as Priority, dueDate: '', assigneeId: user?.id || '' });

  const isAdmin = user?.role === 'ADMIN';
  const isTeam = user?.role === 'TEAM';
  
  // Tasks: Admin AND Team can edit. Clients are Read Only.
  const canEditContent = isAdmin || isTeam;
  
  // Settings/Credentials: Only Admin can EDIT them. Team can VIEW them.
  const canManageSettings = isAdmin;

  // Viewing Credentials: Admin and Team
  const canViewCredentials = isAdmin || isTeam;

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
      if (!id) return;
      const [p, t, f, allUsers] = await Promise.all([
          api.getProjectById(id),
          api.getTasks(id),
          api.getFiles(id),
          api.getAllUsers()
      ]);
      setProject(p);
      setTasks(t);
      setFiles(f);
      setTeam(allUsers.filter(u => u.role === 'TEAM'));
      setLoading(false);
  };

  const onTaskDrop = async (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await api.updateTaskStatus(taskId, newStatus);
  };

  const openTaskModal = (task?: Task) => {
      if (task) {
          setEditingTask(task);
          setTaskForm({
              title: task.title,
              description: task.description,
              priority: task.priority,
              dueDate: task.dueDate || '',
              assigneeId: task.assigneeId || user?.id || ''
          });
      } else {
          setEditingTask(null);
          setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: user?.id || '' });
      }
      setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!id || !project) return;
      
      if (editingTask) {
          // Update existing
          await api.updateTask({
              ...editingTask,
              ...taskForm
          });
      } else {
          // Create new
          await api.addTask({
              ...taskForm,
              projectId: id,
              status: 'BACKLOG',
          });
      }
      
      setIsTaskModalOpen(false);
      loadData();
  };

  const handleDeleteTask = async (taskId: string) => {
      if (confirm('Are you sure you want to delete this task?')) {
          await api.deleteTask(taskId);
          loadData();
      }
  };

  const handleUpdateAssignedDev = async (newDevId: string) => {
      if (!project) return;
      const updated = { ...project, assignedDeveloperId: newDevId };
      await api.updateProject(updated);
      setProject(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && id && user) {
          // Use FileReader to convert file to Base64 string for storage
          // Note: In a production app, you would upload to AWS S3/Firebase Storage and get a URL.
          // For this app structure, we store the Base64 string in Firestore/LocalStorage.
          const reader = new FileReader();
          reader.onload = async (event) => {
              const base64Data = event.target?.result as string;
              
              await api.uploadFile({
                  projectId: id,
                  name: file.name,
                  type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
                  size: `${(file.size / 1024).toFixed(1)} KB`,
                  uploadedBy: user.name,
                  url: base64Data // Store the actual file data
              });
              loadData();
          };
          reader.readAsDataURL(file);
      }
  };

  if (loading || !project) return <div className="p-10 text-center">Loading Project...</div>;

  const assignedDev = team.find(u => u.id === project.assignedDeveloperId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                <Badge variant={project.status === 'ACTIVE' ? 'success' : 'neutral'}>{project.status}</Badge>
            </div>
            <p className="text-slate-500 max-w-2xl">{project.description}</p>
          </div>
          <div className="flex flex-col items-end">
              <div className="flex items-center space-x-2 mb-2 bg-slate-50 p-2 rounded-lg">
                  {isAdmin ? (
                      <div className="flex items-center">
                          <span className="text-xs text-slate-500 mr-2">Lead Dev:</span>
                          <select 
                            className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
                            value={project.assignedDeveloperId || ''}
                            onChange={(e) => handleUpdateAssignedDev(e.target.value)}
                          >
                              <option value="">Unassigned</option>
                              {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                      </div>
                  ) : (
                      assignedDev ? (
                        <>
                            <img className="w-6 h-6 rounded-full" src={assignedDev.avatar} alt={assignedDev.name} />
                            <span className="text-xs text-slate-700 font-medium">Lead: {assignedDev.name}</span>
                        </>
                      ) : <span className="text-xs text-slate-400">No Lead Assigned</span>
                  )}
              </div>
              <p className="text-xs text-slate-400">Due: {project.dueDate}</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mt-8 flex space-x-6 border-b border-slate-100 overflow-x-auto">
            {[
                { id: 'KANBAN', label: 'Tasks Board', icon: Layout },
                { id: 'MESSAGES', label: 'Discussion', icon: MessageSquare },
                { id: 'FILES', label: 'Files & Assets', icon: Paperclip },
                { id: 'AI', label: 'AI Assistant', icon: Bot },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-4 px-2 text-sm font-medium flex items-center border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'KANBAN' && (
        <>
            {/* Project Credentials - Viewable by Admin and Team, Editable only by Admin */}
            {canViewCredentials && (
                <CredentialsCard 
                    project={project} 
                    onUpdate={setProject} 
                    readOnly={!canManageSettings} // True for Team (Read Only), False for Admin (Editable)
                />
            )}

            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-slate-800">Task Board</h2>
                {canEditContent && (
                    <Button size="sm" onClick={() => openTaskModal()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                    </Button>
                )}
            </div>
            {!canEditContent && (
                <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm mb-4 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Read-Only Mode Enabled. You can download assets and view info.
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
            <KanbanColumn 
                title="Backlog" 
                status="BACKLOG" 
                tasks={tasks.filter(t => t.status === 'BACKLOG')} 
                onDrop={onTaskDrop} 
                isReadOnly={!canEditContent}
                onEditTask={openTaskModal}
                onDeleteTask={handleDeleteTask}
            />
            <KanbanColumn 
                title="In Progress" 
                status="IN_PROGRESS" 
                tasks={tasks.filter(t => t.status === 'IN_PROGRESS')} 
                onDrop={onTaskDrop} 
                isReadOnly={!canEditContent}
                onEditTask={openTaskModal}
                onDeleteTask={handleDeleteTask}
            />
            <KanbanColumn 
                title="Review" 
                status="REVIEW" 
                tasks={tasks.filter(t => t.status === 'REVIEW')} 
                onDrop={onTaskDrop} 
                isReadOnly={!canEditContent}
                onEditTask={openTaskModal}
                onDeleteTask={handleDeleteTask}
            />
            <KanbanColumn 
                title="Done" 
                status="DONE" 
                tasks={tasks.filter(t => t.status === 'DONE')} 
                onDrop={onTaskDrop} 
                isReadOnly={!canEditContent}
                onEditTask={openTaskModal}
                onDeleteTask={handleDeleteTask}
            />
            </div>
        </>
      )}

      {activeTab === 'AI' && (
          <div className="max-w-3xl mx-auto">
              <ProjectAssistant project={project} tasks={tasks} />
          </div>
      )}

      {activeTab === 'MESSAGES' && (
          <div className="max-w-3xl mx-auto">
              <ProjectMessages projectId={project.id} />
          </div>
      )}

      {activeTab === 'FILES' && (
        <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-medium text-slate-800">Project Assets</h3>
                <div className="relative">
                    <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} />
                    <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" /> Upload File
                    </label>
                </div>
            </div>
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {files.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                                No files uploaded yet.
                            </td>
                        </tr>
                    )}
                    {files.map((file, i) => (
                        <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 flex items-center">
                                <Paperclip className="w-4 h-4 mr-2 text-slate-400" />
                                {file.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{file.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{file.size}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{file.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <a 
                                    href={file.url} 
                                    download={file.name}
                                    className="text-indigo-600 hover:text-indigo-900 mr-2 inline-flex items-center"
                                    title="Download File"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
      )}

      {/* Create/Edit Task Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={editingTask ? "Edit Task" : "Add New Task"}>
          <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700">Title</label>
                  <Input required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700">Description</label>
                  <Input required value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Priority</label>
                    <Select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value as Priority})}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Due Date</label>
                    <Input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700">Assign To</label>
                  <Select value={taskForm.assigneeId} onChange={e => setTaskForm({...taskForm, assigneeId: e.target.value})}>
                      {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </Select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingTask ? 'Save Changes' : 'Create Task'}</Button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
