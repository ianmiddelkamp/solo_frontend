import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProjects, deleteProject } from '../../api/projects';
import PageHeader from '../../components/PageHeader';
import { confirm } from '../../services/dialog';

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!await confirm('Delete this project?')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e.message);
    }
  }
  
  function goToProject(id) {
    navigate(`/projects/${id}/edit`);
  }

  return (
    <div className="p-8">
      <PageHeader title="Projects" actionLabel="+ New Project" actionTo="/projects/new" />

      {loading && <p className="text-gray-500">Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate / hr</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No projects yet.</td>
                </tr>
              )}
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50" onClick={() => goToProject(project.id)}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{project.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{project.client?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {project.current_rate != null ? `$${parseFloat(project.current_rate).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{project.description || '—'}</td>
                  <td className="px-6 py-4 text-right text-sm space-x-3">                   
                    <button onClick={() => handleDelete(project.id)} className="text-red-500 hover:text-red-700">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
