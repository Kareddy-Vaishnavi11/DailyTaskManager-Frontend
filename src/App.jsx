import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'Pending' | 'Completed'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    description: '',
    dueDate: '',
    status: 'Pending'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);

  // Auto-dismiss alerts after 4 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Load tasks on mount or filter change
  useEffect(() => {
    fetchTasks(filter);
  }, [filter]);

  const fetchTasks = async (activeFilter = filter) => {
    setLoading(true);
    setError(null);
    try {
      let url = API_BASE_URL;
      if (activeFilter === 'Pending' || activeFilter === 'Completed') {
        url = `${API_BASE_URL}?status=${activeFilter}`;
      }
      const response = await axios.get(url);
      setTasks(response.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to connect to backend server';
      setError(`Error fetching tasks: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (name === 'title') {
      setTitleTouched(true);
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      title: '',
      description: '',
      dueDate: '',
      status: 'Pending'
    });
    setIsEditing(false);
    setTitleTouched(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTitleTouched(true);

    if (!formData.title.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      title: formData.title.trim(),
      description: formData.description ? formData.description.trim() : '',
      dueDate: formData.dueDate ? formData.dueDate : null,
      status: formData.status || 'Pending'
    };

    try {
      if (isEditing && formData.id) {
        await axios.put(`${API_BASE_URL}/${formData.id}`, payload);
        setSuccess(`Task "${payload.title}" updated successfully!`);
      } else {
        await axios.post(API_BASE_URL, payload);
        setSuccess(`Task "${payload.title}" created successfully!`);
      }
      resetForm();
      await fetchTasks(filter);
    } catch (err) {
      console.error('Error saving task:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Operation failed';
      setError(`Failed to save task: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (task) => {
    setFormData({
      id: task.id,
      title: task.title || '',
      description: task.description || '',
      dueDate: task.dueDate || '',
      status: task.status || 'Pending'
    });
    setIsEditing(true);
    setTitleTouched(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (task) => {
    setLoading(true);
    setError(null);
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await axios.patch(`${API_BASE_URL}/${task.id}/status`, { status: newStatus });
      setSuccess(`Task status changed to "${newStatus}"!`);
      await fetchTasks(filter);
    } catch (err) {
      console.error('Error updating status:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Status update failed';
      setError(`Failed to update status: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (task) => {
    if (!window.confirm(`Are you sure you want to delete task: "${task.title}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/${task.id}`);
      setSuccess(`Task "${task.title}" deleted successfully!`);
      if (isEditing && formData.id === task.id) {
        resetForm();
      }
      await fetchTasks(filter);
    } catch (err) {
      console.error('Error deleting task:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Delete failed';
      setError(`Failed to delete task: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const isTitleInvalid = titleTouched && !formData.title.trim();

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Daily Task Manager</h1>
        <p className="app-subtitle">Track, manage, and complete your everyday tasks</p>
      </header>

      {/* Alert Notifications */}
      {success && (
        <div className="alert alert-success" role="alert">
          <span>✓ {success}</span>
          <button className="alert-close" onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <span>⚠ {error}</span>
          <button className="alert-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Main Content Layout */}
      <main className="main-layout">
        {/* Task Form Section */}
        <section className="form-card">
          <h2>{isEditing ? `Edit Task #${formData.id}` : 'Create New Task'}</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="title">
                Task Title <span className="required-indicator">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g., Complete assignment presentation"
                value={formData.title}
                onChange={handleInputChange}
                onBlur={() => setTitleTouched(true)}
                className={isTitleInvalid ? 'input-error' : ''}
              />
              {isTitleInvalid && (
                <span className="validation-error">Title is required and cannot be empty.</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                placeholder="Details, steps, or notes about this task..."
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group form-col">
                <label htmlFor="dueDate">Due Date</label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group form-col">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || (titleTouched && !formData.title.trim())}
              >
                {isEditing ? 'Update Task' : 'Add Task'}
              </button>

              {isEditing && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Task List and Controls Section */}
        <section className="tasks-section">
          <div className="tasks-toolbar">
            <div className="filter-group">
              <span className="filter-label">Filter:</span>
              <button
                className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilter('ALL')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === 'Pending' ? 'active' : ''}`}
                onClick={() => setFilter('Pending')}
              >
                Pending
              </button>
              <button
                className={`filter-btn ${filter === 'Completed' ? 'active' : ''}`}
                onClick={() => setFilter('Completed')}
              >
                Completed
              </button>
            </div>
            <button
              className="btn btn-refresh"
              onClick={() => fetchTasks(filter)}
              disabled={loading}
              title="Refresh task list from backend"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Connecting to backend...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && tasks.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No tasks found</h3>
              <p>
                {filter === 'ALL'
                  ? 'No tasks yet. Create your first task using the form above!'
                  : `There are currently no tasks marked as "${filter}".`}
              </p>
            </div>
          )}

          {/* Task Cards List */}
          {!loading && tasks.length > 0 && (
            <div className="tasks-grid">
              {tasks.map((task) => {
                const isCompleted = task.status === 'Completed';
                return (
                  <div
                    key={task.id}
                    className={`task-card ${isCompleted ? 'task-completed' : 'task-pending'}`}
                  >
                    <div className="task-card-header">
                      <span className={`status-badge ${isCompleted ? 'badge-completed' : 'badge-pending'}`}>
                        {isCompleted ? '✓ Completed' : '⏳ Pending'}
                      </span>
                      {task.dueDate && (
                        <span className="task-due-date">
                          📅 Due: {task.dueDate}
                        </span>
                      )}
                    </div>

                    <h3 className={`task-title ${isCompleted ? 'title-completed' : ''}`}>
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}

                    <div className="task-card-footer">
                      <button
                        className={`btn btn-sm ${isCompleted ? 'btn-toggle-pending' : 'btn-toggle-completed'}`}
                        onClick={() => handleToggleStatus(task)}
                        title="Toggle task completion status"
                      >
                        {isCompleted ? 'Mark Pending' : 'Mark Completed'}
                      </button>

                      <div className="action-buttons-group">
                        <button
                          className="btn btn-sm btn-edit"
                          onClick={() => handleEditClick(task)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-delete"
                          onClick={() => handleDeleteClick(task)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
