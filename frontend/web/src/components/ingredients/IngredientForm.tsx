import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category } from '../../types/category';
import { ingredientsApi } from '../../utils/ingredientsApi';

interface IngredientFormProps {
  id?: string;
  categories: Category[]; // For category selection
}

const IngredientForm: React.FC<IngredientFormProps> = ({ id, categories }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: {
      en: '',
      de: '',
      fi: '',
    },
    category_id: '',
    rewe_art_no: 0,
    rewe_img_links: {
      xs: '',
      sm: '',
      md: '',
    },
  });

  useEffect(() => {
    if (id) {
      loadIngredient(id);
    }
  }, [id]);

  const loadIngredient = async (ingredientId: string) => {
    try {
      setLoading(true);
      const data = await ingredientsApi.getIngredient(ingredientId);
      setFormData({
        name: data.name,
        category_id: data.category_id,
        rewe_art_no: data.rewe_art_no,
        rewe_img_links: data.rewe_img_links,
      });
    } catch (err) {
      setError('Failed to load ingredient');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (id) {
        await ingredientsApi.updateIngredient(id, formData);
      } else {
        await ingredientsApi.createIngredient(formData);
      }
      navigate('/admin/ingredients');
    } catch (err) {
      setError('Failed to save ingredient');
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
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={formData.category_id}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                category_id: e.target.value,
              }))
            }
            required
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name.en}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">REWE Article Number</label>
          <input
            type="number"
            className="form-control"
            value={formData.rewe_art_no}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                rewe_art_no: parseInt(e.target.value) || 0,
              }))
            }
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Image URLs</label>
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="url"
                className="form-control"
                placeholder="XS Image URL"
                value={formData.rewe_img_links.xs}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    rewe_img_links: { ...prev.rewe_img_links, xs: e.target.value },
                  }))
                }
              />
            </div>
            <div className="col-md-4">
              <input
                type="url"
                className="form-control"
                placeholder="SM Image URL"
                value={formData.rewe_img_links.sm}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    rewe_img_links: { ...prev.rewe_img_links, sm: e.target.value },
                  }))
                }
              />
            </div>
            <div className="col-md-4">
              <input
                type="url"
                className="form-control"
                placeholder="MD Image URL"
                value={formData.rewe_img_links.md}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    rewe_img_links: { ...prev.rewe_img_links, md: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/ingredients')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Saving...' : (id ? 'Update Ingredient' : 'Create Ingredient')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IngredientForm;
