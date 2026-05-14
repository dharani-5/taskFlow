import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../hooks/api';
import './Projects.css';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    api.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  return (
    <div className="projects-page fade-in">
      <div className="projects-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle" style={{ color: 'var(--text2)', marginTop: '0.25rem' }}>Manage your team projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Project
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '3rem' }}>
          <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="projects-empty">
          <div className="empty-icon">📁</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <Link to={`/projects/${p.id}`} key={p.id} className="project-card">
              <div className="project-card-header">
                <div className="project-initial">{p.name[0].toUpperCase()}</div>
                <span className={`project-role-badge ${p.user_role}`}>{p.user_role || 'admin'}</span>
              </div>
              <h3 className="project-name">{p.name}</h3>
              <p className="project-desc">{p.description || 'No description'}</p>
              <div className="project-stats">
                <span>📋 {p.task_count} tasks</span>
                <span>👥 {p.member_count} members</span>
              </div>
              <div className="project-footer">
                <span className="project-owner">By {p.owner_name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <CreateProjectModal onClose={() => setShowModal(false)} onCreated={fetchProjects} />
      )}
    </div>
  );
}

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/projects', form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">New Project</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <div className="auth-error">{error}</div>}
          <div className="input-group">
            <label>Project Name</label>
            <input className="input" placeholder="My Awesome Project"
              value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
          </div>
          <div className="input-group">
            <label>Description (optional)</label>
            <textarea className="input" rows="3" placeholder="What is this project about?"
              value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
              style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
