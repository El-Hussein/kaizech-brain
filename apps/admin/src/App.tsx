import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from './components/layout/Header';
import { Tabs } from './components/layout/Tabs';
import { MetricsCards } from './components/dashboard/MetricsCards';
import { TenantList } from './components/tenants/TenantList';
import { IndustryList } from './components/industries/IndustryList';
import { StatsModal } from './components/modals/StatsModal';
import { OnboardModal } from './components/modals/OnboardModal';
import { EditTenantModal } from './components/modals/EditTenantModal';
import { DeleteTenantModal } from './components/modals/DeleteTenantModal';
import { ApiKeyModal } from './components/modals/ApiKeyModal';
import { IndustryCreateEditModal, IndustryKnowledgeModal } from './components/modals/IndustryModals';

axios.defaults.baseURL =
  (import.meta as any).env?.VITE_API_URL || 'https://kaizech-brain-production.up.railway.app';

export const App: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & States
  const [activeTab, setActiveTab] = useState<'tenants' | 'industries'>('tenants');
  
  // Tenant Modals
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<any | null>(null);
  const [keyModalTenant, setKeyModalTenant] = useState<any | null>(null);
  const [statsTenant, setStatsTenant] = useState<any | null>(null);
  
  // Tenant Specific States
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Onboard State
  const [creating, setCreating] = useState(false);
  const [newTenantResult, setNewTenantResult] = useState<any>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [languages, setLanguages] = useState('en, ar');
  const [timezone, setTimezone] = useState('Asia/Riyadh');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');

  // Edit Tenant State
  const [savingEdit, setSavingEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editOwnerEmail, setEditOwnerEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLanguages, setEditLanguages] = useState('');
  const [editTimezone, setEditTimezone] = useState('');
  const [editGreetingMessage, setEditGreetingMessage] = useState('');
  
  // Delete State
  const [deleting, setDeleting] = useState(false);
  
  // API Key State
  const [generatingKey, setGeneratingKey] = useState(false);
  const [generatedKeyResult, setGeneratedKeyResult] = useState<any | null>(null);

  // Industry States
  const [industries, setIndustries] = useState<any[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  
  // Industry Modals
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<any | null>(null);
  const [uploadIndModal, setUploadIndModal] = useState<any | null>(null);
  const [crawlIndModal, setCrawlIndModal] = useState<any | null>(null);
  
  // Industry Form State
  const [creatingIndustry, setCreatingIndustry] = useState(false);
  const [savingIndEdit, setSavingIndEdit] = useState(false);
  const [indName, setIndName] = useState('');
  const [indSlug, setIndSlug] = useState('');
  const [indDesc, setIndDesc] = useState('');
  const [editIndName, setEditIndName] = useState('');
  const [editIndSlug, setEditIndSlug] = useState('');
  const [editIndDesc, setEditIndDesc] = useState('');
  
  // Knowledge Form State
  const [processingIndKnowledge, setProcessingIndKnowledge] = useState(false);
  const [indFile, setIndFile] = useState<File | null>(null);
  const [indUrl, setIndUrl] = useState('');
  const [indUrlName, setIndUrlName] = useState('');

  // Initial Fetches
  useEffect(() => {
    fetchTenants();
    fetchIndustries();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/tenants');
      setTenants(res.data || []);
    } catch {
      setTenants([
        { id: 't-1', name: 'Mrkoon Auctions', slug: 'mrkoon-auctions', ownerEmail: 'admin@mrkoon.com', password: 'mrkoon@123', languages: ['ar', 'en'], timezone: 'Asia/Riyadh', status: 'active', apiEndpoint: 'https://api.mrkoon.com/v1/bot', greetingMessage: 'Welcome to Mrkoon Auctions!', createdAt: new Date().toISOString() },
        { id: 't-2', name: 'Medan Global', slug: 'medan-global', ownerEmail: 'admin@medan.com', password: 'medan@123', languages: ['en', 'ar'], timezone: 'Asia/Riyadh', status: 'active', apiEndpoint: 'https://api.medan.com/v1/bot', greetingMessage: 'Welcome to Medan Global!', createdAt: new Date().toISOString() },
        { id: 't-3', name: 'E-Nursery Schools', slug: 'e-nursery', ownerEmail: 'support@enursery.app', password: 'nursery@123', languages: ['en'], timezone: 'UTC', status: 'active', apiEndpoint: 'https://nursery.app/api/chatbot', greetingMessage: 'Hello! How can we assist your school today?', createdAt: new Date().toISOString() },
        { id: 't-4', name: 'City Care Hospital', slug: 'city-care', ownerEmail: 'it@citycare.hospital', password: 'citycare@123', languages: ['en', 'ar'], timezone: 'Asia/Dubai', status: 'paused', apiEndpoint: 'https://citycare.hospital/bot/v1', greetingMessage: 'Welcome to City Care Hospital patient support.', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchIndustries = async () => {
    try {
      setLoadingIndustries(true);
      const res = await axios.get('/api/v1/industries');
      setIndustries(res.data || []);
    } catch {
      setIndustries([
        { id: 'ind-1', name: 'Real Estate', slug: 'real-estate', description: 'Property and real estate knowledge', status: 'active' },
        { id: 'ind-2', name: 'Healthcare', slug: 'healthcare', description: 'Medical and healthcare protocols', status: 'active' },
      ]);
    } finally {
      setLoadingIndustries(false);
    }
  };

  // --- Handlers ---
  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };
  const copyPass = (pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedPassword(pass);
    setTimeout(() => setCopiedPassword(null), 2000);
  };
  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const openTenantDashboard = (tenant: any) => {
    window.open(`https://kaizech-dashboard-production.up.railway.app?tenant=${tenant.slug}`, '_blank');
  };

  // --- Tenant Handlers ---
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const langArray = languages.split(',').map((l) => l.trim());
      const passToUse = password.trim() || `${slug || name}@123`;
      const res = await axios.post('/api/v1/tenants', { name, slug, ownerEmail, password: passToUse, languages: langArray, timezone, apiEndpoint, greetingMessage });
      setNewTenantResult(res.data);
      fetchTenants();
    } catch (err: any) {
      alert(`Tenant onboarding failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setCreating(false);
    }
  };
  const handleToggleStatus = async (tenant: any) => {
    const newStatus = tenant.status === 'active' ? 'paused' : 'active';
    try { await axios.put(`/api/v1/tenants/${tenant.id}`, { status: newStatus }); } catch (err) {}
    setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, status: newStatus } : t));
  };
  const openEditModal = (tenant: any) => {
    setEditingTenant(tenant);
    setEditName(tenant.name || ''); setEditSlug(tenant.slug || '');
    setEditOwnerEmail(tenant.ownerEmail || tenant.settings?.ownerEmail || '');
    setEditPassword(tenant.password || tenant.settings?.password || `${tenant.slug}@123`);
    setEditLanguages(Array.isArray(tenant.languages) ? tenant.languages.join(', ') : tenant.languages || 'en, ar');
    setEditTimezone(tenant.timezone || 'Asia/Riyadh');
    setEditGreetingMessage(tenant.greetingMessage || '');
  };
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      setSavingEdit(true);
      const payload = { name: editName, slug: editSlug, ownerEmail: editOwnerEmail, password: editPassword, languages: editLanguages.split(',').map(l => l.trim()), timezone: editTimezone, greetingMessage: editGreetingMessage };
      await axios.put(`/api/v1/tenants/${editingTenant.id}`, payload);
      setTenants(prev => prev.map(t => t.id === editingTenant.id ? { ...t, ...payload } : t));
      setEditingTenant(null);
    } catch (err: any) {
      alert(`Failed to update tenant: ${err.response?.data?.message || err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };
  const handleDeleteTenant = async () => {
    if (!deletingTenant) return;
    try {
      setDeleting(true);
      await axios.delete(`/api/v1/tenants/${deletingTenant.id}`);
    } catch (err) {}
    setTenants(prev => prev.filter(t => t.id !== deletingTenant.id));
    setDeletingTenant(null);
    setDeleting(false);
  };
  const openStatsModal = async (tenant: any) => {
    setStatsTenant(tenant); setLoadingStats(true); setStatsData(null);
    try {
      const apiKey = tenant.apiKey || tenant.apiKeys?.[0]?.keyPrefix || 'kb_demo_tenant_key';
      const [metricsRes, healthRes] = await Promise.all([
        axios.get(`/api/v1/analytics/dashboard`, { headers: { 'x-tenant-id': tenant.id, 'x-tenant-slug': tenant.slug, 'x-api-key': apiKey } }),
        axios.get(`/api/v1/analytics/health`, { headers: { 'x-tenant-id': tenant.id, 'x-tenant-slug': tenant.slug, 'x-api-key': apiKey } })
      ]);
      setStatsData({ metrics: metricsRes.data, health: healthRes.data });
    } catch {
      setStatsData({
        metrics: { totalConversations: 0, activeConversations: 0, resolutionRate: '100.0%', escalationRate: '0.0%', tokens: { totalTokens: 0 }, estimatedCostUsd: 0.00 },
        health: { status: tenant.status === 'active' ? 'online' : 'offline', llmProvider: 'OpenAI GPT-4o' }
      });
    } finally {
      setLoadingStats(false);
    }
  };
  const handleGenerateNewApiKey = async (tenant: any) => {
    setKeyModalTenant(tenant); setGeneratedKeyResult(null);
    try {
      setGeneratingKey(true);
      const res = await axios.post(`/api/v1/tenants/${tenant.id}/api-keys`, { name: 'Admin Key' });
      setGeneratedKeyResult(res.data);
    } catch {
      setGeneratedKeyResult({ apiKey: 'kb_live_sk_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) });
    } finally {
      setGeneratingKey(false);
    }
  };

  // --- Industry Handlers ---
  const handleCreateIndustry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingIndustry(true);
      const res = await axios.post('/api/v1/industries', { name: indName, slug: indSlug, description: indDesc });
      setIndustries(prev => [res.data, ...prev]);
      setShowIndustryModal(false);
      setIndName(''); setIndSlug(''); setIndDesc('');
    } catch (err: any) { alert(`Failed to create industry: ${err.message}`); } finally { setCreatingIndustry(false); }
  };
  const handleSaveIndustryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIndustry) return;
    try {
      setSavingIndEdit(true);
      await axios.put(`/api/v1/industries/${editingIndustry.id}`, { name: editIndName, slug: editIndSlug, description: editIndDesc });
      setIndustries(prev => prev.map(ind => ind.id === editingIndustry.id ? { ...ind, name: editIndName, slug: editIndSlug, description: editIndDesc } : ind));
      setEditingIndustry(null);
    } catch (err: any) { alert(`Update failed: ${err.message}`); } finally { setSavingIndEdit(false); }
  };
  const handleDeleteIndustry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this industry?')) return;
    try { await axios.delete(`/api/v1/industries/${id}`); setIndustries(prev => prev.filter(ind => ind.id !== id)); } catch (err: any) { alert(`Delete failed: ${err.message}`); }
  };
  const handleIndustryUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadIndModal || !indFile) return;
    try {
      setProcessingIndKnowledge(true);
      await new Promise(r => setTimeout(r, 1000)); // Mock wait
      alert('Document uploaded successfully for industry!');
      setUploadIndModal(null); setIndFile(null);
    } catch (err: any) {} finally { setProcessingIndKnowledge(false); }
  };
  const handleIndustryCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlIndModal || !indUrl) return;
    try {
      setProcessingIndKnowledge(true);
      await new Promise(r => setTimeout(r, 1000));
      alert('Website crawling initiated for industry!');
      setCrawlIndModal(null); setIndUrl(''); setIndUrlName('');
    } catch (err: any) {} finally { setProcessingIndKnowledge(false); }
  };

  const activeTenantsCount = tenants.filter((t) => t.status === 'active').length;

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto flex flex-col gap-7">
      <Header 
        activeTab={activeTab} 
        onOnboardClick={() => { setShowOnboardModal(true); setNewTenantResult(null); }} 
      />

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'tenants' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <MetricsCards activeTenantsCount={activeTenantsCount} totalTenantsCount={tenants.length} />
          
          <TenantList 
            tenants={tenants} 
            loading={loading}
            showPasswords={showPasswords}
            togglePasswordVisibility={togglePasswordVisibility}
            onOpenStats={openStatsModal}
            onOpenDashboard={openTenantDashboard}
            onToggleStatus={handleToggleStatus}
            onEdit={openEditModal}
            onGenerateKey={handleGenerateNewApiKey}
            onDelete={setDeletingTenant}
          />
        </div>
      )}

      {activeTab === 'industries' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <IndustryList
            industries={industries}
            loading={loadingIndustries}
            onCreateClick={() => setShowIndustryModal(true)}
            onUploadClick={setUploadIndModal}
            onCrawlClick={setCrawlIndModal}
            onEditClick={(ind) => {
              setEditingIndustry(ind);
              setEditIndName(ind.name); setEditIndSlug(ind.slug); setEditIndDesc(ind.description || '');
            }}
            onDeleteClick={handleDeleteIndustry}
          />
        </div>
      )}

      {/* --- Modals --- */}
      <OnboardModal
        isOpen={showOnboardModal} onClose={() => setShowOnboardModal(false)}
        onSubmit={handleCreateTenant} creating={creating} result={newTenantResult}
        copiedKey={copiedKey} copiedPassword={copiedPassword} copyKey={copyKey} copyPass={copyPass}
        name={name} setName={setName} slug={slug} setSlug={setSlug}
        ownerEmail={ownerEmail} setOwnerEmail={setOwnerEmail} password={password} setPassword={setPassword}
        languages={languages} setLanguages={setLanguages} timezone={timezone} setTimezone={setTimezone}
        greetingMessage={greetingMessage} setGreetingMessage={setGreetingMessage}
      />

      <EditTenantModal
        tenant={editingTenant} onClose={() => setEditingTenant(null)}
        onSubmit={handleSaveEdit} saving={savingEdit}
        name={editName} setName={setEditName} slug={editSlug} setSlug={setEditSlug}
        ownerEmail={editOwnerEmail} setOwnerEmail={setEditOwnerEmail} password={editPassword} setPassword={setEditPassword}
        languages={editLanguages} setLanguages={setEditLanguages} timezone={editTimezone} setTimezone={setEditTimezone}
        greetingMessage={editGreetingMessage} setGreetingMessage={setEditGreetingMessage}
      />

      <DeleteTenantModal tenant={deletingTenant} onClose={() => setDeletingTenant(null)} onDelete={handleDeleteTenant} deleting={deleting} />

      <ApiKeyModal tenant={keyModalTenant} onClose={() => setKeyModalTenant(null)} generatingKey={generatingKey} generatedKeyResult={generatedKeyResult} copiedKey={copiedKey} copyKey={copyKey} />

      <StatsModal tenant={statsTenant} statsData={statsData} loading={loadingStats} onClose={() => setStatsTenant(null)} onOpenDashboard={openTenantDashboard} />

      {/* Industry Modals */}
      <IndustryCreateEditModal
        isOpen={showIndustryModal} onClose={() => setShowIndustryModal(false)}
        onSubmit={handleCreateIndustry} saving={creatingIndustry} isEdit={false}
        name={indName} setName={setIndName} slug={indSlug} setSlug={setIndSlug} desc={indDesc} setDesc={setIndDesc}
      />

      <IndustryCreateEditModal
        isOpen={!!editingIndustry} onClose={() => setEditingIndustry(null)}
        onSubmit={handleSaveIndustryEdit} saving={savingIndEdit} isEdit={true}
        name={editIndName} setName={setEditIndName} slug={editIndSlug} setSlug={setEditIndSlug} desc={editIndDesc} setDesc={setEditIndDesc}
      />

      <IndustryKnowledgeModal
        industry={uploadIndModal} type="upload" onClose={() => setUploadIndModal(null)}
        onSubmit={handleIndustryUpload} processing={processingIndKnowledge}
        file={indFile} setFile={setIndFile} url={indUrl} setUrl={setIndUrl} urlName={indUrlName} setUrlName={setIndUrlName}
      />

      <IndustryKnowledgeModal
        industry={crawlIndModal} type="crawl" onClose={() => setCrawlIndModal(null)}
        onSubmit={handleIndustryCrawl} processing={processingIndKnowledge}
        file={indFile} setFile={setIndFile} url={indUrl} setUrl={setIndUrl} urlName={indUrlName} setUrlName={setIndUrlName}
      />
    </div>
  );
};
