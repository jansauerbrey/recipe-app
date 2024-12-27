import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { unitsApi } from '../../utils/unitsApi';

interface UnitFormProps {
  id?: string;
}

const UnitForm: React.FC<UnitFormProps> = ({ id }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: {
      en: '',
      de: '',
      fi: '',
    },
  });

  useEffect(() => {
    if (id) {
      loadUnit(id);
    }
  }, [id]);

  const loadUnit = async (unitId: string) => {
    try {
      setLoading(true);
      const data = await unitsApi.getUnit(unitId);
      setFormData({
        name: data.name,
      });
    } catch (err) {
      setError('Failed to load unit');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (id) {
        await unitsApi.updateUnit(id, formData);
      } else {
        await unitsApi.createUnit(formData);
      }
      navigate('/admin/units');
    } catch (err) {
      setError('Failed to save unit');
      setLoading(false);
    }
  };

  if (loading && id) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">English Name</label>
          <input
            type="text"
            className="form-control"
            value={formData.name.en}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                name: { ...prev.name, en: e.target.value },
              }))
            }
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">German Name</label>
          <input
            type="text"
            className="form-control"
            value={formData.name.de}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                name: { ...prev.name, de: e.target.value },
              }))
            }
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Finnish Name</label>
          <input
            type="text"
            className="form-control"
            value={formData.name.fi}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                name: { ...prev.name, fi: e.target.value },
              }))
            }
            required
          />
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/units')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Saving...' : (id ? 'Update Unit' : 'Create Unit')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UnitForm;
