import React, { useState, useEffect, useMemo } from 'react';
import { Category } from '../../types/category';
import { Ingredient } from '../../types/ingredient';
import { ingredientsApi } from '../../utils/ingredientsApi';

interface CreateIngredientModalProps {
  show: boolean;
  onClose: () => void;
  onIngredientCreated: (ingredient: Ingredient) => void;
  categories: Category[];
  initialName?: string;
}

const CreateIngredientModal: React.FC<CreateIngredientModalProps> = ({
  show,
  onClose,
  onIngredientCreated,
  categories,
  initialName = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialFormData = useMemo(() => ({
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
  }), []);

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (show) {
      // When modal opens, set the initial name for all language fields
      setFormData({
        ...initialFormData,
        name: {
          en: initialName,
          de: initialName,
          fi: initialName,
        },
      });
    } else {
      // Reset form when modal closes
      setFormData(initialFormData);
    }
  }, [show, initialName, initialFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const newIngredient = await ingredientsApi.createIngredient(formData);
      onIngredientCreated(newIngredient);
      // Reset form data and close modal
      setFormData(initialFormData);
      onClose();
    } catch (err) {
      setError('Failed to create ingredient');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create New Ingredient</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            />
          </div>
          <div className="modal-body">
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

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateIngredientModal;
