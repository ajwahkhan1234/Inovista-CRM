
import { User, Project, Client, Task, TaskStatus, Message, ProjectFile, DirectMessage, Role, MessageTemplate, BotConfig, MessageAttachment } from '../types';
import { MOCK_USERS, MOCK_PROJECTS, MOCK_TASKS, MOCK_CLIENTS } from '../constants';
import { initFirebase, getDB, loadSavedConfig, isUsingHardcodedKeys } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';

const STORAGE_KEYS = {
  USERS: 'fh_users',
  PROJECTS: 'fh_projects',
  TASKS: 'fh_tasks',
  CLIENTS: 'fh_clients',
  FILES: 'fh_files',
  MESSAGES: 'fh_messages',
  DIRECT_MESSAGES: 'fh_direct_messages',
  TEMPLATES: 'fh_templates',
  BOT_CONFIGS: 'fh_bot_configs',
};

// --- INITIALIZATION ---
// Attempt to initialize Firebase immediately.
// If Hardcoded keys are in firebase.ts, this returns TRUE and we use Cloud only.
let isCloud = initFirebase();

const isGlobal = isUsingHardcodedKeys();

// Helper to simulate delay for local mode
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- DATA ACCESS LAYER (Hybrid) ---

// Generic Getter
const fetchCollection = async <T>(key: string, collectionName: string, defaultVal: T[]): Promise<T[]> => {
    if (isCloud) {
        try {
            const db = getDB();
            if (!db) return defaultVal;
            const snap = await getDocs(collection(db, collectionName));
            // @ts-ignore
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error(`Error fetching ${collectionName}`, e);
            return defaultVal;
        }
    } else {
        // Fallback to local storage ONLY if not in Global Cloud Mode
        if (isGlobal) return []; // If global keys are set but fetch failed, return empty, don't fallback to local
        
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultVal;
    }
}

// Generic Setter (Add/Update)
const saveItem = async (key: string, collectionName: string, item: any, isUpdate = false) => {
    if (isCloud) {
        const db = getDB();
        if (!db) return;
        
        // Deep clean the object to remove undefined values which crash Firestore
        const cleanItem = JSON.parse(JSON.stringify(item));
        
        // Ensure ID exists
        if (!cleanItem.id) {
            console.error("Attempted to save item without ID", item);
            return;
        }

        const ref = doc(db, collectionName, cleanItem.id);
        await setDoc(ref, cleanItem, { merge: true });
    } else {
        if (isGlobal) return; // Don't save to local if global
        
        const list = await fetchCollection<any>(key, collectionName, []);
        if (isUpdate) {
            const index = list.findIndex(i => i.id === item.id);
            if (index !== -1) list[index] = item;
        } else {
            list.push(item);
        }
        localStorage.setItem(key, JSON.stringify(list));
    }
}

const deleteItem = async (key: string, collectionName: string, itemId: string) => {
    if (isCloud) {
        const db = getDB();
        if (!db) return;
        await deleteDoc(doc(db, collectionName, itemId));
    } else {
        if (isGlobal) return; 

        const list = await fetchCollection<any>(key, collectionName, []);
        const filtered = list.filter(i => i.id !== itemId);
        localStorage.setItem(key, JSON.stringify(filtered));
    }
}

// Initialize Data if empty (ONLY for Local Dev Mode)
const initData = () => {
  // If we are using cloud (especially global keys), NEVER init mock data.
  if (isCloud) return; 
  
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      const usersWithSecurity = MOCK_USERS.map(u => ({
          ...u,
          password: 'password123', 
          securityQuestion: 'What is your favorite color?',
          securityAnswer: 'Blue'
      }));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersWithSecurity));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(MOCK_PROJECTS));
  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(MOCK_TASKS));
  if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(MOCK_CLIENTS));
  
  // Init Templates & Bots
  if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify([
        { id: 't1', title: 'Payment Link', content: 'Here is the link to complete your payment: https://stripe.com/pay/xyz' },
        { id: 't2', title: 'Project Update', content: 'We have made significant progress this week. Please check the dashboard for the latest files.' }
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOT_CONFIGS)) {
    localStorage.setItem(STORAGE_KEYS.BOT_CONFIGS, JSON.stringify([
        { 
          id: 'b1', 
          name: 'Weekend Auto-Reply', 
          isActive: false, 
          messageContent: 'Thanks for your message. We are currently closed for the weekend and will get back to you on Monday.',
          days: [0, 6],
          startTime: '00:00',
          endTime: '23:59'
        }
    ]));
  }
};

