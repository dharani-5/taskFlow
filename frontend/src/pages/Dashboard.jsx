import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';
import { format, isPast, parseISO } from 'date-fns';
import './Dashboard.css';

const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const priorityLabel = { low: 'Low', medium: 'Medium', high: 'High' };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  const { stats, tasks, overdue } = data || { stats: {}, tasks: [], overdue: [] };

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Tasks" value={stats.total || 0} icon="📋" color="var(--accent3)" />
        <StatCard label="To Do" value={stats.todo || 0} icon="⏳" color="var(--text2)" />
        <StatCard label="In Progress" value={stats.in_progress || 0} icon="🔄" color="var(--info)" />
        <StatCard label="Completed" value={stats.done || 0} icon="✅" color="var(--success)" />
        <StatCard label="Overdue" value={stats.overdue || 0} icon="🚨" color="var(--danger)" />
      </div>

      {overdue.length > 0 && (
        <div className="overdue-banner">
          <span className="overdue-icon">⚠️</span>
          <span>You have <strong>{overdue.length}</strong> overdue task{overdue.length > 1 ? 's' : ''} — please review</span>
        </div>
      )}

      <div className="dashboard-sections">
        <div className="tasks-section">
          <div className="section-header">
            <h2 className="section-title">My Tasks</h2>
            <span className="section-count">{tasks.length}</span>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state">
              <p>🎉 No tasks assigned to you yet</p>
            </div>
          ) : (
            <div className="task-list">
              {tasks.map(task => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
      <div>
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function TaskRow({ task }) {
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done';
  return (
    <div className={`task-row ${task.status}`}>
      <div className="task-row-main">
        <span className={`status-dot status-${task.status}`} />
        <div>
          <div className="task-row-title">{task.title}</div>
          <div className="task-row-meta">
            <span className="task-project">📁 {task.project_name}</span>
            {task.due_date && (
              <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
                📅 {format(parseISO(task.due_date), 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="task-row-badges">
        <span className={`badge badge-${task.priority}`}>{priorityLabel[task.priority]}</span>
        <span className={`badge badge-${task.status}`}>{statusLabel[task.status]}</span>
      </div>
    </div>
  );
}
