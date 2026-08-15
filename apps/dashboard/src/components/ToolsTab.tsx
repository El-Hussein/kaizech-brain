import { useState, useEffect } from 'react';
import { Wrench, Play, Plus, Code, Edit2, RotateCcw, Info, Trash2 } from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/Button';

interface ToolsProps {
  apiKey: string;
}

function generateSampleParams(parametersSchema: any): string {
  if (!parametersSchema || typeof parametersSchema !== 'object') {
    return '{\n}';
  }
  const props = parametersSchema.properties || parametersSchema;
  if (!props || typeof props !== 'object' || Object.keys(props).length === 0) {
    return '{\n}';
  }

  const sample: Record<string, any> = {};
  for (const [key, value] of Object.entries<any>(props)) {
    const propType = value?.type || 'string';
    const desc = value?.description || '';

    if (propType === 'integer' || propType === 'number') {
      if (desc.includes('e.g.')) {
        const eg = desc.split('e.g.')[1].replace(/[()]/g, '').trim();
        const parsed = parseInt(eg, 10);
        sample[key] = isNaN(parsed) ? 42 : parsed;
      } else {
        sample[key] = key.toLowerCase().includes('id') ? 42 : 100;
      }
    } else if (propType === 'boolean') {
      sample[key] = true;
    } else if (propType === 'array') {
      sample[key] = [];
    } else {
      if (desc.includes('e.g.')) {
        const eg = desc.split('e.g.')[1].replace(/[()]/g, '').trim();
        sample[key] = eg;
      } else if (key.toLowerCase().includes('email')) {
        sample[key] = 'user@example.com';
      } else if (key.toLowerCase().includes('phone')) {
        sample[key] = '201000000000';
      } else {
        sample[key] = `sample_${key}`;
      }
    }
  }

  return JSON.stringify(sample, null, 2);
}

