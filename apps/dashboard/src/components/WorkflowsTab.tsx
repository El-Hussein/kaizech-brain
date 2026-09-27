import React, { useState, useEffect } from 'react';
import { Plus, ToggleLeft, ToggleRight, Trash2, Edit2, Save, X, GitMerge } from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/Button';

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
  nodes: any[];
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
  
  // Local string state for the text area so it doesn't snap back on invalid JSON
  const [jsonText, setJsonText] = useState("[]");

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
      const payload = {
        name: workflow.name,
        triggerKeywords: workflow.triggerKeywords,
        nodes: workflow.nodes,
        isActive: !workflow.isActive,
        isDraft: workflow.isDraft
      };
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/workflows/${workflow.id}`, 
      payload,
      { headers: { 'x-tenant-slug': tenantId, 'x-api-key': apiKey } });
      fetchWorkflows();
    } catch (err: any) {
      console.error(err.response?.data || err);
      alert(`Error updating workflow: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/workflows/${id}`, 
      { headers: { 'x-tenant-slug': tenantId, 'x-api-key': apiKey } });
      fetchWorkflows();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setJsonText(JSON.stringify(workflow.nodes, null, 2));
  };

  const handleSave = async () => {
    if (!editingWorkflow) return;
    
    // Parse the JSON text right before saving
    let parsedNodes: any[];
    try {
      parsedNodes = JSON.parse(jsonText);
      if (!Array.isArray(parsedNodes)) throw new Error("Nodes must be a valid JSON array.");
    } catch (e: any) {
      alert(`Invalid JSON: ${e.message}`);
      return;
    }

    try {
      const payload = {
        name: editingWorkflow.name,
        triggerKeywords: editingWorkflow.triggerKeywords,
        nodes: parsedNodes,
        isActive: editingWorkflow.isActive,
        isDraft: editingWorkflow.isDraft
      };

      if (editingWorkflow.id) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/workflows/${editingWorkflow.id}`, 
        payload,
        { headers: { 'x-tenant-slug': tenantId, 'x-api-key': apiKey } });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/workflows`, 
        payload,
        { headers: { 'x-tenant-slug': tenantId, 'x-api-key': apiKey } });
      }
      setEditingWorkflow(null);
      fetchWorkflows();
    } catch (err: any) {
      console.error(err.response?.data || err);
      alert(`Error saving workflow: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        Loading Workflows...
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Kaizech FlowStudio™</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            Design deterministic conversational journeys and connect API steps natively.
          </p>
        </div>
        {!editingWorkflow && (
          <Button
            variant="primary"
            onClick={() => startEditing({ id: '', name: 'New Workflow', triggerKeywords: ['menu'], nodes: [], isActive: true, isDraft: true, executionCount: 0, completionCount: 0 })}
            style={{ gap: '8px' }}
          >
            <Plus size={16} /> Create Workflow
          </Button>
        )}
      </div>

      {editingWorkflow ? (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
              {editingWorkflow.id ? 'Edit Workflow' : 'New Workflow'}
            </h3>
            <button onClick={() => setEditingWorkflow(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Workflow Name</label>
              <input
                className="input-field"
                type="text"
                placeholder="e.g. Lead Qualification"
                value={editingWorkflow.name}
                onChange={e => setEditingWorkflow({...editingWorkflow, name: e.target.value})}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Trigger Keywords (comma separated)</label>
              <input
                className="input-field"
                type="text"
                placeholder="e.g. menu, start, pricing"
                value={editingWorkflow.triggerKeywords.join(', ')}
                onChange={e => setEditingWorkflow({...editingWorkflow, triggerKeywords: e.target.value.split(',').map(s => s.trim())})}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Nodes (JSON Format for MVP)</label>
              <textarea
                className="input-field"
                style={{ fontFamily: 'var(--font-mono)', minHeight: '300px', fontSize: '13px' }}
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <Button variant="ghost" onClick={() => setEditingWorkflow(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} style={{ gap: '8px' }}>
                <Save size={16} /> Save Workflow
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {workflows.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderStyle: 'dashed' }}>
              <GitMerge size={32} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>No workflows created yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Create your first automated journey to guide your users.</p>
            </div>
          ) : (
            workflows.map(workflow => (
              <div key={workflow.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{workflow.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', background: 'rgba(29, 61, 132, 0.1)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 500 }}>
                      {workflow.triggerKeywords.join(', ')}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      • {workflow.executionCount} Executions
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={() => handleToggleActive(workflow)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                    title={workflow.isActive ? "Deactivate" : "Activate"}
                  >
                    {workflow.isActive ? <ToggleRight size={28} color="var(--accent-emerald)" /> : <ToggleLeft size={28} color="var(--text-muted)" />}
                  </button>
                  <Button variant="secondary" onClick={() => startEditing(workflow)} style={{ padding: '8px' }}>
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(workflow.id)} style={{ padding: '8px' }}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
