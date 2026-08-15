import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';

import { ScoreGauge } from '../components/ScoreGauge';
import { StatusPill } from '../components/StatusPill';

interface ModuleScores {
  ocr?: number;
  document?: number;
  face?: number;
  liveness?: number;
}

interface AiResult {
  status: string;
  confidence_score: number;
  ocr_status?: string;
  document_authenticity?: string;
  face_similarity?: number;
  liveness_status?: string;
  extracted_fields?: Record<string, string | null>;
  detected_anomalies?: string[];
  module_scores?: ModuleScores;
  metadata?: {
    ocr_engine?: string;
    face_method?: string;
    review_notes?: string[];
  };
}

interface VerificationRecord {
  verificationId: string;
  verificationStatus: string;
  result?: AiResult;
  createdAt: string;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'VERIFIED') return <CheckCircle2 size={36} color="#0d9488" />;
  if (status === 'REJECTED' || status === 'FAILED') return <XCircle size={36} color="#dc2626" />;
  if (status === 'MANUAL_REVIEW_REQUIRED') return <AlertTriangle size={36} color="#d97706" />;
  return <Clock size={36} color="#2563eb" />;
}

function moduleLabel(key: string): string {
  const map: Record<string, string> = {
    ocr: 'OCR Extraction',
    document: 'Document Authenticity',
    face: 'Face Match',
    liveness: 'Liveness',
  };
  return map[key] ?? key;
}

export function VerificationResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const record = state as VerificationRecord | null;

  if (!record) {
    return (
      <section className="workspace">
        <p>No result data. <button className="link-btn" onClick={() => navigate('/verify')}>Go back</button></p>
      </section>
    );
  }

  const result = record.result;
  const status = record.verificationStatus ?? result?.status ?? 'PROCESSING';
  const score = result?.confidence_score ?? 0;
  const fields = result?.extracted_fields ?? {};
  const anomalies = result?.detected_anomalies ?? [];
  const modules = result?.module_scores ?? {};

  return (
    <section className="workspace">
      <div className="section-heading">
        <h1>Verification Result</h1>
        <button className="back-link" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Dashboard
        </button>
      </div>

      {/* Main result band */}
      <div className={`result-band result-band--${status.toLowerCase()}`}>
        <div className="result-band-left">
          <StatusIcon status={status} />
          <div>
            <span className="quiet-label">Final Decision</span>
            <h2>{status.replace(/_/g, ' ')}</h2>
            <StatusPill status={status.toLowerCase()} />
          </div>
        </div>
        <ScoreGauge score={score} label="Confidence" />
      </div>

      {/* Module score grid */}
      {Object.keys(modules).length > 0 && (
        <div className="result-section">
          <h2 className="result-section-title"><ShieldCheck size={18} /> AI Module Scores</h2>
          <div className="module-grid">
            {Object.entries(modules).map(([key, val]) => (
              <div key={key} className="module-card">
                <span className="module-label">{moduleLabel(key)}</span>
                <div className="module-bar-wrap">
                  <div
                    className={`module-bar ${
                      val >= 70 ? 'bar-good' : val >= 45 ? 'bar-warn' : 'bar-bad'
                    }`}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className="module-score">{val.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-statuses */}
      <div className="result-section">
        <h2 className="result-section-title">Verification Details</h2>
        <div className="detail-grid">
          {result?.ocr_status && (
            <div className="detail-item">
              <span className="detail-label">OCR Status</span>
              <StatusPill status={result.ocr_status.toLowerCase()} />
            </div>
          )}
          {result?.document_authenticity && (
            <div className="detail-item">
              <span className="detail-label">Document</span>
              <StatusPill status={result.document_authenticity.toLowerCase()} />
            </div>
          )}
          {result?.liveness_status && (
            <div className="detail-item">
              <span className="detail-label">Liveness</span>
              <StatusPill status={result.liveness_status.toLowerCase()} />
            </div>
          )}
          {result?.face_similarity !== undefined && (
            <div className="detail-item">
              <span className="detail-label">Face Similarity</span>
              <strong>{result.face_similarity.toFixed(1)}%</strong>
            </div>
          )}
          {result?.metadata?.ocr_engine && (
            <div className="detail-item">
              <span className="detail-label">OCR Engine</span>
              <code className="engine-tag">{result.metadata.ocr_engine}</code>
            </div>
          )}
          {result?.metadata?.face_method && (
            <div className="detail-item">
              <span className="detail-label">Face Method</span>
              <code className="engine-tag">{result.metadata.face_method}</code>
            </div>
          )}
        </div>
      </div>

      {/* Extracted fields */}
      {Object.keys(fields).some((k) => fields[k]) && (
        <div className="result-section">
          <h2 className="result-section-title">Extracted Document Fields</h2>
          <div className="fields-table">
            {Object.entries(fields)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="field-row">
                  <span className="field-key">{k.replace(/_/g, ' ')}</span>
                  <span className="field-val">{v}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="result-section">
          <h2 className="result-section-title"><AlertTriangle size={16} /> Detected Anomalies</h2>
          <ul className="anomaly-list">
            {anomalies.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {/* Review notes */}
      {result?.metadata?.review_notes && result.metadata.review_notes.length > 0 && (
        <div className="result-section">
          <h2 className="result-section-title">Review Notes</h2>
          <ul className="anomaly-list">
            {result.metadata.review_notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      <div className="result-actions">
        <button className="primary-button" onClick={() => navigate('/verify')} id="verify-again-button">
          Start New Verification
        </button>
        <button className="secondary-button" onClick={() => navigate('/history')} id="view-history-button">
          View History
        </button>
      </div>
    </section>
  );
}
