import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

function TeamEditor({ teams = [], onAddTeam, onDeleteTeam }) {
  const [name, setName] = useState('');
  const [logoColor, setLogoColor] = useState('#3b82f6');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddTeam(name.trim(), logoColor);
    setName('');
  };

  return (
    <div className="card text-left">
      <div className="card-header">
        <h3>Manage Tournament Teams</h3>
      </div>
      <div className="card-body">
        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-form mb-4" style={{ background: '#f8fafc' }}>
          <h4>Add New Team</h4>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label>Team Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label>Color Tag</label>
              <input 
                type="color" 
                value={logoColor} 
                onChange={(e) => setLogoColor(e.target.value)} 
                style={{ padding: '2px', height: '40px', cursor: 'pointer' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="success-btn" style={{ width: '100%', height: '40px' }}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>
        </form>

        {/* List Table */}
        <div className="table-responsive">
          <table className="standings-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Color</th>
                <th className="text-left">Team Name</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      backgroundColor: t.logoColor,
                      margin: '0 auto',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }} />
                  </td>
                  <td className="text-left font-bold">{t.name}</td>
                  <td>
                    <button 
                      onClick={() => onDeleteTeam(t.id)} 
                      className="danger-btn btn-sm"
                      style={{ padding: '6px 12px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-muted">No teams registered.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TeamEditor;
