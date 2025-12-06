
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { Project, Client, User } from '../../types';
import { useAuth } from '../../App';
import { Card, Badge, Button, Input, Modal, Select } from '../../components/ui';
import { Search, Filter, Plus, ChevronRight, Trash2 } from 'lucide-react';

const ProjectList: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ 
      name: '', 
      description: '', 
      clientId: '', 
      dueDate: '',
      websiteUrl: '',
      websiteUsername: '',
      websitePassword: '',
      assignedDeveloperId: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
      const p = await api.getProjects(user?.id, user?.role);
      const c = await api.getClients();
      const u = await api.getAllUsers();
      setProjects(p);
      setClients(c);
      setTeam(u.filter(user => user.role === 'TEAM'));
      if (c.length > 0) setNewProject(prev => ({ ...prev, clientId: c[0].id }));

      // Check for navigation state filter
      if (location.state && location.state.clientId) {
          const clientProjects = p.filter(proj => proj.clientId === location.state.clientId);
          setFiltered(clientProjects);
      } else {
          setFiltered(p);
      }
  };

  useEffect(() => {
    // Only apply search filter if we aren't using the navigation state filter, 
    // or if the user starts typing to override it.
    if (search) {
        const lower = search.toLowerCase();
        setFiltered(projects.filter(p => 
          p.name.toLowerCase().includes(lower) || 
          p.description.toLowerCase().includes(lower)
        ));
    } else if (!location.state?.clientId) {
        setFiltered(projects);
    }
  }, [search, projects]);

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      setCreating(true);
      await api.addProject({
          ...newProject,
          status: 'ACTIVE'
      });
      setCreating(false);
      setIsModalOpen(false);
      setNewProject({ 
          name: '', description: '', clientId: clients[0]?.id || '', dueDate: '',
          websiteUrl: '', websiteUsername: '', websitePassword: '', assignedDeveloperId: ''
      });
      loadData();
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
      e.preventDefault();
      e.stopPropagation();
      if(confirm('Are you sure you want to delete this project? This will delete all tasks and files associated with it.')) {
          await api.deleteProject(projectId);
          loadData();
      }
  };

  const getStatusVariant = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'success';
      case 'ON_HOLD': return 'warning';
      case 'COMPLETED': return 'default';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="text-slate-500 mt-1">Manage and track ongoing work.</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search projects..." 
            className="pl-10 border-slate-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Filter className="w-4 h-4 mr-2" />
            Status
          </Button>
          {location.state?.clientId && (
             <Button variant="ghost" onClick={() => { 
                 window.history.replaceState({}, document.title); 
                 setFiltered(projects);
             }}>
                 Clear Client Filter
             </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(project => (
          <Link key={project.id} to={`/projects/${project.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group flex flex-col relative">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant={getStatusVariant(project.status)}>{project.status.replace('_', ' ')}</Badge>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">Due {project.dueDate}</span>
                    {user?.role === 'ADMIN' && (
                        <button 
                            onClick={(e) => handleDeleteProject(e, project.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Delete Project"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                  {project.description}
                </p>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${project.progress}%` }} 
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Progress</span>
                  <span className="font-medium text-slate-700">{project.progress}%</span>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center rounded-b-xl">
                 <div className="flex -space-x-2">
                    {/* Fake avatars */}
                    {[1,2].map(i => (
                      <img key={i} className="w-8 h-8 rounded-full border-2 border-white" src={`https://picsum.photos/seed/${project.id}${i}/32`} alt="" />
                    ))}
                 </div>
                 <span className="text-indigo-600 text-sm font-medium flex items-center">
                   View Details <ChevronRight className="w-4 h-4 ml-1" />
                 </span>
              </div>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-500">
                {user?.role === 'TEAM' 
                    ? "No projects assigned to you yet." 
                    : "No projects found."}
            </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
          <form onSubmit={handleCreate} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
              <div>
                  <label className="block text-sm font-medium text-slate-700">Project Name</label>
                  <Input required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Client</label>
                    <Select required value={newProject.clientId} onChange={e => setNewProject({...newProject, clientId: e.target.value})}>
                        <option value="">Select Client</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Due Date</label>
                    <Input type="date" required value={newProject.dueDate} onChange={e => setNewProject({...newProject, dueDate: e.target.value})} />
                </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700">Description</label>
                  <Input required value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
              </div>
              
              <div className="border-t border-slate-200 pt-4 mt-2">
                  <h4 className="text-sm font-semibold text-slate-800 mb-2">Project Credentials & Assignment</h4>
                  <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Website URL</label>
                        <Input placeholder="https://..." value={newProject.websiteUrl} onChange={e => setNewProject({...newProject, websiteUrl: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Admin Username</label>
                            <Input placeholder="admin" value={newProject.websiteUsername} onChange={e => setNewProject({...newProject, websiteUsername: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Admin Password</label>
                            <Input placeholder="secret" value={newProject.websitePassword} onChange={e => setNewProject({...newProject, websitePassword: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Assign Main Developer</label>
                        <Select value={newProject.assignedDeveloperId} onChange={e => setNewProject({...newProject, assignedDeveloperId: e.target.value})}>
                             <option value="">Unassigned</option>
                             {team.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                        </Select>
                      </div>
                  </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating}>Create Project</Button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default ProjectList;
