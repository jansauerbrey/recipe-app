import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationTitle } from '../../contexts/NavigationTitleContext';
import { DishType } from '../../types/dishtype';
import { dishtypesApi } from '../../utils/dishtypesApi';
import DishTypesList from '../../components/dishtypes/DishTypesList';

const DishTypesPage: React.FC = () => {
  const { setTitle } = useNavigationTitle();
  
  useEffect(() => {
    setTitle('Dish Types');
  }, [setTitle]);
  const navigate = useNavigate();
  const [dishTypes, setDishTypes] = useState<DishType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDishTypes = async () => {
      try {
        setLoading(true);
        const data = await dishtypesApi.getDishTypes();
        setDishTypes(data.sort((a, b) => a.order - b.order));
        setError(null);
      } catch (err) {
        setError('Failed to load dish types');
      } finally {
        setLoading(false);
      }
    };

    fetchDishTypes();
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
              <span>New dish type</span>
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <DishTypesList dishTypes={dishTypes} />
        </div>
      </div>
    </div>
  );
};

export default DishTypesPage;
