import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Link as LinkIcon, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Plus, 
  Copy, 
  Check, 
  ArrowUpRight,
  ExternalLink,
  Mail
} from 'lucide-react';
import api from '../../services/api';
import { RegistrationLink, EmployeeSummary } from '../../types';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    total_links: 0,
    total_registered: 0,
    pending_submissions: 0,
    completed_submissions: 0,
    approved_employees: 0,
    rejected_submissions: 0,
  });

  const [recentLinks, setRecentLinks] = useState<RegistrationLink[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Link generation modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isCompanyLinkMode, setIsCompanyLinkMode] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [expiryDays, setExpiryDays] = useState('0'); // 0 = Never expires
  const [genLoading, setGenLoading] = useState(false);
  const [generatedLinkData, setGeneratedLinkData] = useState<{ url: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, linksRes, empRes] = await Promise.all([
        api.get('/hr/stats'),
        api.get('/hr/registration-links'),
        api.get('/hr/employees')
      ]);

      setStats(statsRes.data);
      setRecentLinks(linksRes.data.links.slice(0, 5));
      setRecentSubmissions(empRes.data.employees.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenLoading(true);
    try {
      const res = await api.post('/hr/registration-links', {
        is_company_link: isCompanyLinkMode,
        employee_email: isCompanyLinkMode ? 'all-employees@company.internal' : email,
        employee_name: isCompanyLinkMode ? 'Company-Wide Onboarding' : name,
        expiry_days: parseInt(expiryDays)
      });
      const origin = window.location.origin;
      const fullUrl = `${origin}/register/${res.data.link.token}`;
      setGeneratedLinkData({ url: fullUrl, token: res.data.link.token });
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate link');
    } finally {
      setGenLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statCards = [
    { label: 'Total Links Generated', value: stats.total_links, icon: LinkIcon, color: 'text-white' },
    { label: 'Total Employees Registered', value: stats.total_registered, icon: Users, color: 'text-white' },
    { label: 'Pending Submissions', value: stats.pending_submissions, icon: Clock, color: 'text-amber-400' },
    { label: 'Completed Submissions', value: stats.completed_submissions, icon: FileText, color: 'text-neutral-300' },
    { label: 'Approved Employees', value: stats.approved_employees, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Rejected Submissions', value: stats.rejected_submissions, icon: XCircle, color: 'text-rose-400' },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">HR Admin Overview</h2>
          <p className="text-neutral-400 text-sm mt-1">Real-time metrics, generated links, and incoming candidate records.</p>
        </div>
        <button
          onClick={() => {
            setGeneratedLinkData(null);
            setEmail('');
            setName('');
            setShowGenerateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-neutral-200 shadow transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Employee Link</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Tables Dual Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Generated Links */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Active & Recent Links</h3>
            <a href="/admin/links" className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/60 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Candidate / Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {recentLinks.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-neutral-500">No links generated yet.</td>
                  </tr>
                ) : (
                  recentLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-neutral-800/30 transition">
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{link.employee_name || 'Not Specified'}</div>
                        <div className="text-neutral-500 text-[11px]">{link.employee_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          link.status === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          link.status === 'Submitted' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                          'bg-neutral-800 text-neutral-400'
                        }`}>
                          {link.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleCopy(`${window.location.origin}/register/${link.token}`)}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Recent Onboarding Submissions</h3>
            <a href="/admin/employees" className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/60 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {recentSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-neutral-500">No submissions received yet.</td>
                  </tr>
                ) : (
                  recentSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-neutral-800/30 transition">
                      <td className="py-3 px-4 font-mono font-medium text-white">{sub.reference_id}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{sub.employee_name}</div>
                        <div className="text-neutral-500 text-[11px]">{sub.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          sub.status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          sub.status === 'Correction Required' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          sub.status === 'Rejected' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                          'bg-neutral-800 text-neutral-300'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`/admin/employees/${sub.id}`}
                          className="px-2.5 py-1 bg-white text-black font-semibold rounded hover:bg-neutral-200 transition inline-flex items-center gap-1"
                        >
                          Review
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate Link Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Create Registration Link</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Generate a universal company-wide registration link or an individual employee link.
            </p>

            {/* Link Type Toggle Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 border border-neutral-800 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setIsCompanyLinkMode(true)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition ${
                  isCompanyLinkMode
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                🌐 Whole Company (Single Link)
              </button>
              <button
                type="button"
                onClick={() => setIsCompanyLinkMode(false)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition ${
                  !isCompanyLinkMode
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                👤 Individual Candidate
              </button>
            </div>

            {!generatedLinkData ? (
              <form onSubmit={handleGenerateLink} className="space-y-4">
                {isCompanyLinkMode ? (
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 space-y-2">
                    <p className="font-semibold text-white">✨ Company-Wide Universal Link:</p>
                    <p className="text-neutral-400 text-[11px] leading-relaxed">
                      This single link can be published or shared with all incoming employees. Each new hire who opens the link completes their independent onboarding profile, uploads documents, and submits directly to your HR dashboard!
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">Employee Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="alex@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">Employee Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="Alex Morgan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-white"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Link Expiration (Optional)
                  </label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                  >
                    <option value="0">Never Expires (Recommended for Company Link)</option>
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="365">1 Year</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={genLoading}
                    className="px-5 py-2 bg-white text-black font-semibold text-sm rounded-lg hover:bg-neutral-200 transition"
                  >
                    {genLoading ? 'Generating...' : isCompanyLinkMode ? 'Get Company Link' : 'Generate Link'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[11px] font-medium text-neutral-400 block mb-1">Generated URL:</span>
                  <div className="font-mono text-xs text-white break-all bg-neutral-900 p-2.5 rounded border border-neutral-800">
                    {generatedLinkData.url}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleCopy(generatedLinkData.url)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={`mailto:${email}?subject=Employee Onboarding Registration Link&body=Hello,%0D%0A%0D%0APlease complete your official onboarding registration by opening the secure link below:%0D%0A${generatedLinkData.url}`}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-800 text-white font-medium text-xs rounded-lg hover:bg-neutral-700 transition"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Share via Email</span>
                  </a>
                  <a
                    href={generatedLinkData.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center p-2.5 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition"
                    title="Open Registration Form"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="pt-4 border-t border-neutral-800 flex justify-end">
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

