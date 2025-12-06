
export type Role = 'ADMIN' | 'CLIENT' | 'TEAM';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  company?: string;
  password?: string; // Added for mock auth
  resetToken?: string; // Added for password reset flow
  securityQuestion?: string; // Added for self-service reset
  securityAnswer?: string; // Added for self-service reset
};

export type TaskStatus = 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string;
  dueDate?: string;
};

export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';

export type Project = {
  id: string;
  clientId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
  progress: number;
  // New Credential Fields
  websiteUrl?: string;
  websiteUsername?: string;
  websitePassword?: string;
  assignedDeveloperId?: string;
};

export type Client = {
  id: string;
  userId: string; // Link to User
  companyName: string;
  contactName: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
};

export type ProjectFile = {
  id: string;
  projectId: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  date: string;
  url: string;
};

export type Message = {
  id: string;
  projectId: string;
  userId: string;
  text: string;
  createdAt: string;
};

// New: Message Attachments
export type MessageAttachment = {
  id: string;
  type: 'image' | 'video' | 'pdf' | 'file';
  url: string;
  name: string;
};

// New Direct Message Type for Admin-Client Inbox
export type DirectMessage = {
  id: string;
  senderId: string;
  receiverId: string; // 'ADMIN_INBOX' for messages to admin, or specific userId
  text: string;
  attachment?: MessageAttachment; // New field
  createdAt: string;
  read: boolean;
};

// New: Message Templates
export type MessageTemplate = {
  id: string;
  title: string;
  content: string;
};

// New: Bot Configuration
export type BotConfig = {
  id: string;
  name: string;
  isActive: boolean;
  messageContent: string;
  // Scheduling
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
};

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
