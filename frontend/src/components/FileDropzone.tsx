import { FileImage } from 'lucide-react';

interface FileDropzoneProps {
  id: string;
  label: string;
  helpText?: string;
  accept?: string;
  capture?: 'user' | 'environment';
  file: File | null;
  onChange: (file: File | null) => void;
}

export function FileDropzone({ id, label, helpText, accept = 'image/*', capture, file, onChange }: FileDropzoneProps) {
  return (
    <label className="file-dropzone" htmlFor={id}>
      <FileImage aria-hidden="true" size={22} />
      <span>{label}</span>
      {helpText && <small style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>{helpText}</small>}
      <strong>{file ? file.name : 'No file selected'}</strong>
      <input
        id={id}
        type="file"
        accept={accept}
        capture={capture}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}
