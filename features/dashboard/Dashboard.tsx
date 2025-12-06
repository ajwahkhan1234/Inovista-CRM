import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Badge } from '../../components/ui';
import { api } from '../../services/api';
import { Project, Task } from '../../types';
import { useAuth } from '../../App';
import { Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

const StatCard: React.FC<{ title: string; value: string | number; icon: any; color: string }> = ({ title, value, icon: Icon, color }) => (
  <Card className="p-6">
    <div className="flex items-center">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10 mr-4`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await api.getProjects(user?.id, user?.role);
      setProjects(data);
      setLoading(false);
    };
    loadData();
  }, [user]);

  // Derived Stats
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
  const avgProgress = projects.length ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) : 0;

  const chartData = projects.map(p => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
    progress: p.progress
  }));

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name.split(' ')[0]} 👋</h1>
        <Badge variant="neutral">{new Date().toLocaleDateString()}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Projects" value={activeProjects} icon={Briefcase} color="bg-blue-600" />
        <StatCard title="Completed" value={completedProjects} icon={CheckCircle} color="bg-green-600" />
        <StatCard title="Avg. Progress" value={`${avgProgress}%`} icon={TrendingUp} color="bg-indigo-600" />
        <StatCard title="Pending Actions" value="3" icon={AlertCircle} color="bg-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Project Progress Overview</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="progress" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity / Projects List */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Projects</h3>
          <div className="space-y-4">
            {projects.slice(0, 4).map(project => (
              <div key={project.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${project.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{project.name}</p>
                    <p className="text-xs text-slate-500">Due {project.dueDate}</p>
                  </div>
                </div>
                <div className="text-right">
                   <span className="text-xs font-semibold text-indigo-600">{project.progress}%</span>
                </div>
              </div>
            ))}
            {projects.length === 0 && <p className="text-sm text-gray-500">No projects found.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

// Import necessary icons
import { Briefcase } from 'lucide-react';

export default Dashboard;
