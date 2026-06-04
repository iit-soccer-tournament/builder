import React, { useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';

function TrophyEditor({ trophies = [], onAddTrophy, onDeleteTrophy }) {
  const [name, setName] = useState('');
  const [winner, setWinner] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result); // Base64 Data URL
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !winner.trim()) return;

    // Call onAddTrophy. We store the base64 preview inside imageData.
    // In export mode, our ZIP compiler will parse this back to a file.
    onAddTrophy(name.trim(), winner.trim(), imagePreview || '🏆');

    // Reset Form
    setName('');
    setWinner('');
    setImageFile(null);
    setImagePreview('');
  };

  return (
    <div className="card text-left">
      <div className="card-header">
        <h3>Manage Trophies &amp; Special Awards</h3>
      </div>
      <div className="card-body">
        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-form mb-4" style={{ background: '#f8fafc' }}>
          <h4>Create Trophy / Award Category</h4>
          <div className="form-grid">
            <div>
              <label>Trophy / Award Title</label>
              <input 
                type="text" 
                placeholder="Trophy Title" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label>Winner Recipient Name (Player or Team)</label>
              <input 
                type="text" 
                value={winner} 
                onChange={e => setWinner(e.target.value)} 
                required 
              />
            </div>
            <div className="col-span-2">
              <label>Trophy Photo / Icon Image</label>
              <div className="flex-gap items-center mt-1">
                <label className="file-upload-label" style={{ margin: 0, padding: '10px 18px', display: 'inline-flex' }}>
                  <Upload size={16} className="mr-1" /> Choose Image File
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    style={{ display: 'none' }} 
                  />
                </label>
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ height: '40px', width: '40px', objectFit: 'contain', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px' }} 
                  />
                ) : (
                  <span className="text-muted text-xs">No file chosen (uses default Trophy emoji 🏆)</span>
                )}
              </div>
            </div>
          </div>
          <button type="submit" className="success-btn mt-3"><Plus size={16} /> Save Award</button>
        </form>

        {/* Existing Custom Trophies */}
        <div className="trophies-list-grid mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {trophies.map((t) => (
            <div 
              key={t.id} 
              className="trophy-award-card text-center p-4 relative" 
              style={{ background: '#f8fafc', border: '1.5px solid var(--border-color)', borderRadius: '16px' }}
            >
              <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                {t.imageData && t.imageData.startsWith('data:') ? (
                  <img 
                    src={t.imageData} 
                    alt={t.name} 
                    style={{ maxHeight: '70px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }} 
                  />
                ) : (
                  <span style={{ fontSize: '40px' }}>{t.imageData || '🏆'}</span>
                )}
              </div>
              <h4 className="font-extrabold text-sm text-green-800">{t.name}</h4>
              <p className="text-xs font-bold text-slate-600 mt-1">Winner: <span className="text-amber-600">{t.winner}</span></p>
              
              <button 
                onClick={() => onDeleteTrophy(t.id)} 
                className="danger-btn btn-sm mt-3"
                style={{ width: '100%', padding: '6px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '6px', cursor: 'pointer' }}
              >
                <Trash2 size={12} className="inline-icon mr-1" /> Delete
              </button>
            </div>
          ))}
          {trophies.length === 0 && (
            <p className="col-span-2 text-muted text-center py-6">No custom trophies defined for this edition.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrophyEditor;
