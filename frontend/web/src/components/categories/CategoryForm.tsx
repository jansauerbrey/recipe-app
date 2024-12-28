import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category } from '../../types/category';
import { categoriesApi } from '../../utils/categoriesApi';

interface CategoryFormProps {
  id?: string;
  categories?: Category[]; // For parent category selection
}

const CategoryForm: React.FC<CategoryFormProps> = ({ id, categories }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: {
      en: '',
      de: '',
      fi: '',
    },
    parent_id: '',
    rewe_cat_id: 0,
  });

  useEffect(() => {
    if (id) {
      loadCategory(id);
    }
  }, [id]);

  const loadCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      const data = await categoriesApi.getCategory(categoryId);
      setFormData({
        name: data.name,
        parent_id: data.parent_id || '',
        rewe_cat_id: data.rewe_cat_id,
      });
    } catch (err) {
      setError('Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const submitData = {
        ...formData,
        parent_id: formData.parent_id || undefined,
      };
      
      if (id) {
        await categoriesApi.updateCategory(id, submitData);
      } else {
        await categoriesApi.createCategory(submitData);
      }
      navigate('/admin/categories');
    } catch (err) {
      setError('Failed to save category');
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

        <div className="mb-3">
          <label className="form-label">Parent Category</label>
          <select
            className="form-select"
            value={formData.parent_id}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                parent_id: e.target.value,
              }))
            }
          >
            <option value="">No Parent</option>
            {categories?.map((category) => (
              category._id !== id && (
                <option key={category._id} value={category._id}>
                  {category.name.en}
                </option>
              )
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">REWE Category ID</label>
          <input
            type="number"
            className="form-control"
            value={formData.rewe_cat_id}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                rewe_cat_id: parseInt(e.target.value) || 0,
              }))
            }
            required
          />
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/categories')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Saving...' : (id ? 'Update Category' : 'Create Category')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;
