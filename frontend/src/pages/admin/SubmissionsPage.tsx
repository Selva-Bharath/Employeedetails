import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, FileText, CheckCircle2, XCircle, AlertCircle, Eye, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { EmployeeSummary } from '../../types';

export const SubmissionsPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hr/employees', {
        params: {
          status: statusFilter,
          search: searchTerm
        }
      });
      setEmployees(res.data.employees);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubmissions();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-950 text-emerald-400 border border-emerald-800';
      case 'Rejected':
        return 'bg-rose-950 text-rose-400 border border-rose-800';
      case 'Correction Required':
        return 'bg-amber-950 text-amber-400 border border-amber-800';
      case 'Submitted':
        return 'bg-blue-950 text-blue-400 border border-blue-800';
      case 'Under Review':
        return 'bg-purple-950 text-purple-400 border border-purple-800';
      default:
        return 'bg-neutral-800 text-neutral-400 border border-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Employee Submissions</h2>
          <p className="text-neutral-400 text-sm mt-1">
            Review onboarding profiles, approve documents, reject or request data corrections.
          </p>
        </div>
        <button
          onClick={fetchSubmissions}
          className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, email, or REF ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Correction Required">Correction Required</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4">Reference ID</th>
                <th className="py-3.5 px-4">Employee Name</th>
                <th className="py-3.5 px-4">Email & Phone</th>
                <th className="py-3.5 px-4">Submission Date</th>
                <th className="py-3.5 px-4">Review Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">Loading submissions...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">No matching submissions found.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-neutral-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-white">
                      {emp.reference_id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white text-sm">
                      {emp.employee_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-neutral-300">{emp.email}</div>
                      <div className="text-neutral-500 text-[11px] font-mono">{emp.mobile || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400">
                      {emp.submission_date ? new Date(emp.submission_date).toLocaleString() : 'Pending'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(emp.status)}`}>
                        {emp.status}
                      </span>
                      {emp.hr_correction_comment && emp.status === 'Correction Required' && (
                        <div className="text-[10px] text-amber-400/80 mt-1 truncate max-w-xs" title={emp.hr_correction_comment}>
                          Remark: {emp.hr_correction_comment}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={`/admin/employees/${emp.id}`}
                        className="px-3 py-1.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 inline-flex items-center gap-1.5 transition active:scale-[0.98]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review Dossier</span>
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
  );
};

