import React, { useState, useEffect } from 'react';
import { Plus, ToggleLeft, ToggleRight, Trash2, Edit2, Play, Save, X } from 'lucide-react';
import axios from 'axios';

interface WorkflowNode {
  id: string;
  type: string;
  endpoint?: string;
  message?: string;
  next?: string;
}

interface Workflow {
  id: string;
  name: string;
  triggerKeywords: string[];
  semanticIntent?: string;
  nodes: WorkflowNode[];
  isActive: boolean;
  isDraft: boolean;
  executionCount: number;
  completionCount: number;
}

interface Props {
  tenantId: string;
  apiKey: string;
}

export function WorkflowsTab({ tenantId, apiKey }: Props) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  const fetchWorkflows = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/workflows`, {
        headers: { 'x-tenant-slug': tenantId, 'x-api-key': apiKey }
      });
      setWorkflows(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [tenantId]);

  const handleToggleActive = async (workflow: Workflow) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/workflows/${workflow.id}`, 
      { isActive: !workflow.isActive },
      { headers: { 'x-tenant-slug': tenantId, 'x-api-key': apiKey } });
      fetchWorkflows();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/workflows/${id}`, 
      { headers: { 'x-tenant-slug': tenantId, 'x-api-key': apiKey } });
      fetchWorkflows();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!editingWorkflow) return;
    try {
      if (editingWorkflow.id) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/workflows/${editingWorkflow.id}`, 
        editingWorkflow,
        { headers: { 'x-tenant-slug': tenantId, 'x-api-key': apiKey } });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/workflows`, 
        editingWorkflow,
        { headers: { 'x-tenant-slug': tenantId, 'x-api-key': apiKey } });
      }
      setEditingWorkflow(null);
      fetchWorkflows();
    } catch (err) {
      console.error(err);
      alert('Error saving workflow');
    }
  };

  if (loading) return <div className="p-8">Loading Workflows...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kaizech FlowStudio™</h1>
          <p className="text-gray-500 mt-1">Design deterministic conversational journeys.</p>
        </div>
        <button 
          onClick={() => setEditingWorkflow({ id: '', name: 'New Workflow', triggerKeywords: ['menu'], nodes: [], isActive: true, isDraft: true, executionCount: 0, completionCount: 0 })}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </button>
      </div>

      {editingWorkflow ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Editing: {editingWorkflow.name}</h2>
            <button onClick={() => setEditingWorkflow(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-700" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
              <input type="text" className="w-full p-2 border rounded-lg" value={editingWorkflow.name} onChange={e => setEditingWorkflow({...editingWorkflow, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Keywords (comma separated)</label>
              <input type="text" className="w-full p-2 border rounded-lg" value={editingWorkflow.triggerKeywords.join(', ')} onChange={e => setEditingWorkflow({...editingWorkflow, triggerKeywords: e.target.value.split(',').map(s => s.trim())})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nodes (JSON Format for MVP)</label>
              <textarea className="w-full p-4 border rounded-lg font-mono text-sm" rows={8} value={JSON.stringify(editingWorkflow.nodes, null, 2)} onChange={e => {
                try {
                  setEditingWorkflow({...editingWorkflow, nodes: JSON.parse(e.target.value)});
                } catch(err) {
                  // ignoring parse error while typing
                }
              }} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => setEditingWorkflow(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" /> Save Workflow
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {workflows.map(workflow => (
            <div key={workflow.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div>
                <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{workflow.triggerKeywords.join(', ')}</span>
                  <span className="text-xs text-gray-400">{workflow.executionCount} Executions</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleToggleActive(workflow)}>
                  {workflow.isActive ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                </button>
                <button onClick={() => setEditingWorkflow(workflow)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(workflow.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {workflows.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500">No workflows found. Create your first automated journey!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
