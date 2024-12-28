import React, { useEffect, useState } from 'react';
import { useNavigationTitle } from '../../contexts/NavigationTitleContext';
import { useParams } from 'react-router-dom';
import IngredientForm from '../../components/ingredients/IngredientForm';
import { Category } from '../../types/category';
import { categoriesApi } from '../../utils/categoriesApi';

const EditIngredientPage: React.FC = () => {
  const { id } = useParams();
  const { setTitle } = useNavigationTitle();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setTitle('Edit Ingredient');
  }, [setTitle]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesApi.getCategories();
        setCategories(data);
      } catch (err) {
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (!id) {
    return <div>Error: Ingredient ID not provided</div>;
  }

  if (loading) {
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
      <div className="container mx-auto py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      <IngredientForm id={id} categories={categories} />
    </div>
  );
};

export default EditIngredientPage;
