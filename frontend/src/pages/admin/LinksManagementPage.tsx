import React, { useState, useEffect } from 'react';
import { Plus, Copy, Check, ExternalLink, RefreshCw, AlertCircle, Ban } from 'lucide-react';
import api from '../../services/api';
import { RegistrationLink } from '../../types';

export const LinksManagementPage: React.FC = () => {
  const [links, setLinks] = useState<RegistrationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isCompanyLinkMode, setIsCompanyLinkMode] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [expiryDays, setExpiryDays] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hr/registration-links');
      setLinks(res.data.links);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/hr/registration-links', {
        is_company_link: isCompanyLinkMode,
        employee_email: isCompanyLinkMode ? 'all-employees@company.internal' : email,
        employee_name: isCompanyLinkMode ? 'Company-Wide Onboarding' : name,
        expiry_days: parseInt(expiryDays)
      });
      setShowModal(false);
      setEmail('');
      setName('');
      fetchLinks();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!window.confirm('Are you sure you want to revoke this link? The candidate will no longer be able to submit.')) {
      return;
    }
    try {
      await api.patch(`/hr/registration-links/${id}/revoke`);
      fetchLinks();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to revoke link');
    }
  };

  const copyUrl = (token: string, id: number) => {
    const url = `${window.location.origin}/register/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Employee Registration Links</h2>
          <p className="text-neutral-400 text-sm mt-1">
            Generate and manage access tokens. Tokens allow candidate onboarding without login credentials.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLinks}
            className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Refresh links"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold text-sm rounded-lg hover:bg-neutral-200 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Link</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Candidate Info</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500">Loading links...</td>
                </tr>
              ) : links.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500">No registration links created yet.</td>
                </tr>
              ) : (
                links.map((link) => (
                  <tr key={link.id} className="hover:bg-neutral-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white text-sm">{link.employee_name || 'N/A'}</div>
                      <div className="text-neutral-500 font-mono text-[11px]">{link.employee_email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        link.status === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        link.status === 'Submitted' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                        link.status === 'Revoked' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        'bg-neutral-800 text-neutral-400'
                      }`}>
                        {link.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      {new Date(link.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      {link.expires_at ? new Date(link.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyUrl(link.token, link.id)}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center gap-1.5 transition"
                          title="Copy Link URL"
                        >
                          {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === link.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        <a
                          href={`/register/${link.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition"
                          title="Open Form"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {link.status === 'Active' && (
                          <button
                            onClick={() => handleRevoke(link.id)}
                            className="p-1 bg-red-950/40 border border-red-900 text-red-400 hover:bg-red-900/60 rounded transition"
                            title="Revoke Token"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Create Registration Link</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Select between a shared company-wide link or an individual employee link.
            </p>

            {/* Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 border border-neutral-800 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setIsCompanyLinkMode(true)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition ${
                  isCompanyLinkMode
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                🌐 Whole Company
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
                👤 Individual
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {isCompanyLinkMode ? (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
                  <p className="font-semibold text-white mb-1">Universal Onboarding URL</p>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    One single permanent link that can be shared with all new hires. Each submission creates a new employee profile in your dashboard.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Employee Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="employee@corp.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Employee Full Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-white"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Validity Period (Optional)</label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                >
                  <option value="0">Never Expires</option>
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                  <option value="365">1 Year</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition"
                >
                  {submitting ? 'Generating...' : isCompanyLinkMode ? 'Create Company Link' : 'Create Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

