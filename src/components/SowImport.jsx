import { useRef, useState, useEffect } from 'react';
import { parseSow } from '../api/sowImport';
import { createTaskGroup, createTask } from '../api/tasks';

export default function SowImport({ projectId, onImported }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('file'); // 'file' | 'text'
  const [pastedText, setPastedText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsingStatus, setParsingStatus] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null); // parsed groups before commit
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!parsing) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [parsing]);

  async function handleFile(file) {
    if (!file) return;
    await submit(file);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handlePaste() {
    if (!pastedText.trim()) return;
    await submit(pastedText);
  }

  async function submit(fileOrText) {
    setParsing(true);
    setParsingStatus('');
    setError(null);
    setPreview(null);
    try {
      const group = await parseSow(projectId, fileOrText, setParsingStatus);
      setPreview(group);
    } catch (e) {
      setError(e.message);
    } finally {
      setParsing(false);
    }
  }

  function removeTask(taskIdx) {
    setPreview((prev) => ({ ...prev, tasks: prev.tasks.filter((_, j) => j !== taskIdx) }));
  }

  function updateGroupTitle(title) {
    setPreview((prev) => ({ ...prev, title }));
  }

  function updateTaskTitle(taskIdx, title) {
    setPreview((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t, j) => (j === taskIdx ? { ...t, title } : t)),
    }));
  }

  async function handleImport() {
    if (!preview?.tasks?.length) return;
    setImporting(true);
    setError(null);
    try {
      const created = await createTaskGroup(projectId, { title: preview.title });
      for (const task of preview.tasks) {
        await createTask(projectId, created.id, { title: task.title });
      }
      setPreview(null);
      setOpen(false);
      onImported?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  }

  function handleCancel() {
    setPreview(null);
    setError(null);
    setOpen(false);
  }

  return (
    <div className="mt-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          + Import tasks from SOW
        </button>
      ) : (
        <div className="border border-indigo-200 rounded-lg bg-indigo-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">Import tasks from Statement of Work</h4>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
          )}

          {!preview && !parsing && (
            <div>
              <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                  onClick={() => setMode('file')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'file' ? 'bg-white text-gray-800 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Upload file
                </button>
                <button
                  onClick={() => setMode('text')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'text' ? 'bg-white text-gray-800 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Paste text
                </button>
              </div>

              {mode === 'file' ? (
                <div
                  onClick={() => inputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-300 rounded-lg px-6 py-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-100 transition-colors"
                >
                  <p className="text-sm text-indigo-600 font-medium">Click to choose file</p>
                  <p className="text-xs text-gray-400 mt-1">.md · .txt · .docx</p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".md,.txt,.docx"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                </div>
              ) : (
                <div>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste your SOW text here…"
                    rows={8}
                    className="w-full text-sm border border-gray-300 rounded-lg p-3 outline-none focus:border-indigo-400 resize-y"
                  />
                  <button
                    onClick={handlePaste}
                    disabled={!pastedText.trim()}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    Analyse
                  </button>
                </div>
              )}
            </div>
          )}

          {parsing && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-3">
                <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
              </div>
              <p className="text-sm text-indigo-700 font-medium">{parsingStatus || 'Starting…'}</p>
              <p className="text-xs text-gray-400 mt-1">{elapsed}s elapsed</p>
            </div>
          )}

          {preview && (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Review the task group and edit before importing. Remove anything you don't need.
              </p>
              <div className="bg-white rounded-lg border border-gray-200 p-3 max-h-96 overflow-y-auto">
                <input
                  value={preview.title}
                  onChange={(e) => updateGroupTitle(e.target.value)}
                  className="w-full font-semibold text-sm border-b border-gray-200 outline-none focus:border-indigo-400 bg-transparent py-0.5 mb-2"
                />
                <ul className="space-y-1">
                  {(preview.tasks || []).map((task, ti) => (
                    <li key={ti} className="flex items-center gap-2">
                      <span className="text-gray-300 text-xs">—</span>
                      <input
                        value={task.title}
                        onChange={(e) => updateTaskTitle(ti, e.target.value)}
                        className="flex-1 text-sm border-b border-gray-100 outline-none focus:border-indigo-400 bg-transparent py-0.5"
                      />
                      <button
                        onClick={() => removeTask(ti)}
                        className="text-red-300 hover:text-red-500 text-xs flex-shrink-0"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleImport}
                  disabled={importing || !preview.tasks?.length}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {importing ? 'Importing…' : `Import ${preview.tasks?.length ?? 0} task${preview.tasks?.length !== 1 ? 's' : ''}`}
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Choose different file
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
