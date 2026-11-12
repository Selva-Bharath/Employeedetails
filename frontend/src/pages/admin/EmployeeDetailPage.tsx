import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Download, 
  FileText, 
  User, 
  GraduationCap, 
  Briefcase, 
  CreditCard, 
  Shield, 
  FileCheck2, 
  Clock,
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import { EmployeeFullProfile } from '../../types';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<EmployeeFullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'education' | 'employment' | 'bank' | 'statutory' | 'documents' | 'history'>('personal');

  // Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionComment, setCorrectionComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/hr/employees/${id}`);
      setProfile(res.data);
    } catch (err) {
      console.error(err);
      alert('Could not load employee details.');
      navigate('/admin/employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    setActionLoading(true);
    try {
      await api.patch(`/hr/employees/${id}/status`, { status: newStatus });
      fetchProfile();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionComment.trim()) return;
    setActionLoading(true);
    try {
      await api.post(`/hr/employees/${id}/request-correction`, { comment: correctionComment });
      setShowCorrectionModal(false);
      setCorrectionComment('');
      fetchProfile();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit correction request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get(`/hr/employees/${id}/export`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Employee_${profile?.submission.reference_id}.json`;
      a.click();
    } catch (err) {
      alert('Export failed.');
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { submission, link, personal, education, employment, bank, statutory, nominees, emergency_contacts, documents, history } = profile;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/employees')}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {personal.full_name || submission.employee_name || 'Candidate Dossier'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                submission.status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                submission.status === 'Rejected' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                submission.status === 'Correction Required' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                'bg-neutral-800 text-neutral-300'
              }`}>
                {submission.status}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
              <span className="font-mono text-white">Ref: {submission.reference_id}</span>
              <span>•</span>
              <span>Submitted: {submission.submission_date ? new Date(submission.submission_date).toLocaleString() : 'Draft'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs font-semibold rounded-lg hover:bg-neutral-800 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => setShowCorrectionModal(true)}
            disabled={actionLoading}
            className="px-3 py-2 bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-semibold rounded-lg hover:bg-amber-900/60 transition flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Request Correction</span>
          </button>

          <button
            onClick={() => handleStatusChange('Approved')}
            disabled={actionLoading}
            className="px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-500 transition flex items-center gap-1.5 shadow"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve Candidate</span>
          </button>

          <button
            onClick={() => handleStatusChange('Rejected')}
            disabled={actionLoading}
            className="px-3 py-2 bg-rose-950 border border-rose-800 text-rose-300 text-xs font-semibold rounded-lg hover:bg-rose-900 transition flex items-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-800 overflow-x-auto pb-1">
        {[
          { key: 'personal', label: 'Personal Information', icon: User },
          { key: 'education', label: `Education (${education.length})`, icon: GraduationCap },
          { key: 'employment', label: `Employment (${employment.length})`, icon: Briefcase },
          { key: 'bank', label: 'Bank Details', icon: CreditCard },
          { key: 'statutory', label: 'Statutory & Nominees', icon: Shield },
          { key: 'documents', label: `Documents (${documents.length})`, icon: FileCheck2 },
          { key: 'history', label: 'Audit Trail', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition whitespace-nowrap border-b-2 ${
                activeTab === tab.key
                  ? 'border-white text-white bg-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
              Candidate Identity & Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Full Legal Name</span>
                <span className="text-white font-medium text-sm mt-0.5 block">{personal.full_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Personal Email</span>
                <span className="text-white font-medium mt-0.5 block">{personal.personal_email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Mobile Number</span>
                <span className="text-white font-medium mt-0.5 block">{personal.mobile_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Alternate Mobile</span>
                <span className="text-white font-medium mt-0.5 block">{personal.alternate_mobile || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Date of Birth</span>
                <span className="text-white font-medium mt-0.5 block">{personal.dob || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Gender</span>
                <span className="text-white font-medium mt-0.5 block">{personal.gender || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Marital Status</span>
                <span className="text-white font-medium mt-0.5 block">{personal.marital_status || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Father's Name</span>
                <span className="text-white font-medium mt-0.5 block">{personal.father_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Mother's Name</span>
                <span className="text-white font-medium mt-0.5 block">{personal.mother_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Aadhaar Number</span>
                <span className="text-white font-medium mt-0.5 block">{personal.aadhaar_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">PAN Number</span>
                <span className="text-white font-medium mt-0.5 block">{personal.pan_number || 'N/A'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Current Address</span>
                <p className="text-neutral-300 mt-1 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  {personal.current_address || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Permanent Address</span>
                <p className="text-neutral-300 mt-1 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  {personal.permanent_address || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
              Academic Qualifications
            </h3>
            {education.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4">No educational records provided.</p>
            ) : (
              <div className="space-y-3">
                {education.map((edu, idx) => (
                  <div key={idx} className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm">{edu.course_degree}</span>
                      <span className="px-2 py-0.5 bg-neutral-800 rounded text-neutral-300 text-[10px] uppercase font-mono">
                        {edu.qualification}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-neutral-400">
                      <div><strong className="text-neutral-300">Institution:</strong> {edu.institution_name}</div>
                      <div><strong className="text-neutral-300">University:</strong> {edu.university_name}</div>
                      <div><strong className="text-neutral-300">Passing Year:</strong> {edu.year_of_passing}</div>
                      <div><strong className="text-neutral-300">Score:</strong> {edu.percentage_cgpa}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'employment' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
              Prior Work Experience
            </h3>
            {employment.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4">Fresher / No prior employment recorded.</p>
            ) : (
              <div className="space-y-3">
                {employment.map((emp, idx) => (
                  <div key={idx} className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm">{emp.company_name}</span>
                      <span className="text-neutral-400 font-medium">{emp.designation}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-neutral-400">
                      <div><strong className="text-neutral-300">Start Date:</strong> {emp.start_date}</div>
                      <div><strong className="text-neutral-300">End Date:</strong> {emp.end_date || 'Present'}</div>
                      <div><strong className="text-neutral-300">Duration:</strong> {emp.total_experience || 'N/A'}</div>
                    </div>
                    {emp.company_address && (
                      <div className="text-neutral-400 text-[11px] pt-1">
                        <strong className="text-neutral-300">Address:</strong> {emp.company_address}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2 flex items-center justify-between">
              <span>Payroll Banking Details</span>
              <span className="text-[10px] text-emerald-400 font-mono">ENCRYPTED AT REST</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Bank Name</span>
                <span className="text-white font-medium text-sm mt-0.5 block">{bank.bank_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Account Holder</span>
                <span className="text-white font-medium mt-0.5 block">{bank.account_holder_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Account Number</span>
                <span className="text-white font-mono font-bold mt-0.5 block">{bank.account_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">IFSC Code</span>
                <span className="text-white font-mono font-medium mt-0.5 block">{bank.ifsc_code || 'N/A'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-mono text-[10px]">Branch Name</span>
                <span className="text-white font-medium mt-0.5 block">{bank.branch_name || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'statutory' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2 mb-4">
                Statutory & Compliance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-neutral-500 block uppercase font-mono text-[10px]">UAN Number</span>
                  <span className="text-white font-mono mt-0.5 block">{statutory.uan_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block uppercase font-mono text-[10px]">PF Account Number</span>
                  <span className="text-white font-mono mt-0.5 block">{statutory.pf_account_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block uppercase font-mono text-[10px]">ESI Number</span>
                  <span className="text-white font-mono mt-0.5 block">{statutory.esi_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block uppercase font-mono text-[10px]">Blood Group</span>
                  <span className="text-white mt-0.5 block">{statutory.blood_group || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Nominees */}
            <div className="pt-4 border-t border-neutral-800">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-3">Nominee Details</h4>
              {nominees.length === 0 ? (
                <p className="text-xs text-neutral-500">No nominees registered.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {nominees.map((n, i) => (
                    <div key={i} className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                      <div className="font-medium text-white">{n.nominee_name} ({n.relationship})</div>
                      <div className="text-neutral-400 text-[11px] mt-1">Share: {n.share_percentage}% | DOB: {n.dob || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Contacts */}
            <div className="pt-4 border-t border-neutral-800">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-3">Emergency Contacts</h4>
              {emergency_contacts.length === 0 ? (
                <p className="text-xs text-neutral-500">No emergency contacts registered.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {emergency_contacts.map((em, i) => (
                    <div key={i} className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                      <div className="font-medium text-white">{em.contact_name} ({em.relationship})</div>
                      <div className="text-neutral-400 font-mono text-[11px] mt-1">{em.phone_number}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
              Uploaded Verification Documents
            </h3>
            {documents.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4">No documents uploaded.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col justify-between">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                      <div className="overflow-hidden">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                          {doc.document_type.replace(/_/g, ' ')}
                        </span>
                        <p className="text-xs font-medium text-white truncate mt-0.5">{doc.file_name}</p>
                        <p className="text-[10px] text-neutral-500 mt-1">
                          {(doc.file_size / 1024).toFixed(1)} KB • {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`/api/hr/documents/${doc.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg text-center flex items-center justify-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
              Audit Trail & Action Logs
            </h3>
            <div className="relative border-l border-neutral-800 ml-3 space-y-4 py-2">
              {history.map((h, i) => (
                <div key={i} className="ml-6 relative">
                  <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-white ring-4 ring-neutral-900" />
                  <div className="text-xs font-bold text-white uppercase tracking-wide">{h.action.replace(/_/g, ' ')}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{h.comment || 'No remark entered'}</div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-1">
                    By {h.performed_by} • {new Date(h.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Correction Request Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Request Candidate Correction</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              The candidate will be granted access to modify their application and address the requested remarks.
            </p>
            <form onSubmit={handleRequestCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Correction Comments & Instructions *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Please re-upload clear copy of PAN Card and verify Bank Account IFSC Code."
                  value={correctionComment}
                  onChange={(e) => setCorrectionComment(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition"
                >
                  {actionLoading ? 'Sending...' : 'Send Correction Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

