import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationTitle } from '../../contexts/NavigationTitleContext';
import { Unit } from '../../types/recipe';
import { unitsApi } from '../../utils/unitsApi';
import UnitsList from '../../components/units/UnitsList';

const UnitsPage: React.FC = () => {
  const { setTitle } = useNavigationTitle();
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle('Units');
  }, [setTitle]);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoading(true);
        const data = await unitsApi.getUnits();
        setUnits(data);
        setError(null);
      } catch (err) {
        setError('Failed to load units');
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
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
              <span>New unit</span>
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <UnitsList units={units} />
        </div>
      </div>
    </div>
  );
};

export default UnitsPage;
