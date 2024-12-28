import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Unit, RecipeFormData, DishType } from '../types/recipe';
import { api } from '../utils/api';
import { recipeApi } from '../utils/recipeApi';
import RecipeForm from '../components/RecipeForm';

const CreateRecipePage: React.FC = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [dishTypes, setDishTypes] = useState<DishType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [unitsData, dishTypesData] = await Promise.all([
          api.get<Unit[]>('/units'),
          api.get<DishType[]>('/dishtypes')
        ]);
        setUnits(unitsData);
        setDishTypes(dishTypesData);
      } catch (err) {
        setError('Failed to load required data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (formData: RecipeFormData) => {
    try {
      const newRecipe = await recipeApi.createRecipe(formData);
      navigate(`/recipes/${newRecipe._id}`);
    } catch (err) {
      setError('Failed to create recipe');
    }
  };

  const handleCancel = () => {
    navigate('/recipes');
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

  return (
    <div className="container py-4">
      <h1 className="mb-4">Create New Recipe</h1>
      <RecipeForm
        dishTypes={dishTypes}
        units={units}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default CreateRecipePage;
