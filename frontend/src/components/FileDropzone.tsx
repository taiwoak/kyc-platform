import { FileImage } from 'lucide-react';

interface FileDropzoneProps {
  id: string;
  label: string;
  accept?: string;
  capture?: 'user' | 'environment';
  file: File | null;
  onChange: (file: File | null) => void;
}

export function FileDropzone({ id, label, accept = 'image/*', capture, file, onChange }: FileDropzoneProps) {
  return (
    <label className="file-dropzone" htmlFor={id}>
      <FileImage aria-hidden="true" size={22} />
      <span>{label}</span>
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
