
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Client } from '../../types';
import { useAuth } from '../../App';
import { Card, Button, Badge, Modal, Input } from '../../components/ui';
import { Mail, Building, Plus, MessageSquare, Briefcase } from 'lucide-react';

const ClientList: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    api.getClients().then(setClients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      await api.addClient({
          companyName,
          contactName,
          email,
          status: 'ACTIVE'
      }, email);
      
      setLoading(false);
      setIsModalOpen(false);
      setCompanyName('');
      setContactName('');
      setEmail('');
      loadClients();
  };

  const handleViewProjects = (client: Client) => {
      navigate('/projects', { state: { clientId: client.id } });
  };

  const handleMessage = (client: Client) => {
      navigate('/messages', { state: { userId: client.userId } });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Clients</h1>
        {user?.role === 'ADMIN' && (
            <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
            </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map(client => (
          <Card key={client.id} className="p-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-lg font-bold mr-4">
                        {client.companyName.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">{client.companyName}</h3>
                        <p className="text-sm text-slate-500">{client.contactName}</p>
                    </div>
                </div>
                <Badge variant={client.status === 'ACTIVE' ? 'success' : 'neutral'}>{client.status}</Badge>
            </div>
            
            <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm text-slate-600">
                    <Mail className="w-4 h-4 mr-2 text-slate-400" />
                    {client.email}
                </div>
                <div className="flex items-center text-sm text-slate-600">
                    <Building className="w-4 h-4 mr-2 text-slate-400" />
                    Active Partner
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex gap-3">
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleViewProjects(client)}>
                    <Briefcase className="w-3 h-3 mr-2" />
                    Projects
                </Button>
                <Button size="sm" className="w-full" onClick={() => handleMessage(client)}>
                    <MessageSquare className="w-3 h-3 mr-2" />
                    Message
                </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Client">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700">Company Name</label>
                  <Input required value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Inc." />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700">Contact Person</label>
                  <Input required value={contactName} onChange={e => setContactName(e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700">Email Address</label>
                  <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@acme.com" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Client'}</Button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default ClientList;
