import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ingredient } from '../../types/ingredient';
import { ingredientsApi } from '../../utils/ingredientsApi';

interface IngredientListProps {
  ingredients: Ingredient[];
}

const IngredientList: React.FC<IngredientListProps> = ({ ingredients }) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this ingredient?')) {
      try {
        await ingredientsApi.deleteIngredient(id);
        // Refresh the page to get updated list
        window.location.reload();
      } catch (err) {
        setError('Failed to delete ingredient');
      }
    }
  };

  return (
    <>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Image</th>
              <th>English</th>
              <th>German</th>
              <th>Finnish</th>
              <th>REWE Article No.</th>
              <th>Category</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ingredient) => (
              <tr key={ingredient._id}>
                <td>
                  {ingredient.rewe_img_links.xs && (
                    <img 
                      src={ingredient.rewe_img_links.xs} 
                      alt={ingredient.name.en}
                      style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                    />
                  )}
                </td>
                <td>{ingredient.name.en}</td>
                <td>{ingredient.name.de}</td>
                <td>{ingredient.name.fi}</td>
                <td>{ingredient.rewe_art_no}</td>
                <td>{ingredient.category_id}</td>
                <td className="text-end">
                  <button
                    onClick={() => navigate(`edit/${ingredient._id}`)}
                    className="btn btn-warning btn-sm me-2"
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ingredient._id)}
                    className="btn btn-danger btn-sm"
                  >
                    <i className="bi bi-trash me-1"></i>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default IngredientList;
