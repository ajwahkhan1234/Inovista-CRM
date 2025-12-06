
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { User, Role, MessageTemplate, BotConfig } from '../../types';
import { Button, Card, Badge, Modal, Input, Select } from '../../components/ui';
import { Trash2, Edit2, Shield, Search, Plus, FileText, Bot, Users, Clock, Calendar, Database, Globe } from 'lucide-react';
import { useAuth } from '../../App';
import { loadSavedConfig, isUsingHardcodedKeys } from '../../services/firebase';

const Settings: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'USERS' | 'TEMPLATES' | 'BOTS' | 'DATABASE'>('USERS');
  const [loading, setLoading] = useState(false);
  const isGlobal = isUsingHardcodedKeys();
  
  // --- USERS STATE ---
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'CLIENT' as Role, company: '', password: '' });

  // --- TEMPLATES STATE ---
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({ title: '', content: '' });

  // --- BOTS STATE ---
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<BotConfig | null>(null);
  const [botForm, setBotForm] = useState({ 
      name: '', 
      messageContent: '', 
      isActive: true,
      startTime: '00:00',
      endTime: '23:59',
      days: [] as number[]
  });

  // --- DATABASE STATE ---
  const [dbConfig, setDbConfig] = useState({
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
  });

  const DAYS_OF_WEEK = [
      { id: 1, label: 'M' },
      { id: 2, label: 'T' },
      { id: 3, label: 'W' },
      { id: 4, label: 'T' },
      { id: 5, label: 'F' },
      { id: 6, label: 'S' },
      { id: 0, label: 'S' },
  ];

  useEffect(() => {
    if (activeTab === 'USERS') loadUsers();
    if (activeTab === 'TEMPLATES') loadTemplates();
    if (activeTab === 'BOTS') loadBots();
    if (activeTab === 'DATABASE') {
        const saved = loadSavedConfig();
        if (saved) setDbConfig(saved);
    }
  }, [activeTab]);

  // --- USERS LOGIC ---
  const loadUsers = async () => {
    setLoading(true);
    const data = await api.getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const openUserModal = (user: User) => {
    setEditingUser(user);
    setUserForm({
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company || '',
        password: user.password || ''
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      await api.updateUser({ ...editingUser, ...userForm });
      setIsUserModalOpen(false);
      loadUsers();
  };

  const handleDeleteUser = async (userId: string) => {
      if (userId === currentUser?.id) return alert("You cannot delete your own account.");
      if (confirm('Delete this user?')) {
          await api.deleteUser(userId);
          loadUsers();
      }
  };

  // --- TEMPLATES LOGIC ---
  const loadTemplates = async () => {
      const data = await api.getTemplates();
      setTemplates(data);
  };

  const openTemplateModal = (t?: MessageTemplate) => {
      if (t) {
          setEditingTemplate(t);
          setTemplateForm({ title: t.title, content: t.content });
      } else {
          setEditingTemplate(null);
          setTemplateForm({ title: '', content: '' });
      }
      setIsTemplateModalOpen(true);
  }
  
  const handleSaveTemplate = async (e: React.FormEvent) => {
      e.preventDefault();
      await api.addTemplate({
          ...templateForm,
          id: editingTemplate?.id
      });
      setIsTemplateModalOpen(false);
      loadTemplates();
  };

  const handleDeleteTemplate = async (id: string) => {
      if (confirm('Delete template?')) {
          await api.deleteTemplate(id);
          loadTemplates();
      }
  };

  // --- BOTS LOGIC ---
  const loadBots = async () => {
      const data = await api.getBotConfigs();
      setBots(data);
  };

  const openBotModal = (b?: BotConfig) => {
      if (b) {
          setEditingBot(b);
          setBotForm({
              name: b.name,
              messageContent: b.messageContent,
              isActive: b.isActive,
              startTime: b.startTime,
              endTime: b.endTime,
              days: b.days
          });
      } else {
          setEditingBot(null);
          setBotForm({
              name: '',
              messageContent: '',
              isActive: true,
              startTime: '00:00',
              endTime: '23:59',
              days: [1,2,3,4,5]
          });
      }
      setIsBotModalOpen(true);
  };

  const toggleBotDay = (dayId: number) => {
      setBotForm(prev => {
          const exists = prev.days.includes(dayId);
          if (exists) return { ...prev, days: prev.days.filter(d => d !== dayId) };
          return { ...prev, days: [...prev.days, dayId] };
      });
  };

  const handleSaveBot = async (e: React.FormEvent) => {
      e.preventDefault();
      await api.saveBotConfig({
          id: editingBot?.id,
          ...botForm
      });
      setIsBotModalOpen(false);
      loadBots();
  };

  const handleDeleteBot = async (id: string) => {
      if(confirm('Delete this bot configuration?')) {
          await api.deleteBotConfig(id);
          loadBots();
      }
  }

  // --- DATABASE LOGIC ---
  const handleSaveDB = (e: React.FormEvent) => {
      e.preventDefault();
      localStorage.setItem('fh_firebase_config', JSON.stringify(dbConfig));
      alert("Database configuration saved! The page will now reload to initialize the connection.");
      window.location.reload();
  };

  const handleDisconnectDB = () => {
      if (confirm("Are you sure? This will revert the app to Local Storage mode.")) {
          localStorage.removeItem('fh_firebase_config');
          window.location.reload();
      }
  };

  // --- RENDER HELPERS ---
  const getRoleBadge = (role: Role) => {
      switch(role) {
          case 'ADMIN': return 'danger';
          case 'TEAM': return 'success';
          default: return 'neutral';
      }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Configuration</h1>
          <p className="text-slate-500 mt-1">Manage users, message templates, automated bots, and data storage.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-200 overflow-x-auto">
          <button onClick={() => setActiveTab('USERS')} className={`pb-3 px-1 flex items-center border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'USERS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Users className="w-4 h-4 mr-2" /> Users
          </button>
          <button onClick={() => setActiveTab('TEMPLATES')} className={`pb-3 px-1 flex items-center border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'TEMPLATES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <FileText className="w-4 h-4 mr-2" /> Templates
          </button>
          <button onClick={() => setActiveTab('BOTS')} className={`pb-3 px-1 flex items-center border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'BOTS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Bot className="w-4 h-4 mr-2" /> Bots
          </button>
          <button onClick={() => setActiveTab('DATABASE')} className={`pb-3 px-1 flex items-center border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'DATABASE' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Database className="w-4 h-4 mr-2" /> Database
          </button>
      </div>

      {/* USERS TAB */}
      {activeTab === 'USERS' && (
        <Card className="p-0 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input placeholder="Search users..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <img className="h-8 w-8 rounded-full" src={u.avatar} alt="" />
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-slate-900">{u.name}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap"><Badge variant={getRoleBadge(u.role)}>{u.role}</Badge></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.company || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openUserModal(u)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Edit2 className="w-4 h-4" /></button>
                                    {u.id !== currentUser?.id && <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === 'TEMPLATES' && (
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-slate-900">Message Templates</h3>
                  <Button onClick={() => openTemplateModal()}>
                      <Plus className="w-4 h-4 mr-2" /> New Template
                  </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(t => (
                      <Card key={t.id} className="p-4 flex flex-col justify-between">
                          <div>
                              <div className="flex justify-between items-start">
                                <h4 className="font-semibold text-slate-800">{t.title}</h4>
                              </div>
                              <p className="text-sm text-slate-500 mt-2 p-2 bg-slate-50 rounded border border-slate-100">{t.content}</p>
                          </div>
                          <div className="mt-4 flex justify-end gap-2">
                              <button onClick={() => openTemplateModal(t)} className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                                  <Edit2 className="w-3 h-3 mr-1" /> Edit
                              </button>
                              <button onClick={() => handleDeleteTemplate(t.id)} className="text-red-600 hover:text-red-800 text-sm flex items-center">
                                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                              </button>
                          </div>
                      </Card>
                  ))}
              </div>
          </div>
      )}

      {/* BOTS TAB */}
      {activeTab === 'BOTS' && (
          <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-slate-900">Automated Bots</h3>
                  <Button onClick={() => openBotModal()}>
                      <Plus className="w-4 h-4 mr-2" /> New Bot
                  </Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                  {bots.length === 0 && <p className="text-slate-500">No bots configured.</p>}
                  {bots.map(bot => (
                      <Card key={bot.id} className="p-4">
                          <div className="flex justify-between items-start">
                              <div className="flex items-start space-x-4">
                                  <div className={`p-3 rounded-lg ${bot.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                      <Bot className="w-6 h-6" />
                                  </div>
                                  <div>
                                      <h4 className="text-lg font-semibold text-slate-900 flex items-center">
                                          {bot.name}
                                          {bot.isActive && <Badge variant="success">Active</Badge>}
                                      </h4>
                                      <p className="text-sm text-slate-500 mt-1">"{bot.messageContent}"</p>
                                      <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                                          <div className="flex items-center">
                                              <Calendar className="w-4 h-4 mr-1 text-slate-400" />
                                              {bot.days.length === 7 ? 'Every Day' : bot.days.map(d => DAYS_OF_WEEK.find(day => day.id === d)?.label).join(', ')}
                                          </div>
                                          <div className="flex items-center">
                                              <Clock className="w-4 h-4 mr-1 text-slate-400" />
                                              {bot.startTime} - {bot.endTime}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm" onClick={() => openBotModal(bot)}><Edit2 className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteBot(bot.id)} className="text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                              </div>
                          </div>
                      </Card>
                  ))}
              </div>
          </div>
      )}

      {/* DATABASE TAB */}
      {activeTab === 'DATABASE' && (
          <div className="space-y-6">
              {isGlobal ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                          <Globe className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-green-800 mb-2">Globally Connected</h3>
                      <p className="text-green-700 max-w-lg mx-auto">
                          Great job! You have successfully added your database keys to the code. 
                          Your app is now synced across all devices (Laptop, Mobile, Client PCs).
                      </p>
                      <p className="text-sm text-green-600 mt-4">
                          No further configuration is required on this page.
                      </p>
                  </div>
              ) : (
                <div className="space-y-6">
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                        <h3 className="text-indigo-900 font-semibold flex items-center mb-2">
                            <Database className="w-5 h-5 mr-2" />
                            Cloud Database Connection (Firebase)
                        </h3>
                        <p className="text-sm text-indigo-700 mb-2">
                            Connecting a database allows your app to store data in the cloud.
                        </p>
                        <div className="bg-white p-3 rounded border border-indigo-100 text-xs text-indigo-800 mt-2">
                            <strong>Note for Mobile Support:</strong><br/>
                            Currently, you are using the "Local Storage" configuration. This works on this device, but to make it work on your phone automatically, you should paste your keys into the <code>services/firebase.ts</code> file in the source code.
                        </div>
                    </div>

                    <Card className="p-6">
                        <form onSubmit={handleSaveDB} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">API Key</label>
                                    <Input required value={dbConfig.apiKey} onChange={e => setDbConfig({...dbConfig, apiKey: e.target.value})} placeholder="AIzaSy..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Auth Domain</label>
                                    <Input required value={dbConfig.authDomain} onChange={e => setDbConfig({...dbConfig, authDomain: e.target.value})} placeholder="project-id.firebaseapp.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Project ID</label>
                                    <Input required value={dbConfig.projectId} onChange={e => setDbConfig({...dbConfig, projectId: e.target.value})} placeholder="project-id" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Storage Bucket</label>
                                    <Input required value={dbConfig.storageBucket} onChange={e => setDbConfig({...dbConfig, storageBucket: e.target.value})} placeholder="project-id.appspot.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Messaging Sender ID</label>
                                    <Input required value={dbConfig.messagingSenderId} onChange={e => setDbConfig({...dbConfig, messagingSenderId: e.target.value})} placeholder="123456789" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">App ID</label>
                                    <Input required value={dbConfig.appId} onChange={e => setDbConfig({...dbConfig, appId: e.target.value})} placeholder="1:123456:web:abc..." />
                                </div>
                            </div>
                            
                            <div className="pt-4 flex justify-between items-center">
                                {api.isCloudMode() ? (
                                    <div className="flex items-center text-green-600 text-sm font-medium">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                        Connected (Local Config)
                                    </div>
                                ) : (
                                    <div className="flex items-center text-slate-500 text-sm">
                                        <div className="w-2 h-2 bg-slate-300 rounded-full mr-2"></div>
                                        Not Connected
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {api.isCloudMode() && (
                                        <Button type="button" variant="danger" onClick={handleDisconnectDB}>Disconnect</Button>
                                    )}
                                    <Button type="submit">
                                        {api.isCloudMode() ? 'Update Configuration' : 'Connect Database'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </Card>
                </div>
              )}
          </div>
      )}

      {/* User Modal */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Edit User">
          <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700">Name</label>
                  <Input required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <Input required type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Role</label>
                    <Select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as Role})}>
                        <option value="ADMIN">Admin</option>
                        <option value="TEAM">Team Member</option>
                        <option value="CLIENT">Client</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Company</label>
                    <Input value={userForm.company} onChange={e => setUserForm({...userForm, company: e.target.value})} />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <Input type="text" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
              </div>
          </form>
      </Modal>

      {/* Template Modal */}
      <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title={editingTemplate ? "Edit Template" : "New Template"}>
          <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700">Template Title</label>
                  <Input required value={templateForm.title} onChange={e => setTemplateForm({...templateForm, title: e.target.value})} placeholder="e.g. Payment Link" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700">Message Content</label>
                  <textarea 
                      required 
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                      value={templateForm.content}
                      onChange={e => setTemplateForm({...templateForm, content: e.target.value})}
                  />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Template</Button>
              </div>
          </form>
      </Modal>

      {/* Bot Config Modal */}
      <Modal isOpen={isBotModalOpen} onClose={() => setIsBotModalOpen(false)} title={editingBot ? "Edit Bot" : "New Bot Configuration"}>
          <form onSubmit={handleSaveBot} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700">Bot Name</label>
                  <Input required value={botForm.name} onChange={e => setBotForm({...botForm, name: e.target.value})} placeholder="e.g. Weekend Auto-Reply" />
              </div>
              
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-md">
                  <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={botForm.isActive} 
                        onChange={e => setBotForm({...botForm, isActive: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-900">Enable Bot</span>
                  </label>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Active Days</label>
                  <div className="flex gap-2">
                      {DAYS_OF_WEEK.map(day => (
                          <button
                              key={day.id}
                              type="button"
                              onClick={() => toggleBotDay(day.id)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                  botForm.days.includes(day.id) 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                          >
                              {day.label}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700">Start Time</label>
                      <Input type="time" required value={botForm.startTime} onChange={e => setBotForm({...botForm, startTime: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700">End Time</label>
                      <Input type="time" required value={botForm.endTime} onChange={e => setBotForm({...botForm, endTime: e.target.value})} />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700">Auto-Reply Message</label>
                  <textarea 
                      required 
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                      value={botForm.messageContent}
                      onChange={e => setBotForm({...botForm, messageContent: e.target.value})}
                  />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsBotModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Bot</Button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Settings;
