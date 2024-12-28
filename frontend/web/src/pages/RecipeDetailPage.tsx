import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Recipe, Unit, DishType } from '../types/recipe';
import { api } from '../utils/api';
import { recipeApi } from '../utils/recipeApi';
import RecipeDetail from '../components/RecipeDetail';
import RecipeForm from '../components/RecipeForm';

const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [dishTypes, setDishTypes] = useState<DishType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [recipeData, unitsData, dishTypesData] = await Promise.all([
          recipeApi.getRecipe(id!),
          api.get<Unit[]>('/units'),
          api.get<DishType[]>('/dishtypes')
        ]);
        setRecipe(recipeData);
        setUnits(unitsData);
        setDishTypes(dishTypesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recipe');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleFavoriteToggle = async (recipeId: string) => {
    try {
      const updatedRecipe = await recipeApi.toggleFavorite(recipeId);
      setRecipe(updatedRecipe);
    } catch (err) {
      setError('Failed to update favorite status');
    }
  };

  const handleEdit = (recipeId: string) => {
    setIsEditing(true);
  };

  const handleDelete = async (recipeId: string) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await recipeApi.deleteRecipe(recipeId);
        navigate('/recipes');
      } catch (err) {
        setError('Failed to delete recipe');
      }
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      const updatedRecipe = await recipeApi.updateRecipe(id!, formData);
      setRecipe(updatedRecipe);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update recipe');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
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
      {isEditing ? (
        <RecipeForm
          initialData={recipe}
          dishTypes={dishTypes}
          units={units}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      ) : (
        <RecipeDetail
          recipe={recipe}
          onFavoriteToggle={handleFavoriteToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default RecipeDetailPage;
