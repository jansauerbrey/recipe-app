import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationTitle } from '../../contexts/NavigationTitleContext';
import { Ingredient } from '../../types/ingredient';
import { ingredientsApi } from '../../utils/ingredientsApi';
import IngredientList from '../../components/ingredients/IngredientList';

const IngredientsPage: React.FC = () => {
  const { setTitle } = useNavigationTitle();
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle('Ingredients');
  }, [setTitle]);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoading(true);
        const data = await ingredientsApi.getIngredients();
        setIngredients(data);
        setError(null);
      } catch (err) {
        setError('Failed to load ingredients');
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, []);

  if (loading) {
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
      <div className="row">
        <div className="col-xs-12 mb-5">
          <div className="d-flex justify-content-end mb-4">
            <button 
              onClick={() => navigate('create')} 
              className="btn btn-primary"
            >
              <i className="bi bi-plus-lg me-2"></i>
              <span>New ingredient</span>
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <IngredientList ingredients={ingredients} />
        </div>
      </div>
    </div>
  );
};

export default IngredientsPage;