// Run init only if NOT connected to cloud
if (!isCloud) {
    initData();
}

export const api = {
  isCloudMode: () => isCloud,
  isGlobalMode: () => isUsingHardcodedKeys(),

  // --- Auth & Users ---
  login: async (email: string, password?: string): Promise<User | null> => {
    // If connection dropped, try to reconnect using saved config
    if (!isCloud) {
        const cfg = loadSavedConfig();
        if (cfg) isCloud = initFirebase(cfg);
    }

    await delay(500);
    const users = await fetchCollection<User>(STORAGE_KEYS.USERS, 'users', []);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
        if (password && user.password && user.password !== password) {
            return null;
        }
        return user;
    }
    return null;
  },

  register: async (name: string, email: string, password: string, role: Role = 'CLIENT', pin?: string, securityQuestion?: string, securityAnswer?: string): Promise<User> => {
    await delay(800);
    const users = await fetchCollection<User>(STORAGE_KEYS.USERS, 'users', []);
    
    if (users.find(u => u.email === email)) {
        throw new Error('Email already exists');
    }

    if (role === 'ADMIN' && pin !== '5557172') throw new Error('Invalid Admin PIN');
    if (role === 'TEAM' && pin !== '5557172') throw new Error('Invalid Team PIN');

    const newUser: User = {
        id: `u${Date.now()}`,
        name,
        email,
        role,
        avatar: `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`,
        password,
        securityQuestion,
        securityAnswer
    };

    await saveItem(STORAGE_KEYS.USERS, 'users', newUser);

    // Auto-create client record if role is CLIENT
    if (role === 'CLIENT') {
        const newClient: Client = {
            id: `c${Date.now()}`,
            userId: newUser.id,
            companyName: name + "'s Company",
            contactName: name,
            email: email,
            status: 'ACTIVE'
        };
        await saveItem(STORAGE_KEYS.CLIENTS, 'clients', newClient);
    }

    return newUser;
  },

  // Password Reset Logic
  resetPassword: async (token: string, newPassword: string): Promise<boolean> => {
      await delay(500);
      const users = await fetchCollection<User>(STORAGE_KEYS.USERS, 'users', []);
      const user = users.find(u => u.resetToken === token);

      if (!user) return false;

      user.password = newPassword;
      delete user.resetToken;
      await saveItem(STORAGE_KEYS.USERS, 'users', user, true);
      return true;
  },

  getSecurityQuestion: async (email: string): Promise<string | null> => {
      await delay(300);
      const users = await fetchCollection<User>(STORAGE_KEYS.USERS, 'users', []);
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return user?.securityQuestion || null;
  },

  resetPasswordViaSecurity: async (email: string, answer: string, newPassword: string): Promise<boolean> => {
      await delay(800);
      const users = await fetchCollection<User>(STORAGE_KEYS.USERS, 'users', []);
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) return false;
      if (user.securityAnswer && user.securityAnswer.toLowerCase() === answer.toLowerCase()) {
          user.password = newPassword;
          await saveItem(STORAGE_KEYS.USERS, 'users', user, true);
          return true;
      }
      return false;
  },

  getAllUsers: async (): Promise<User[]> => {
      return fetchCollection<User>(STORAGE_KEYS.USERS, 'users', []);
  },

  getUserById: async (id: string): Promise<User | undefined> => {
      const users = await fetchCollection<User>(STORAGE_KEYS.USERS, 'users', []);
      return users.find(u => u.id === id);
  },

  updateUser: async (user: User): Promise<void> => {
      await saveItem(STORAGE_KEYS.USERS, 'users', user, true);
  },

  deleteUser: async (userId: string): Promise<void> => {
      await deleteItem(STORAGE_KEYS.USERS, 'users', userId);
  },

  // --- Clients ---
  getClients: async (): Promise<Client[]> => {
    const clients = await fetchCollection<Client>(STORAGE_KEYS.CLIENTS, 'clients', []);
    const currentUserJson = localStorage.getItem('fh_session');
    
    if (currentUserJson) {
        const currentUser = JSON.parse(currentUserJson) as User;
        if (currentUser.role === 'TEAM') {
             const projects = await fetchCollection<Project>(STORAGE_KEYS.PROJECTS, 'projects', []);
             const myProjectClientIds = projects
                .filter(p => p.assignedDeveloperId === currentUser.id)
                .map(p => p.clientId);
             return clients.filter(c => myProjectClientIds.includes(c.id));
        }
    }
    return clients;
  },

  addClient: async (clientData: Omit<Client, 'id' | 'userId'>, emailForUser: string): Promise<Client> => {
      // 1. Create a User account for the client
      const users = await fetchCollection<User>(STORAGE_KEYS.USERS, 'users', []);
      let userId = `u${Date.now()}`;
      
      const existingUser = users.find(u => u.email === emailForUser);
      if (existingUser) {
          userId = existingUser.id;
      } else {
          const newUser: User = {
              id: userId,
              name: clientData.contactName,
              email: emailForUser,
              role: 'CLIENT',
              avatar: `https://ui-avatars.com/api/?name=${clientData.contactName}&background=random`,
              company: clientData.companyName,
              password: 'password123',
              securityQuestion: 'What is your favorite color?',
              securityAnswer: 'Blue'
          };
          await saveItem(STORAGE_KEYS.USERS, 'users', newUser);
      }

      // 2. Create Client record
      const newClient: Client = {
          id: `c${Date.now()}`,
          userId,
          ...clientData
      };
      await saveItem(STORAGE_KEYS.CLIENTS, 'clients', newClient);
      return newClient;
  },

  // --- Projects ---
  getProjects: async (userId?: string, role?: string): Promise<Project[]> => {
    const projects = await fetchCollection<Project>(STORAGE_KEYS.PROJECTS, 'projects', []);
    
    if (role === 'ADMIN') return projects;
    
    if (role === 'TEAM') {
        return projects.filter(p => p.assignedDeveloperId === userId);
    }

    if (role === 'CLIENT') {
        const clients = await fetchCollection<Client>(STORAGE_KEYS.CLIENTS, 'clients', []);
        const client = clients.find(c => c.userId === userId);
        return client ? projects.filter(p => p.clientId === client.id) : [];
    }
    return [];
  },

  getProjectById: async (id: string): Promise<Project | undefined> => {
    const projects = await fetchCollection<Project>(STORAGE_KEYS.PROJECTS, 'projects', []);
    return projects.find(p => p.id === id);
  },

  addProject: async (project: Partial<Project>): Promise<Project> => {
      const newProject: Project = {
          id: `p${Date.now()}`,
          progress: 0,
          status: 'ACTIVE',
          name: project.name || 'New Project',
          description: project.description || '',
          clientId: project.clientId || '',
          dueDate: project.dueDate || '',
          websiteUrl: project.websiteUrl,
          websiteUsername: project.websiteUsername,
          websitePassword: project.websitePassword,
          assignedDeveloperId: project.assignedDeveloperId
      };
      await saveItem(STORAGE_KEYS.PROJECTS, 'projects', newProject);
      return newProject;
  },

  updateProject: async (project: Project): Promise<void> => {
      await saveItem(STORAGE_KEYS.PROJECTS, 'projects', project, true);
  },

  deleteProject: async (projectId: string): Promise<void> => {
      await deleteItem(STORAGE_KEYS.PROJECTS, 'projects', projectId);
      // Clean up related data if local
      if (!isCloud) {
          const tasks = await fetchCollection<Task>(STORAGE_KEYS.TASKS, 'tasks', []);
          const msgs = await fetchCollection<Message>(STORAGE_KEYS.MESSAGES, 'messages', []);
          const files = await fetchCollection<ProjectFile>(STORAGE_KEYS.FILES, 'files', []);
          
          localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks.filter(t => t.projectId !== projectId)));
          localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(msgs.filter(m => m.projectId !== projectId)));
          localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files.filter(f => f.projectId !== projectId)));
      }
  },

  // --- Tasks ---
  getTasks: async (projectId: string): Promise<Task[]> => {
    const tasks = await fetchCollection<Task>(STORAGE_KEYS.TASKS, 'tasks', []);
    return tasks.filter(t => t.projectId === projectId);
  },

  updateTaskStatus: async (taskId: string, status: TaskStatus) => {
    const tasks = await fetchCollection<Task>(STORAGE_KEYS.TASKS, 'tasks', []);
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = status;
        await saveItem(STORAGE_KEYS.TASKS, 'tasks', task, true);
    }
  },

  addTask: async (task: Omit<Task, 'id'>) => {
      const newTask = { ...task, id: `t${Date.now()}` };
      await saveItem(STORAGE_KEYS.TASKS, 'tasks', newTask);
      return newTask;
  },

  updateTask: async (task: Task) => {
      await saveItem(STORAGE_KEYS.TASKS, 'tasks', task, true);
  },

  deleteTask: async (taskId: string) => {
      await deleteItem(STORAGE_KEYS.TASKS, 'tasks', taskId);
  },

  // --- Files ---
  getFiles: async (projectId: string): Promise<ProjectFile[]> => {
      const files = await fetchCollection<ProjectFile>(STORAGE_KEYS.FILES, 'files', []);
      return files.filter(f => f.projectId === projectId);
  },

  uploadFile: async (file: Omit<ProjectFile, 'id' | 'date'>) => {
      await delay(500);
      const newFile = { 
          ...file, 
          id: `f${Date.now()}`, 
          date: new Date().toISOString().split('T')[0] 
      };
      await saveItem(STORAGE_KEYS.FILES, 'files', newFile);
      return newFile;
  },

  // --- Messages (Project Chat) ---
  getMessages: async (projectId: string): Promise<(Message & { user: User })[]> => {
      const messages = await fetchCollection<Message>(STORAGE_KEYS.MESSAGES, 'messages', []);
      const users = await fetchCollection<User>(STORAGE_KEYS.USERS, 'users', []);
      
      return messages
        .filter(m => m.projectId === projectId)
        .map(m => ({
            ...m,
            user: users.find(u => u.id === m.userId) || users[0]
        }));
  },

  addMessage: async (msg: Omit<Message, 'id' | 'createdAt'>) => {
      const newMessage = { 
          ...msg, 
          id: `m${Date.now()}`, 
          createdAt: new Date().toISOString() 
      };
      await saveItem(STORAGE_KEYS.MESSAGES, 'messages', newMessage);
      return newMessage;
  },

  // --- Direct Messages (Inbox) ---
  getDirectMessages: async (userId: string, role: Role): Promise<(DirectMessage & { otherUser: User })[]> => {
      const allMsgs = await fetchCollection<DirectMessage>(STORAGE_KEYS.DIRECT_MESSAGES, 'direct_messages', []);
      const users = await fetchCollection<User>(STORAGE_KEYS.USERS, 'users', []);
      const projects = await fetchCollection<Project>(STORAGE_KEYS.PROJECTS, 'projects', []);
      const clients = await fetchCollection<Client>(STORAGE_KEYS.CLIENTS, 'clients', []);

      if (role === 'CLIENT') {
          return allMsgs
          .filter(m => m.senderId === userId || m.receiverId === userId)
          .map(m => {
              const otherId = m.senderId === userId ? m.receiverId : m.senderId;
              return {
                  ...m,
                  otherUser: users.find(u => u.id === otherId) || users[0]
              };
          });
      } else if (role === 'TEAM') {
          const myProjectClientIds = projects
            .filter(p => p.assignedDeveloperId === userId)
            .map(p => p.clientId);

          const allowedClientUserIds = clients
             .filter(c => myProjectClientIds.includes(c.id))
             .map(c => c.userId);
            
          return allMsgs.filter(m => {
              const isSenderAllowed = allowedClientUserIds.includes(m.senderId);
              const isReceiverAllowed = allowedClientUserIds.includes(m.receiverId);
              return isSenderAllowed || isReceiverAllowed;
          }).map(m => {
              let targetUser = users.find(u => u.id === m.receiverId);
              if (allowedClientUserIds.includes(m.senderId)) targetUser = users.find(u => u.id === m.senderId);
              else if (allowedClientUserIds.includes(m.receiverId)) targetUser = users.find(u => u.id === m.receiverId);
               if (!targetUser) targetUser = m.senderId === userId ? users.find(u => u.id === m.receiverId) : users.find(u => u.id === m.senderId);
              return { ...m, otherUser: targetUser || users[0] };
          });
      } else {
          return allMsgs.map(m => {
              const sender = users.find(u => u.id === m.senderId);
              const receiver = users.find(u => u.id === m.receiverId);
              let targetUser = receiver;
              if (sender?.role === 'CLIENT') targetUser = sender;
              else if (receiver?.role === 'CLIENT') targetUser = receiver;
              if (sender?.role !== 'CLIENT' && receiver?.role !== 'CLIENT') {
                  targetUser = m.senderId === userId ? receiver : sender;
              }
              return { ...m, otherUser: targetUser || users[0] };
          });
      }
  },

  sendDirectMessage: async (msg: { senderId: string, receiverId: string, text: string, attachment?: MessageAttachment }) => {
      // FIX: Ensure no undefined fields are passed to Firestore
      const newMsg: any = {
          id: `dm${Date.now()}`,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          text: msg.text || '', 
          createdAt: new Date().toISOString(),
          read: false
      };

      if (msg.attachment) {
          newMsg.attachment = msg.attachment;
      }

      await saveItem(STORAGE_KEYS.DIRECT_MESSAGES, 'direct_messages', newMsg);

      // --- Bot Logic ---
      const users = await fetchCollection<User>(STORAGE_KEYS.USERS, 'users', []);
      const sender = users.find(u => u.id === msg.senderId);
      
      if (sender && sender.role === 'CLIENT') {
          const bots = await fetchCollection<BotConfig>(STORAGE_KEYS.BOT_CONFIGS, 'bot_configs', []);
          const now = new Date();
          const currentDay = now.getDay(); 
          const currentHour = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

          const activeBot = bots.find(b => {
              if (!b.isActive) return false;
              if (!b.days.includes(currentDay)) return false;
              if (currentHour >= b.startTime && currentHour <= b.endTime) return true;
              return false;
          });
          
          if (activeBot) {
              setTimeout(async () => {
                  const botReply: DirectMessage = {
                      id: `dm_bot_${Date.now()}`,
                      senderId: msg.receiverId,
                      receiverId: msg.senderId,
                      text: activeBot.messageContent,
                      createdAt: new Date().toISOString(),
                      read: false
                  };
                  await saveItem(STORAGE_KEYS.DIRECT_MESSAGES, 'direct_messages', botReply);
              }, 2000);
          }
      }

      return newMsg;
  },

  // --- Templates & Bots ---
  getTemplates: async (): Promise<MessageTemplate[]> => {
      return fetchCollection<MessageTemplate>(STORAGE_KEYS.TEMPLATES, 'templates', []);
  },

  addTemplate: async (t: Partial<MessageTemplate>) => {
      const newItem = { 
          title: t.title!, 
          content: t.content!, 
          id: t.id || `tmp${Date.now()}` 
      };
      await saveItem(STORAGE_KEYS.TEMPLATES, 'templates', newItem, !!t.id);
  },

  deleteTemplate: async (id: string) => {
      await deleteItem(STORAGE_KEYS.TEMPLATES, 'templates', id);
  },

  getBotConfigs: async (): Promise<BotConfig[]> => {
      return fetchCollection<BotConfig>(STORAGE_KEYS.BOT_CONFIGS, 'bot_configs', []);
  },

  saveBotConfig: async (config: Partial<BotConfig>) => {
      const newBot = {
          id: config.id || `bot${Date.now()}`,
          name: config.name || 'New Bot',
          isActive: config.isActive ?? true,
          messageContent: config.messageContent || '',
          days: config.days || [0, 1, 2, 3, 4, 5, 6],
          startTime: config.startTime || '00:00',
          endTime: config.endTime || '23:59'
      };
      await saveItem(STORAGE_KEYS.BOT_CONFIGS, 'bot_configs', newBot, !!config.id);
  },

  deleteBotConfig: async (id: string) => {
      await deleteItem(STORAGE_KEYS.BOT_CONFIGS, 'bot_configs', id);
  }
};
