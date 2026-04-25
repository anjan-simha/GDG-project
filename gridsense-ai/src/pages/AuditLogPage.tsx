import React, { useState } from 'react';
import { useAuditLogs } from '../hooks/useAuditLog';
import { SkeletonLoader } from '../components/shared/SkeletonLoader';
import { format } from 'date-fns';
import { ClipboardList, Download } from 'lucide-react';
import { auditService } from '../services/auditService';

export const AuditLogPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data: logs, isLoading } = useAuditLogs({ page });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ClipboardList className="text-cyan-electric" />
            Audit Log
          </h1>
          <p className="text-text-secondary mt-1">System-wide record of operator actions and state changes.</p>
        </div>
        <button 
          onClick={() => auditService.exportLogs()}
          className="bg-navy-lighter hover:bg-navy-light text-cyan-electric border border-cyan-electric/30 px-4 py-2 flex items-center gap-2 transition-colors"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="bg-navy-lighter border border-navy-light rounded-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 flex flex-col gap-4">
            <SkeletonLoader className="h-10 w-full" />
            <SkeletonLoader className="h-10 w-full" />
            <SkeletonLoader className="h-10 w-full" />
            <SkeletonLoader className="h-10 w-full" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy-dark border-b border-navy-light text-text-secondary text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Timestamp</th>
                <th className="p-4 font-medium">Action</th>
                <th className="p-4 font-medium">Flag ID</th>
                <th className="p-4 font-medium">Zone</th>
                <th className="p-4 font-medium">Reason Code</th>
                <th className="p-4 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-secondary">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs?.map((log: any) => (
                  <tr key={log.id} className="border-b border-navy-light/50 hover:bg-navy-light/30 transition-colors">
                    <td className="p-4 text-sm font-mono whitespace-nowrap text-text-secondary">
                      {format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm:ss')}
                    </td>
                    <td className="p-4 text-sm">
                      <span className="px-2 py-1 bg-navy-light border border-navy-light rounded text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-mono text-cyan-electric">
                      {log.flag_id ? `${log.flag_id.substring(0, 8)}...` : '-'}
                    </td>
                    <td className="p-4 text-sm">{log.zone_id || '-'}</td>
                    <td className="p-4 text-sm text-amber-500">{log.reason_code || '-'}</td>
                    <td className="p-4 text-sm text-text-secondary max-w-xs truncate" title={log.operator_note}>
                      {log.operator_note || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination controls could go here */}
      <div className="mt-4 flex justify-between items-center text-sm text-text-secondary">
        <div>Showing page {page}</div>
        <div className="flex gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 bg-navy-lighter hover:bg-navy-light disabled:opacity-50"
          >
            Previous
          </button>
          <button 
            onClick={() => setPage(p => p + 1)}
            disabled={!logs || logs.length < 100}
            className="px-3 py-1 bg-navy-lighter hover:bg-navy-light disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
