import { FormEvent, useState } from 'react';
import { SendHorizontal, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { FileDropzone } from '../components/FileDropzone';
import { WebcamCapture } from '../components/WebcamCapture';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export function VerifyIdentityPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [documentType, setDocumentType] = useState('NIN_SLIP');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleCaptured(blob: Blob) {
    const file = new File([blob], 'live-selfie.jpg', { type: 'image/jpeg' });
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(blob));
    setShowCamera(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || !documentFile || !selfieFile) {
      setError('Document and selfie are required');
      return;
    }
    setSubmitting(true);
    setError('');
    const form = new FormData();
    form.append('documentType', documentType);
    if (documentNumber) form.append('documentNumber', documentNumber);
    form.append('document', documentFile);
    form.append('selfie', selfieFile);

    try {
      const record = await api.submitVerification(form, token);
      navigate('/result', { state: record });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {showCamera && (
        <WebcamCapture onCapture={handleCaptured} onClose={() => setShowCamera(false)} />
      )}
      <section className="workspace">
        <div className="section-heading">
          <h1>Identity Verification</h1>
          <span className="quiet-label">{submitting ? 'Processing…' : 'Ready'}</span>
        </div>

        <div className="verify-step-banner">
          <div className="verify-step active">
            <span className="step-num">1</span>
            <span>Upload ID Slip</span>
          </div>
          <div className="verify-step-connector" />
          <div className={`verify-step ${selfieFile ? 'active' : ''}`}>
            <span className="step-num">2</span>
            <span>Capture Face</span>
          </div>
          <div className="verify-step-connector" />
          <div className={`verify-step ${submitting ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span>AI Verification</span>
          </div>
        </div>

        <form className="verification-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Document type
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
                <option value="NIN_SLIP">NIN Slip</option>
                <option value="DRIVERS_LICENSE">Driver&apos;s Licence</option>
                <option value="PVC">Permanent Voter&apos;s Card</option>
                <option value="PASSPORT">International Passport</option>
              </select>
            </label>
            <label>Document number <span className="optional-tag">(optional – aids OCR)</span>
              <input
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="e.g. 12345678901"
              />
            </label>
          </div>

          <div className="upload-grid">
            <FileDropzone
              id="document"
              label="Identity document (NIN Slip / Passport)"
              file={documentFile}
              onChange={setDocumentFile}
            />

            {/* Selfie panel */}
            <div className="selfie-panel">
              <p className="selfie-label">Live selfie (liveness capture)</p>
              {selfiePreview ? (
                <div className="selfie-preview-container">
                  <img src={selfiePreview} alt="Captured selfie" className="selfie-preview" />
                  <button
                    type="button"
                    className="selfie-retake-btn"
                    onClick={() => { setSelfieFile(null); setSelfiePreview(null); }}
                  >
                    Retake
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="webcam-launch-btn"
                  onClick={() => setShowCamera(true)}
                  id="open-webcam-button"
                >
                  <Camera size={28} />
                  <span>Open Camera</span>
                  <small>Allow camera access for live liveness scan</small>
                </button>
              )}
            </div>
          </div>

          {error && <p className="error-banner">{error}</p>}
          <button className="primary-button" type="submit" disabled={submitting} id="submit-verification-button">
            <SendHorizontal size={18} />
            {submitting ? 'Submitting…' : 'Submit for Verification'}
          </button>
        </form>
      </section>
    </>
  );
}
