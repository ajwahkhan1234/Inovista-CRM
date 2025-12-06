import { User, Project, Client, Task } from './types';

// REPLACE THIS URL WITH YOUR ACTUAL LOGO IMAGE URL
// Recommended size: 200x60px (approx), transparent background
export const LOGO_URL = "https://placehold.co/240x70/transparent/0284c7?text=INOVISTA&font=montserrat";

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alex Admin',
    email: 'admin@inovista.com',
    role: 'ADMIN',
    avatar: 'https://picsum.photos/100/100',
    company: 'INOVISTA HQ'
  },
  {
    id: 'u2',
    name: 'Sarah Client',
    email: 'sarah@client.com',
    role: 'CLIENT',
    avatar: 'https://picsum.photos/101/101',
    company: 'Acme Corp'
  },
  {
    id: 'u3',
    name: 'John Dev',
    email: 'john@inovista.com',
    role: 'TEAM',
    avatar: 'https://picsum.photos/102/102',
    company: 'INOVISTA HQ'
  }
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1',
    userId: 'u2',
    companyName: 'Acme Corp',
    contactName: 'Sarah Client',
    email: 'sarah@client.com',
    status: 'ACTIVE'
  },
  {
    id: 'c2',
    userId: 'u4',
    companyName: 'Stark Industries',
    contactName: 'Tony S.',
    email: 'tony@stark.com',
    status: 'ACTIVE'
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    clientId: 'c1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the corporate website with new branding.',
    status: 'ACTIVE',
    dueDate: '2023-12-31',
    progress: 65
  },
  {
    id: 'p2',
    clientId: 'c1',
    name: 'Mobile App MVP',
    description: 'Initial release of the iOS and Android application.',
    status: 'ON_HOLD',
    dueDate: '2024-02-15',
    progress: 30
  },
  {
    id: 'p3',
    clientId: 'c2',
    name: 'Jarvis Integration',
    description: 'AI core module integration.',
    status: 'COMPLETED',
    dueDate: '2023-10-01',
    progress: 100
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'Design Homepage Mockups',
    description: 'Create 3 variations of the homepage hero section.',
    status: 'DONE',
    priority: 'HIGH',
    assigneeId: 'u3',
    dueDate: '2023-11-01'
  },
  {
    id: 't2',
    projectId: 'p1',
    title: 'Implement React Router',
    description: 'Setup basic routing structure.',
    status: 'REVIEW',
    priority: 'MEDIUM',
    assigneeId: 'u3',
    dueDate: '2023-11-05'
  },
  {
    id: 't3',
    projectId: 'p1',
    title: 'Client Feedback Meeting',
    description: 'Review mockups with Sarah.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assigneeId: 'u1',
    dueDate: '2023-11-10'
  },
  {
    id: 't4',
    projectId: 'p1',
    title: 'Optimize Images',
    description: 'Compress all assets for web.',
    status: 'BACKLOG',
    priority: 'LOW',
    assigneeId: 'u3',
    dueDate: '2023-11-20'
  }
];