import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, BrainCircuit, RefreshCcw } from 'lucide-react';
import { api } from '../../services/api';

export const VendorInsights: React.FC = () => {
  const [shouldFetch, setShouldFetch] = useState(true);

  // Fetch AI Insights
  const { data, isLoading, refetch, isRefetching } = useQuery<any>({
    queryKey: ['vendor-ai-insights'],
    queryFn: async () => {
      const res = await api.get('/ai/insights');
      return res.data;
    },
    enabled: shouldFetch,
  });

  const handleRefetch = () => {
    refetch();
  };

  // Light custom markdown formatter
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-base font-extrabold text-slate-800 dark:text-white mt-6 mb-2">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-lg font-black text-slate-900 dark:text-white mt-8 mb-3 border-b dark:border-slate-800 pb-2">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="text-xl font-black text-slate-900 dark:text-white mt-8 mb-4 border-b dark:border-slate-800 pb-2">{line.replace('# ', '')}</h2>;
      }

      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const clean = line.replace(/^[-*]\s+/, '');
        // Highlight bold **text** inside bullet
        const parts = clean.split('**');
        return (
          <li key={idx} className="list-disc ml-5 mt-1.5 text-xs text-slate-650 dark:text-slate-450 leading-relaxed">
            {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{p}</strong> : p)}
          </li>
        );
      }

      // Numbered Lists
      if (/^\d+\.\s+/.test(line)) {
        const clean = line.replace(/^\d+\.\s+/, '');
        const parts = clean.split('**');
        return (
          <li key={idx} className="list-decimal ml-5 mt-1.5 text-xs text-slate-650 dark:text-slate-450 leading-relaxed">
            {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{p}</strong> : p)}
          </li>
        );
      }

      // Normal lines
      if (line.trim() === '') return <div key={idx} className="h-2" />;
      
      const parts = line.split('**');
      return (
        <p key={idx} className="text-xs text-slate-650 dark:text-slate-450 leading-relaxed mt-2">
          {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{p}</strong> : p)}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 py-2 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-brand-500" />
            <span>AI Sales Analyst</span>
          </h2>
          <p className="text-xs text-slate-400">Request statistical performance summaries compiled by Google Gemini.</p>
        </div>

        <button
          onClick={handleRefetch}
          disabled={isLoading || isRefetching}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20 disabled:opacity-50"
        >
          <RefreshCcw className={`h-4 w-4 ${(isLoading || isRefetching) && 'animate-spin'}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Report Box */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm relative min-h-[300px]">
        {isLoading || isRefetching ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm space-y-4 rounded-3xl">
            <BrainCircuit className="h-10 w-10 text-brand-500 animate-bounce" />
            <div className="text-center">
              <p className="font-bold text-xs text-slate-800 dark:text-white">Gemini is compiling stats...</p>
              <p className="text-[10px] text-slate-400 mt-1">Aggregating store orders, calculating revenues, and writing strategic reports.</p>
            </div>
          </div>
        ) : null}

        {/* Report Markdown Context */}
        {data?.insights ? (
          <div className="prose dark:prose-invert max-w-none">
            {renderMarkdown(data.insights)}
          </div>
        ) : (
          !isLoading && <p className="text-center text-xs text-slate-400 py-16">Could not compile report. Try refreshing.</p>
        )}
      </div>
    </div>
  );
};
