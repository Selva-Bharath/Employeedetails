import React, { useState, useEffect } from 'react';
import { FileText, Download, ShieldCheck, Search } from 'lucide-react';
import api from '../../services/api';

export const DocumentsPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setLoading(true);
        const res = await api.get('/hr/employees');
        // Fetch full profiles for active submissions to list all files
        const fullProfiles = await Promise.all(
          res.data.employees.slice(0, 15).map(async (emp: any) => {
            const detailRes = await api.get(`/hr/employees/${emp.id}`);
            return detailRes.data;
          })
        );
        setEmployees(fullProfiles);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  // Flatten documents with employee name
  const allDocuments = employees.flatMap((emp) =>
    (emp.documents || []).map((doc: any) => ({
      ...doc,
      candidate_name: emp.personal?.full_name || emp.submission?.employee_name || 'N/A',
      ref_id: emp.submission?.reference_id,
      submission_id: emp.submission?.id
    }))
  );

  const filteredDocs = allDocuments.filter((d) =>
    d.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Document Vault</h2>
          <p className="text-neutral-400 text-sm mt-1">
            Centrally stored, validated candidate documentation with secure metadata references.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder="Filter documents by candidate or document type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white"
        />
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">Uploaded At</th>
                <th className="py-3 px-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">Scanning document storage...</td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">No documents found in vault.</td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-neutral-800/30 transition">
                    <td className="py-3 px-4 font-bold text-white uppercase text-[10px] tracking-wider">
                      {doc.document_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate max-w-xs">{doc.file_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-white">{doc.candidate_name}</span>
                      <span className="text-neutral-500 font-mono text-[10px] block">{doc.ref_id}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-400">
                      {(doc.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`/api/hr/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-white text-black font-semibold rounded hover:bg-neutral-200 transition inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
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

