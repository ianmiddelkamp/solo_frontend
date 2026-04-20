import { useEffect, useRef, useState } from 'react';
import { getAttachments, uploadAttachment, downloadAttachment, deleteAttachment } from '../api/attachments';
import { confirm } from '../services/dialog';

const FILE_ICONS = {
  'application/pdf': '📄',
  'image/png': '🖼️', 'image/jpeg': '🖼️', 'image/gif': '🖼️', 'image/webp': '🖼️',
  'text/plain': '📝', 'text/csv': '📊', 'text/markdown': '📝',
  'application/zip': '🗜️',
};

function fileIcon(contentType) {
  if (FILE_ICONS[contentType]) return FILE_ICONS[contentType];
  if (contentType?.includes('word')) return '📝';
  if (contentType?.includes('excel') || contentType?.includes('spreadsheet')) return '📊';
  if (contentType?.includes('presentation') || contentType?.includes('powerpoint')) return '📋';
  return '📎';
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectAttachments({ projectId }) {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;
    getAttachments(projectId).then(setAttachments).catch((e) => setError(e.message));
  }, [projectId]);

  async function handleFiles(files) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const attachment = await uploadAttachment(projectId, file);
        setAttachments((prev) => [...prev, attachment]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(attachment) {
    if (!await confirm(`Delete "${attachment.filename}"?`)) return;
    await deleteAttachment(projectId, attachment.id);
    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
  }

  async function handleDownload(attachment) {
    try {
      await downloadAttachment(projectId, attachment.id, attachment.filename);
    } catch (e) {
      setError(e.message);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="mt-10">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Files</h3>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
        }`}
      >
        <p className="text-sm text-gray-500">
          {uploading ? 'Uploading…' : 'Drop files here or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, images, text, Markdown — max 20 MB</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {attachments.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100 bg-white rounded-lg border border-gray-200 shadow-sm">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3 group">
              <span className="text-xl flex-shrink-0">{fileIcon(a.content_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{a.filename}</p>
                <p className="text-xs text-gray-400">{formatBytes(a.byte_size)}</p>
              </div>
              <button
                onClick={() => handleDownload(a)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex-shrink-0"
              >
                Download
              </button>
              <button
                onClick={() => handleDelete(a)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs flex-shrink-0 transition-opacity"
                aria-label="Delete"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
