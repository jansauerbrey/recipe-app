import React, { useState } from 'react';
import { Recipe, RecipeFormData, DishType, Unit } from '../types/recipe';
import IngredientTypeahead from './ingredients/IngredientTypeahead';
import { Ingredient as ApiIngredient } from '../types/ingredient';

interface RecipeFormProps {
  initialData?: Recipe;
  dishTypes: DishType[];
  units: Unit[];
  onSubmit: (data: RecipeFormData) => Promise<void>;
  onCancel: () => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({
  initialData,
  dishTypes,
  units,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<RecipeFormData>({
    name: initialData?.name || '',
    language: initialData?.language || 'en',
    instructions: initialData?.instructions || '',
    prepTime: initialData?.prepTime || 0,
    yield: initialData?.yield || 1,
    totalTime: initialData?.totalTime || 0,
    cookTime: initialData?.cookTime || 0,
    kilocalories: initialData?.kilocalories || 0,
    waitTime: initialData?.waitTime || 0,
    carb: initialData?.carb || 0,
    fat: initialData?.fat || 0,
    protein: initialData?.protein || 0,
    ingredients: initialData?.ingredients || [],
    tags: initialData?.tags || [],
    dishType: initialData?.dishType || (dishTypes.length > 0 ? dishTypes[0] : { _id: '', name: { en: '', de: '', fi: '' }, order: 0, imagePath: '/img/dishtypes/no_image.png', identifier: '', author: '', updated_at: new Date().toISOString() }),
    imagePath: initialData?.imagePath || '',
  });

  const [newIngredient, setNewIngredient] = useState({
    _id: '',
    name: { en: '', de: '', fi: '' },
    amount: 0,
    unit: units.length > 0 ? units[0] : { _id: '', name: { en: '', de: '', fi: '' } },
  });

  const [newTag, setNewTag] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imagePath ? `/upload/${initialData.imagePath}` : null
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addIngredient = () => {
    if (newIngredient.amount > 0 && newIngredient._id) {
      setFormData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, { ...newIngredient }],
      }));
      setNewIngredient({
        _id: '',
        name: { en: '', de: '', fi: '' },
        amount: 0,
        unit: units.length > 0 ? units[0] : { _id: '', name: { en: '', de: '', fi: '' } },
      });
    }
  };

  const removeIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="recipe-form">
      <div className="mb-3">
        <label className="form-label">Recipe Name</label>
        <input
          type="text"
          className="form-control"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Language</label>
        <select
          className="form-select"
          name="language"
          value={formData.language}
          onChange={handleInputChange}
        >
          <option value="en">English</option>
          <option value="de">German</option>
          <option value="fi">Finnish</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Dish Type</label>
        <select
          className="form-select"
          name="dishType"
          value={formData.dishType?._id || ''}
          onChange={(e) => {
            const selectedDishType = dishTypes.find(dt => dt._id === e.target.value);
            if (selectedDishType) {
              setFormData(prev => ({ ...prev, dishType: selectedDishType }));
            }
          }}
        >
          {dishTypes.map((dt) => (
            <option key={dt._id} value={dt._id}>
              {dt.name.en}
            </option>
          ))}
        </select>
      </div>

      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label">Prep Time (min)</label>
          <input
            type="number"
            className="form-control"
            name="prepTime"
            value={formData.prepTime}
            onChange={handleNumberInputChange}
            min="0"
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Cook Time (min)</label>
          <input
            type="number"
            className="form-control"
            name="cookTime"
            value={formData.cookTime}
            onChange={handleNumberInputChange}
            min="0"
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Wait Time (min)</label>
          <input
            type="number"
            className="form-control"
            name="waitTime"
            value={formData.waitTime}
            onChange={handleNumberInputChange}
            min="0"
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Servings</label>
          <input
            type="number"
            className="form-control"
            name="yield"
            value={formData.yield}
            onChange={handleNumberInputChange}
            min="1"
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label">Calories (kcal)</label>
          <input
            type="number"
            className="form-control"
            name="kilocalories"
            value={formData.kilocalories}
            onChange={handleNumberInputChange}
            min="0"
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Protein (g)</label>
          <input
            type="number"
            className="form-control"
            name="protein"
            value={formData.protein}
            onChange={handleNumberInputChange}
            min="0"
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Carbs (g)</label>
          <input
            type="number"
            className="form-control"
            name="carb"
            value={formData.carb}
            onChange={handleNumberInputChange}
            min="0"
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Fat (g)</label>
          <input
            type="number"
            className="form-control"
            name="fat"
            value={formData.fat}
            onChange={handleNumberInputChange}
            min="0"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Ingredients</label>
        <div className="ingredient-list mb-2">
          {formData.ingredients.map((ingredient, index) => (
            <div key={index} className="ingredient-item d-flex align-items-center mb-2">
              <span className="me-2">
                {ingredient.amount} {ingredient.unit.name.en} {ingredient.name.en}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => removeIngredient(index)}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ))}
        </div>
        <div className="input-group flex-nowrap">
          <input
            type="number"
            className="form-control"
            placeholder="Amount"
            value={newIngredient.amount || ''}
            onChange={(e) =>
              setNewIngredient((prev) => ({
                ...prev,
                amount: parseFloat(e.target.value) || 0,
              }))
            }
            min="0"
            step="0.1"
            style={{ width: '100px', flex: '0 0 auto' }}
          />
          <select
            className="form-select"
            value={newIngredient.unit._id}
            onChange={(e) => {
              const selectedUnit = units.find(u => u._id === e.target.value);
              if (selectedUnit) {
                setNewIngredient(prev => ({ ...prev, unit: selectedUnit }));
              }
            }}
            style={{ width: '120px', flex: '0 0 auto' }}
          >
            {units.map((unit) => (
              <option key={unit._id} value={unit._id}>
                {unit.name.en}
              </option>
            ))}
          </select>
          <IngredientTypeahead
            onSelect={(ingredient: ApiIngredient) => {
              setNewIngredient((prev) => ({
                ...prev,
                name: ingredient.name,
                _id: ingredient._id,
              }));
            }}
            placeholder="Search ingredients..."
            selectedIngredient={newIngredient._id ? { 
              _id: newIngredient._id, 
              name: newIngredient.name,
              category_id: '',  // These fields are required by the Ingredient type
              rewe_art_no: 0,  // but not used in the display context
              rewe_img_links: { xs: '', sm: '', md: '' },
              author_id: '',
              updated_at: new Date().toISOString()
            } : undefined}
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={addIngredient}
            style={{ flex: '0 0 auto' }}
          >
            Add
          </button>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Instructions</label>
        <textarea
          className="form-control"
          name="instructions"
          value={formData.instructions}
          onChange={handleInputChange}
          rows={5}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Tags</label>
        <div className="tag-list mb-2">
          {formData.tags.map((tag, index) => (
            <span key={index} className="badge bg-secondary me-2">
              {tag}
              <button
                type="button"
                className="btn btn-sm text-white"
                onClick={() => removeTag(tag)}
              >
                <i className="bi bi-x"></i>
              </button>
            </span>
          ))}
        </div>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Add a tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={addTag}
          >
            Add Tag
          </button>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Image</label>
        <input
          type="file"
          className="form-control"
          accept="image/*"
          onChange={handleImageChange}
        />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="mt-2 img-thumbnail"
            style={{ maxHeight: '200px' }}
          />
        )}
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {initialData ? 'Update Recipe' : 'Create Recipe'}
        </button>
      </div>
    </form>
  );
};

export default RecipeForm;
