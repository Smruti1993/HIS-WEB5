import React, { useState, useEffect } from 'react';
import { Database, Save, AlertCircle, CheckCircle, LogOut, Loader2 } from 'lucide-react';
import { getStoredCredentials } from '../services/supabaseClient';
import { useData } from '../context/DataContext';

export const Connection = () => {
  const { isDbConnected, updateDbConnection, disconnectDb, isLoading } = useData();
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  
  useEffect(() => {
    const creds = getStoredCredentials();
    setUrl(creds.url);
    setKey(creds.key);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(url && key) {
        updateDbConnection(url, key);
    }
  };

  const handleDisconnect = () => {
      disconnectDb();
      setUrl('');
      setKey('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Database className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Database Connection</h2>
                    <p className="text-sm text-slate-500">Configure your Supabase credentials</p>
                </div>
            </div>

            <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${isDbConnected ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                {isDbConnected ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                <div className="text-sm">
                    {isDbConnected 
                        ? "Connected to Supabase. Your application is attempting to sync data."
                        : "Not Connected. Please provide your Supabase Project URL and Anon Key to start."
                    }
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="form-label">Project URL</label>
                    <input 
                        required 
                        type="url" 
                        className="form-input font-mono text-sm" 
                        placeholder="https://your-project.supabase.co"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                    />
                </div>
                
                <div>
                    <label className="form-label">Anon Key (Public)</label>
                    <input 
                        required 
                        type="password" 
                        className="form-input font-mono text-sm" 
                        placeholder="eyJh..."
                        value={key}
                        onChange={e => setKey(e.target.value)}
                    />
                    <p className="text-xs text-slate-400 mt-1">Found in Project Settings &gt; API</p>
                </div>

                <div className="pt-4 flex gap-3">
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm shadow-blue-200 disabled:bg-blue-400"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isDbConnected ? 'Update Connection' : 'Connect Database'}
                    </button>
                    
                    {isDbConnected && (
                        <button 
                            type="button" 
                            onClick={handleDisconnect}
                            className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Disconnect
                        </button>
                    )}
                </div>
            </form>
        </div>

        <div className="bg-slate-100 p-6 rounded-xl text-sm text-slate-600 space-y-2">
            <h4 className="font-semibold text-slate-800">How to get credentials?</h4>
            <ol className="list-decimal pl-5 space-y-1">
                <li>Create a project at <a href="https://supabase.com" target="_blank" className="text-blue-600 hover:underline">supabase.com</a></li>
                <li>Go to <strong>Project Settings</strong> (gear icon) &gt; <strong>API</strong>.</li>
                <li>Copy the <strong>Project URL</strong> and <strong>anon / public</strong> key.</li>
            </ol>
        </div>
    </div>
  );
};