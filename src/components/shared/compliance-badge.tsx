'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, ExternalLink, Globe } from 'lucide-react';

interface ComplianceBadgeProps {
  appId: string;
  verified: boolean;
  score: number;
  lastAudit?: string | Date;
}

/**
 * Premium Compliance Badge Component
 * Designed to be embedded in sister apps (PromptMaster, PromptTool, etc)
 */
export function ComplianceBadge({ appId, verified, score, lastAudit }: ComplianceBadgeProps) {
  const dateStr = lastAudit 
    ? (typeof lastAudit === 'string' ? lastAudit.split('T')[0] : lastAudit.toISOString().split('T')[0])
    : 'Unknown';

  return (
    <div className={`compliance-badge-container ${verified ? 'verified' : 'unverified'}`}>
      <div className="badge-inner">
        {/* Left Icon Section */}
        <div className="badge-icon-area">
          {verified ? (
            <ShieldCheck size={28} className="icon-seal animate-float" />
          ) : (
            <ShieldAlert size={28} className="icon-alert" />
          )}
        </div>

        {/* Info Section */}
        <div className="badge-content">
          <div className="badge-header">
            <span className="badge-title">Stillwater Accreditation</span>
            <span className={`badge-status-pill ${verified ? 'pass' : 'fail'}`}>
              {verified ? 'VERIFIED' : 'GAPS DETECTED'}
            </span>
          </div>
          
          <div className="badge-meta">
            <div className="meta-item">
              <span className="meta-label">ID:</span>
              <span className="meta-value font-mono">{appId}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">SCORE:</span>
              <span className={`meta-value font-bold ${score >= 90 ? 'text-green' : 'text-amber'}`}>{score}%</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">LAST AUDIT:</span>
              <span className="meta-value">{dateStr}</span>
            </div>
          </div>
        </div>

        {/* Right Action Section */}
        <div className="badge-action">
          <a 
            href={`http://localhost:3003/monitoring/${appId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="badge-link-btn"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <style jsx>{`
        .compliance-badge-container {
          width: 380px;
          height: 100px;
          border-radius: 20px;
          padding: 1px; /* Clip padding for gradient border */
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
          position: relative;
          overflow: hidden;
        }

        .compliance-badge-container.verified {
          border: 1px solid rgba(16, 185, 129, 0.3);
          box-shadow: 0 10px 40px -10px rgba(16, 185, 129, 0.2);
        }

        .compliance-badge-container.unverified {
          border: 1px solid rgba(239, 68, 68, 0.3);
          box-shadow: 0 10px 40px -10px rgba(239, 68, 68, 0.2);
        }

        .badge-inner {
          display: flex;
          align-items: center;
          height: 100%;
          padding: 0 20px;
          background: rgba(15, 23, 42, 0.6);
          border-radius: 19px;
        }

        .badge-icon-area {
          margin-right: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-seal {
          color: #10b981;
          filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4));
        }

        .icon-alert {
          color: #ef4444;
          filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.4));
        }

        .badge-content {
          flex: 1;
        }

        .badge-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .badge-title {
          font-size: 13px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.2px;
        }

        .badge-status-pill {
          font-size: 9px;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }

        .badge-status-pill.pass {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .badge-status-pill.fail {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .badge-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
        }

        .meta-label {
          font-size: 8px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 2px;
        }

        .meta-value {
          font-size: 10px;
          color: rgba(255,255,255,0.9);
        }

        .text-green { color: #10b981; }
        .text-amber { color: #f59e0b; }

        .badge-action {
          margin-left: 10px;
        }

        .badge-link-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.4);
          transition: all 0.2s;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .badge-link-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
