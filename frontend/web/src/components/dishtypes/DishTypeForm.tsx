import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateDishTypeDto } from '../../types/dishtype';
import { dishtypesApi } from '../../utils/dishtypesApi';

interface DishTypeFormProps {
  id?: string;
}

const DishTypeForm: React.FC<DishTypeFormProps> = ({ id }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateDishTypeDto>({
    order: 0,
    imagePath: '',
    name: {
      fi: '',
      de: '',
      en: '',
    },
    identifier: '',
  });

  useEffect(() => {
    if (id) {
      loadDishType(id);
    }
  }, [id]);

  const loadDishType = async (dishTypeId: string) => {
    try {
      setLoading(true);
      const data = await dishtypesApi.getDishType(dishTypeId);
      setFormData({
        order: data.order,
        imagePath: data.imagePath,
        name: data.name,
        identifier: data.identifier,
      });
    } catch (err) {
      setError('Failed to load dish type');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (id) {
        await dishtypesApi.updateDishType(id, formData);
      } else {
        await dishtypesApi.createDishType(formData);
      }
      navigate('/admin/dishtypes');
    } catch (err) {
      setError('Failed to save dish type');
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    language?: string
  ) => {
    const { name, value } = e.target;
    if (language) {
      setFormData((prev) => ({
        ...prev,
        name: {
          ...prev.name,
          [language]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
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
          <label className="form-label">Order</label>
          <input
            type="number"
            name="order"
            className="form-control"
            value={formData.order}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Image Path</label>
          <input
            type="text"
            name="imagePath"
            className="form-control"
            value={formData.imagePath}
            onChange={handleChange}
            placeholder="e.g. breakfast.jpg"
            required
          />
          <div className="form-text">
            Enter only the filename (e.g. breakfast.jpg). The image should be placed in the public/img/dishtypes/ directory.
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Identifier</label>
          <input
            type="text"
            name="identifier"
            className="form-control"
            value={formData.identifier}
            onChange={handleChange}
            required
          />
        </div>

        <h3 className="h4 mb-3">Names</h3>
        
        <div className="mb-3">
          <label className="form-label">English Name</label>
          <input
            type="text"
            className="form-control"
            value={formData.name.en}
            onChange={(e) => handleChange(e, 'en')}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Finnish Name</label>
          <input
            type="text"
            className="form-control"
            value={formData.name.fi}
            onChange={(e) => handleChange(e, 'fi')}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">German Name</label>
          <input
            type="text"
            className="form-control"
            value={formData.name.de}
            onChange={(e) => handleChange(e, 'de')}
            required
          />
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/dishtypes')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Saving...' : (id ? 'Update Dish Type' : 'Create Dish Type')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DishTypeForm;
