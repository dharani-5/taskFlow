import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';
import { format, isPast, parseISO } from 'date-fns';
import './ProjectDetail.css';

const STATUSES = ['todo', 'in_progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project_id=${id}`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${userId}`);
    fetchData();
  };

  const isAdmin = project?.userRole === 'admin' || project?.owner_id === user?.id;

  const filteredTasks = filterStatus ? tasks.filter(t => t.status === filterStatus) : tasks;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  if (!project) return null;

  return (
    <div className="project-detail fade-in">
      <div className="pd-header">
        <div className="pd-header-left">
          <button className="back-btn" onClick={() => navigate('/projects')}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <h1 className="pd-title">{project.name}</h1>
            {project.description && <p className="pd-desc">{project.description}</p>}
          </div>
        </div>
        <div className="pd-actions">
          {isAdmin && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>
                👥 Members ({project.members?.length || 0})
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete</button>
            </>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>
            + Add Task
          </button>
        </div>
      </div>

      <div className="pd-tabs">
        {['board', 'list'].map(t => (
          <button key={t} className={`pd-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'board' ? '🗂 Board' : '📋 List'}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <select className="input" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      {tab === 'board' ? (
        <div className="kanban-board">
          {STATUSES.map(status => {
            const col = filteredTasks.filter(t => t.status === status);
            return (
              <div key={status} className="kanban-col">
                <div className="kanban-col-header">
                  <span className={`col-dot col-dot-${status}`} />
                  <span className="col-label">{STATUS_LABELS[status]}</span>
                  <span className="col-count">{col.length}</span>
                </div>
                <div className="kanban-cards">
                  {col.map(task => (
                    <TaskCard key={task.id} task={task}
                      onEdit={() => { setEditTask(task); setShowTaskModal(true); }}
                      onDelete={async () => { await api.delete(`/tasks/${task.id}`); fetchData(); }}
                      isAdmin={isAdmin}
                    />
                  ))}
                  {col.length === 0 && <div className="col-empty">No tasks here</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="task-table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>Title</th><th>Status</th><th>Priority</th><th>Assigned To</th>
                <th>Due Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr><td colSpan={6} className="table-empty">No tasks found</td></tr>
              ) : filteredTasks.map(task => {
                const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done';
                return (
                  <tr key={task.id}>
                    <td className="task-title-cell">{task.title}</td>
                    <td><span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span></td>
                    <td><span className={`badge badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span></td>
                    <td>{task.assigned_to_name || <span style={{ color: 'var(--text3)' }}>Unassigned</span>}</td>
                    <td className={isOverdue ? 'overdue-cell' : ''}>
                      {task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => { setEditTask(task); setShowTaskModal(true); }}>Edit</button>
                        {(isAdmin || task.created_by === user.id) && (
                          <button className="btn btn-danger btn-sm"
                            onClick={async () => { await api.delete(`/tasks/${task.id}`); fetchData(); }}>Del</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showTaskModal && (
        <TaskModal
          task={editTask}
          projectId={id}
          members={project.members || []}
          onClose={() => setShowTaskModal(false)}
          onSaved={fetchData}
        />
      )}

      {showMemberModal && (
        <MembersModal
          project={project}
          isAdmin={isAdmin}
          userId={user.id}
          onClose={() => setShowMemberModal(false)}
          onUpdated={fetchData}
          onRemove={handleRemoveMember}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, isAdmin }) {
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done';
  return (
    <div className="task-card">
      <div className="task-card-header">
        <span className={`badge badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
        {isOverdue && <span className="badge badge-overdue">Overdue</span>}
      </div>
      <div className="task-card-title">{task.title}</div>
      {task.description && <div className="task-card-desc">{task.description}</div>}
      <div className="task-card-footer">
        <div className="task-card-meta">
          {task.assigned_to_name && (
            <span className="assignee-chip">{task.assigned_to_name[0].toUpperCase()}</span>
          )}
          {task.due_date && (
            <span className={`task-card-due ${isOverdue ? 'overdue' : ''}`}>
              📅 {format(parseISO(task.due_date), 'MMM d')}
            </span>
          )}
        </div>
        <div className="task-card-actions">
          <button className="icon-btn" onClick={onEdit} title="Edit">✏️</button>
          <button className="icon-btn danger" onClick={onDelete} title="Delete">🗑</button>
        </div>
      </div>
    </div>
  );
}

function TaskModal({ task, projectId, members, onClose, onSaved }) {
  const [form, setForm] = useState(task ? {
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    due_date: task.due_date ? task.due_date.split('T')[0] : '',
    assigned_to: task.assigned_to || ''
  } : { title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, project_id: parseInt(projectId) };
      if (!payload.assigned_to) delete payload.assigned_to;
      if (!payload.due_date) delete payload.due_date;
      if (task) {
        await api.put(`/tasks/${task.id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs[0].msg : err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{task ? 'Edit Task' : 'Create Task'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <div className="auth-error">{error}</div>}
          <div className="input-group">
            <label>Title</label>
            <input className="input" placeholder="Task title"
              value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
          </div>
          <div className="input-group">
            <label>Description</label>
            <textarea className="input" rows="2" placeholder="Optional description"
              value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
              style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label>Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="input-group">
              <label>Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label>Assign To</label>
              <select className="input" value={form.assigned_to} onChange={e => setForm(f => ({...f, assigned_to: e.target.value}))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Due Date</label>
              <input className="input" type="date"
                value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MembersModal({ project, isAdmin, userId, onClose, onUpdated, onRemove }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post(`/projects/${project.id}/members`, { email, role });
      setEmail('');
      setSuccess('Member added!');
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Team Members</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="members-list">
          {project.members?.map(m => (
            <div key={m.id} className="member-row">
              <div className="member-avatar">{m.name[0].toUpperCase()}</div>
              <div className="member-info">
                <span className="member-name">{m.name}</span>
                <span className="member-email">{m.email}</span>
              </div>
              <span className={`project-role-badge ${m.role}`}>{m.role}</span>
              {isAdmin && m.id !== userId && (
                <button className="btn btn-danger btn-sm" onClick={() => onRemove(m.id)}>Remove</button>
              )}
            </div>
          ))}
        </div>
        {isAdmin && (
          <form onSubmit={handleAdd} style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Add Member</h3>
            {error && <div className="auth-error">{error}</div>}
            {success && <div style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{success}</div>}
            <div className="input-group">
              <label>Email</label>
              <input className="input" type="email" placeholder="user@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Role</label>
              <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Add Member'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
