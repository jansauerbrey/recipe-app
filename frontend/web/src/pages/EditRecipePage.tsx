import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Unit, RecipeFormData, DishType, Recipe } from '../types/recipe';
import { Category } from '../types/category';
import { api } from '../utils/api';
import { recipeApi } from '../utils/recipeApi';
import RecipeForm from '../components/RecipeForm';

const EditRecipePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [dishTypes, setDishTypes] = useState<DishType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [recipeData, unitsData, dishTypesData, categoriesData] = await Promise.all([
          recipeApi.getRecipe(id!),
          api.get<Unit[]>('/units'),
          api.get<DishType[]>('/dishtypes'),
          api.get<Category[]>('/categories')
        ]);
        setRecipe(recipeData);
        setUnits(unitsData);
        setDishTypes(dishTypesData);
        setCategories(categoriesData);
      } catch (err) {
        setError('Failed to load required data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (formData: RecipeFormData) => {
    try {
      await recipeApi.updateRecipe(id!, formData);
      navigate(`/recipes/${id}`);
    } catch (err) {
      setError('Failed to update recipe');
    }
  };

  const handleCancel = () => {
    navigate(`/recipes/${id}`);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="alert alert-warning" role="alert">
        Recipe not found
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4">Edit Recipe</h1>
      <RecipeForm
        initialData={recipe}
        dishTypes={dishTypes}
        units={units}
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EditRecipePage;
