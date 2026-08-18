import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Clock, ShieldCheck, Download } from 'lucide-react';

import { ScoreGauge } from '../components/ScoreGauge';
import { StatusPill } from '../components/StatusPill';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { VerificationRecord, VerificationStatus } from '../types/kyc';

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

export function VerificationDetailsPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [images, setImages] = useState<{ documentUrl: string | null; selfieUrl: string | null }>({ documentUrl: null, selfieUrl: null });
  const [loading, setLoading] = useState(true);
  
  const reportRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `KYC_Report_${id}`,
  });

  const loadData = async () => {
    if (!token || !id) return;
    try {
      const [rec, imgs] = await Promise.all([
        api.getVerificationById(id, token),
        api.getVerificationImages(id, token),
      ]);
      setRecord(rec);
      setImages(imgs);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, token]);

  const handleAction = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!token || !id) return;
    try {
      await api.updateVerificationStatus(id, status, token);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (loading) return <section className="workspace"><p>Loading details...</p></section>;
  if (!record) return <section className="workspace"><p>Record not found.</p></section>;

  const result = record.result;
  const status = record.verificationStatus ?? result?.status ?? 'PROCESSING';
  const score = result?.confidence_score ?? 0;
  const fields = result?.extracted_fields ?? {};
  const anomalies = result?.detected_anomalies ?? [];
  const isNinBiometric = result?.metadata?.ocr_engine === 'mock';
  const modules = { ...result?.module_scores };
  if (isNinBiometric) {
    delete modules.ocr;
    delete modules.document;
  }

  const isReviewable = status === 'MANUAL_REVIEW_REQUIRED' && user?.role === 'VERIFICATION_OFFICER';
  const isStaff = user?.role === 'VERIFICATION_OFFICER' || user?.role === 'ADMIN';

  return (
    <section className="workspace">
      <div className="section-heading">
        <h1>Verification Review</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isStaff && (
            <button className="secondary-button" onClick={() => handlePrint()}>
              <Download size={16} style={{ marginRight: '0.5rem' }} /> Download PDF
            </button>
          )}
          <button className="back-link" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </div>

      <div ref={reportRef} style={{ padding: '2rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)', color: 'var(--text-main)' }}>
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <h2>Report: {record.verificationId}</h2>
          <p className="quiet-label">Generated on: {new Date().toLocaleString()}</p>
        </div>

        <div className={`result-band result-band--${status.toLowerCase()}`}>
          <div className="result-band-left">
            <StatusIcon status={status} />
            <div>
              <span className="quiet-label">Final Decision</span>
              <h2>{status.replace(/_/g, ' ')}</h2>
              <StatusPill status={status as VerificationStatus} />
            </div>
          </div>
          <ScoreGauge value={score} label="Confidence" />
        </div>

        {/* Action buttons for Officers */}
        {isReviewable && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
            <button className="primary-button" onClick={() => handleAction('VERIFIED')}>Approve Verification</button>
            <button className="secondary-button" onClick={() => handleAction('REJECTED')} style={{ color: '#dc2626', borderColor: '#dc2626' }}>Reject Verification</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
          {/* Images Section */}
          <div className="result-section">
            <h2 className="result-section-title">Submitted Media</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {images.selfieUrl && (
                <div>
                  <span className="detail-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Live Selfie</span>
                  <img src={images.selfieUrl} alt="Selfie" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
              )}
              {images.documentUrl && (
                <div>
                  <span className="detail-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Identity Document</span>
                  <img src={images.documentUrl} alt="Document" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
              )}
            </div>
          </div>

          <div>
            {Object.keys(modules).length > 0 && (
              <div className="result-section" style={{ marginBottom: '2rem' }}>
                <h2 className="result-section-title"><ShieldCheck size={18} /> AI Module Scores</h2>
                <div className="module-grid" style={{ gridTemplateColumns: '1fr' }}>
                  {Object.entries(modules).map(([key, val]) => (
                    <div key={key} className="module-card">
                      <span className="module-label">{moduleLabel(key)}</span>
                      <div className="module-bar-wrap">
                        <div
                          className={`module-bar ${val >= 70 ? 'bar-good' : val >= 45 ? 'bar-warn' : 'bar-bad'}`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                      <span className="module-score">{val.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(fields).some((k) => fields[k]) && (
              <div className="result-section" style={{ marginBottom: '2rem' }}>
                <h2 className="result-section-title">Extracted Document Fields</h2>
                <div className="fields-table">
                  {Object.entries(fields).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="field-row">
                      <span className="field-key">{k.replace(/_/g, ' ')}</span>
                      <span className="field-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {anomalies.length > 0 && (
              <div className="result-section">
                <h2 className="result-section-title"><AlertTriangle size={16} /> Detected Anomalies</h2>
                <ul className="anomaly-list">
                  {anomalies.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
