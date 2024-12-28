import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationTitle } from '../../contexts/NavigationTitleContext';
import { Category } from '../../types/category';
import { categoriesApi } from '../../utils/categoriesApi';
import CategoryList from '../../components/categories/CategoryList';

const CategoriesPage: React.FC = () => {
  const { setTitle } = useNavigationTitle();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle('Categories');
  }, [setTitle]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await categoriesApi.getCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
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
              <span>New category</span>
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <CategoryList categories={categories} />
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
