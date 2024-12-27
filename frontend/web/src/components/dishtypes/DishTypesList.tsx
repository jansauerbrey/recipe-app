import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DishType } from '../../types/dishtype';
import { dishtypesApi } from '../../utils/dishtypesApi';

interface DishTypesListProps {
  dishTypes: DishType[];
}

const DishTypesList: React.FC<DishTypesListProps> = ({ dishTypes }) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this dish type?')) {
      try {
        await dishtypesApi.deleteDishType(id);
        // Refresh the page to get updated list
        window.location.reload();
      } catch (err) {
        setError('Failed to delete dish type');
      }
    }
  };

  return (
    <div>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <div className="row g-4">
        {dishTypes.map((dishType) => (
          <div key={dishType._id} className="col-12 col-sm-6 col-lg-4">
            <div className="card h-100">
              <img
                src={`/img/dishtypes/${dishType.imagePath}`}
                alt={dishType.name.en}
                className="card-img-top"
                style={{ height: '200px', objectFit: 'cover' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/img/dishtypes/no_image.png';
                }}
              />
              <div className="card-body">
                <h3 className="card-title h5">{dishType.name.en}</h3>
                <div className="text-muted mb-2">
                  <p className="mb-1">Finnish: {dishType.name.fi}</p>
                  <p className="mb-1">German: {dishType.name.de}</p>
                </div>
                <p className="text-muted mb-3">Order: {dishType.order}</p>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    onClick={() => navigate(`edit/${dishType._id}`)}
                    className="btn btn-warning btn-sm"
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dishType._id)}
                    className="btn btn-danger btn-sm"
                  >
                    <i className="bi bi-trash me-1"></i>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DishTypesList;
