import React from 'react';
import { ShieldCheck, Database, Server, Key, Lock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-6 border-b border-neutral-800">
        <h2 className="text-2xl font-bold tracking-tight text-white">System Settings & Architecture</h2>
        <p className="text-neutral-400 text-sm mt-1">
          Configured environment parameters, database connections, and cryptographic specifications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>PostgreSQL Database</span>
          </div>
          <div className="space-y-1.5 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Database Name:</span>
              <span className="font-mono text-white">onboarding_db</span>
            </div>
            <div className="flex justify-between">
              <span>Port / Host:</span>
              <span className="font-mono text-white">127.0.0.1:5434</span>
            </div>
            <div className="flex justify-between">
              <span>Normalized Tables:</span>
              <span className="font-mono text-emerald-400">12 Schema Entities</span>
            </div>
            <div className="flex justify-between">
              <span>Storage Architecture:</span>
              <span className="text-white">Normalized Relational + External Blobs</span>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Server className="w-4 h-4 text-blue-400" />
            <span>Python Flask Backend</span>
          </div>
          <div className="space-y-1.5 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Framework:</span>
              <span className="text-white">Flask 3.0 + SQLAlchemy 2.0</span>
            </div>
            <div className="flex justify-between">
              <span>Auth Strategy:</span>
              <span className="text-white">Stateless JWT + PBKDF2/Bcrypt</span>
            </div>
            <div className="flex justify-between">
              <span>Max Upload Size:</span>
              <span className="font-mono text-white">16 MB</span>
            </div>
            <div className="flex justify-between">
              <span>Supported Formats:</span>
              <span className="font-mono text-white">PDF, JPG, JPEG, PNG</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Security Compliance & Data Protection</span>
        </div>
        <div className="space-y-2 text-xs text-neutral-300">
          <p className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <strong>Statutory Banking Protection:</strong> Sensitive bank accounts and personal identifiers are encrypted and never exposed in unauthorized logs or public unauthenticated endpoints.
          </p>
          <p className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <strong>Cryptographically Random Onboarding Tokens:</strong> Employees receive URL-safe random tokens without password requirements.
          </p>
          <p className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <strong>Document Integrity:</strong> Uploaded files are verified by MIME type and stored on the filesystem with unique hash-prefixed filenames.
          </p>
          <p className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <strong>Immutable Audit Trail:</strong> Every action, from link generation to review and correction requests, is preserved in the submission history table.
          </p>
        </div>
      </div>
    </div>
  );
};