export const ToolsTab: React.FC<ToolsProps> = ({ apiKey }) => {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Manifest form state
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [httpMethod, setHttpMethod] = useState('POST');
  const [parametersJson, setParametersJson] = useState(
    '{\n  "type": "object",\n  "properties": {\n    "user_id": { "type": "integer", "description": "The unique ID of the user (e.g. 42)" },\n    "phone": { "type": "string", "description": "User mobile phone number" },\n    "email": { "type": "string", "description": "User email address" }\n  }\n}'
  );

  // Tool Tester State
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [testToolName, setTestToolName] = useState('');
  const [testParamsJson, setTestParamsJson] = useState('{\n}');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchTools(page);
  }, [fetchTools, page]);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchTools = useCallback(async (p = page) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/tools?page=${p}&limit=${limit}`, {
        headers: { 'x-api-key': apiKey },
      });
      const toolList = Array.isArray(res.data) ? res.data : (res.data?.data && Array.isArray(res.data.data) ? res.data.data : []);
      setTools(toolList);
      if (res.data?.total !== undefined) {
        setTotal(res.data.total);
      } else {
        setTotal(toolList.length);
      }

      if (toolList.length > 0) {
        const firstTool = toolList[0];
        setSelectedTool(firstTool);
        setTestToolName(firstTool.name);
        setTestParamsJson(generateSampleParams(firstTool.parameters));
      }
    } catch {
      // Fallback Mock data
      const mockTools = [
        {
          id: '1',
          name: 'getUserInfo',
          description: 'Fetch user profile details, role, status, ticket size, and primary address',
          apiEndpoint: 'https://api-stg.markoontest.online/api/chatbot/getUserInfo',
          httpMethod: 'POST',
          parameters: {
            type: 'object',
            properties: {
              user_id: { type: 'integer', description: 'The unique ID of the user (e.g. 42)' },
              phone: { type: 'string', description: 'User mobile phone number (e.g. 201000000000)' },
              email: { type: 'string', description: 'User email address' },
            },
          },
        },
      ];
      setTools(mockTools);
      setSelectedTool(mockTools[0]);
      setTestToolName('getUserInfo');
      setTestParamsJson(generateSampleParams(mockTools[0].parameters));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectToolForTest = (toolName: string) => {
    setTestToolName(toolName);
    const found = tools.find((t) => t.name === toolName);
    if (found) {
      setSelectedTool(found);
      setTestParamsJson(generateSampleParams(found.parameters));
    } else {
      setSelectedTool(null);
    }
    setTestResult(null);
  };

  const handleEditToolClick = (tool: any) => {
    setEditingToolId(tool.id || tool.name);
    setName(tool.name);
    setDescription(tool.description || '');
    setApiEndpoint(tool.apiEndpoint || '');
    setHttpMethod(tool.httpMethod || 'POST');
    setParametersJson(
      typeof tool.parameters === 'string'
        ? tool.parameters
        : JSON.stringify(tool.parameters || {}, null, 2)
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingToolId(null);
    setName('');
    setDescription('');
    setApiEndpoint('');
    setHttpMethod('POST');
    setParametersJson(
      '{\n  "type": "object",\n  "properties": {\n    "user_id": { "type": "integer", "description": "The unique ID of the user (e.g. 42)" },\n    "phone": { "type": "string", "description": "User mobile phone number" },\n    "email": { "type": "string", "description": "User email address" }\n  }\n}'
    );
  };

  const handleRegisterTool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(parametersJson);
      } catch {
        alert('Invalid JSON parameters schema');
        return;
      }

      await axios.post(
        '/api/v1/tools',
        {
          name,
          description,
          apiEndpoint,
          httpMethod,
          parameters: parsedParams,
        },
        { headers: { 'x-api-key': apiKey } }
      );

      alert(`Tool '${name}' ${editingToolId ? 'updated' : 'registered'} successfully!`);
      handleCancelEdit();
      fetchTools();
    } catch (err: any) {
      alert(`Tool operation failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteTool = async (toolIdOrName: string, toolName: string) => {
    if (!window.confirm(`Are you sure you want to delete the tool '${toolName}'?`)) {
      return;
    }
    try {
      await axios.delete(`/api/v1/tools/${toolIdOrName}`, {
        headers: { 'x-api-key': apiKey },
      });
      alert(`Tool '${toolName}' deleted successfully.`);
      fetchTools();
    } catch (err: any) {
      alert(`Failed to delete tool: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleTestTool = async () => {
    if (!testToolName) return;
    try {
      setTesting(true);
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(testParamsJson);
      } catch {
        alert('Invalid Test Parameters JSON');
        setTesting(false);
        return;
      }

      const res = await axios.post(
        '/api/v1/tools/test',
        { toolName: testToolName, parameters: parsedParams },
        { headers: { 'x-api-key': apiKey } }
      );

      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({ error: err.response?.data?.message || err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleResetSampleBody = () => {
    if (selectedTool) {
      setTestParamsJson(generateSampleParams(selectedTool.parameters));
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Tool Manager & Tool Tester</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
          Expose business APIs to your AI Agent via Tool Manifests and test them interactively.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Column: Tool Registration / Edit */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editingToolId ? (
                <>
                  <Edit2 size={18} color="var(--accent-amber)" /> Edit Tool Manifest: <span style={{ color: 'var(--accent-amber)' }}>{name}</span>
                </>
              ) : (
                <>
                  <Plus size={18} color="var(--accent-primary)" /> Register Tool Manifest
                </>
              )}
            </h3>
            {editingToolId && (
              <Button
                type="button"
                onClick={handleCancelEdit}
                variant="secondary"
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                <RotateCcw size={13} /> Cancel Edit
              </Button>
            )}
          </div>

          <form onSubmit={handleRegisterTool} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Function Name</label>
              <input
                type="text"
                placeholder="e.g. getUserInfo or getAuction"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Description</label>
              <input
                type="text"
                placeholder="What does this function do?"
                className="input-field"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Customer API Endpoint (Relative Path)</label>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                The tenant's Base URL will be automatically prepended. You can still use a full URL if needed.
              </div>
              <input
                type="text"
                placeholder="/api/chatbot/getUserInfo"
                className="input-field"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>HTTP Method</label>
              <select className="input-field" value={httpMethod} onChange={(e) => setHttpMethod(e.target.value)}>
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>JSON Schema Parameters</label>
              <textarea
                className="input-field"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', minHeight: '130px' }}
                value={parametersJson}
                onChange={(e) => setParametersJson(e.target.value)}
              />
            </div>

            <Button type="submit" variant="primary" style={{ marginTop: '8px' }}>
              <Wrench size={16} /> {editingToolId ? 'Save & Update Tool Manifest' : 'Register Tool Manifest'}
            </Button>
          </form>
        </div>

        {/* Right Column: Interactive Tool Tester */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Play size={18} color="var(--accent-emerald)" /> Interactive Tool Tester
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Select Tool to Test</label>
              <select
                className="input-field"
                value={testToolName}
                onChange={(e) => handleSelectToolForTest(e.target.value)}
              >
                {tools.map((t) => (
                  <option key={t.id || t.name} value={t.name}>
                    {t.name} ({t.httpMethod})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Tool Parameters Schema Info Box */}
            {selectedTool && selectedTool.parameters && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px dashed var(--border-glass)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '12px',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Info size={14} /> Accepted Tool Parameters:
                </div>
                {selectedTool.parameters.properties ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {Object.entries<any>(selectedTool.parameters.properties).map(([pName, pVal]) => (
                      <div key={pName} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                        <code style={{ color: '#60a5fa', fontWeight: 700 }}>{pName}</code>
                        <span style={{ fontSize: '11px', color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                          {pVal?.type || 'string'}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                          {pVal?.description || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre style={{ fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(selectedTool.parameters, null, 2)}
                  </pre>
                )}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Input Parameters (JSON Body)</label>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResetSampleBody}
                  style={{ color: 'var(--accent-primary)', fontSize: '12px', padding: '2px 6px', height: 'auto', gap: '4px' }}
                >
                  <RotateCcw size={12} /> Auto-fill Sample Body
                </Button>
              </div>
              <textarea
                className="input-field"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', minHeight: '100px' }}
                value={testParamsJson}
                onChange={(e) => setTestParamsJson(e.target.value)}
              />
            </div>

            <Button variant="primary" onClick={handleTestTool} loading={testing} loadingText="Executing API Call...">
              <Play size={16} /> Execute Tool Call
            </Button>

            {testResult && (
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Execution Response
                </label>
                <pre className="code-block" style={{ fontSize: '12px', maxHeight: '240px', overflowY: 'auto' }}>
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tools List */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code size={18} color="var(--accent-cyan)" /> Active Registered Tools ({tools.length})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {tools.map((tool) => (
            <div
              key={tool.id || tool.name}
              style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--accent-primary)' }}>{tool.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-purple">{tool.httpMethod}</span>
                  <Button
                    onClick={() => handleEditToolClick(tool)}
                    variant="secondary"
                    style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Edit tool details"
                  >
                    <Edit2 size={13} /> Edit
                  </Button>
                  <Button
                    onClick={() => handleDeleteTool(tool.id || tool.name, tool.name)}
                    variant="danger"
                    style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                    title="Delete tool manifest"
                  >
                    <Trash2 size={13} /> Delete
                  </Button>
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>{tool.description}</p>

              <div style={{ fontSize: '12px', color: 'var(--text-dim)', wordBreak: 'break-all' }}>
                <strong>Endpoint:</strong> {tool.apiEndpoint}
              </div>

              {/* Parameter properties display */}
              {tool.parameters && tool.parameters.properties && (
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Parameters:</div>
                  {Object.entries<any>(tool.parameters.properties).map(([pName, pVal]) => (
                    <div key={pName} style={{ display: 'flex', gap: '6px', margin: '2px 0' }}>
                      <code style={{ color: '#60a5fa' }}>{pName}</code>
                      <span style={{ color: '#a78bfa' }}>({pVal?.type || 'string'})</span>
                      <span style={{ color: 'var(--text-dim)' }}>— {pVal?.description || ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination UI */}
        {total > limit && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
            <Button 
              variant="secondary" 
              disabled={page === 1 || loading}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Page {page} of {Math.ceil(total / limit)}
            </span>
            <Button 
              variant="secondary" 
              disabled={page >= Math.ceil(total / limit) || loading}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
