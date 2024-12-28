import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category } from '../../types/category';
import { categoriesApi } from '../../utils/categoriesApi';

interface CategoryListProps {
  categories: Category[];
}

const CategoryList: React.FC<CategoryListProps> = ({ categories }) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoriesApi.deleteCategory(id);
        // Refresh the page to get updated list
        window.location.reload();
      } catch (err) {
        setError('Failed to delete category');
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
              <th>English</th>
              <th>German</th>
              <th>Finnish</th>
              <th>REWE Category ID</th>
              <th>Parent Category</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category._id}>
                <td>{category.name.en}</td>
                <td>{category.name.de}</td>
                <td>{category.name.fi}</td>
                <td>{category.rewe_cat_id}</td>
                <td>{category.parent_id || '-'}</td>
                <td className="text-end">
                  <button
                    onClick={() => navigate(`edit/${category._id}`)}
                    className="btn btn-warning btn-sm me-2"
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
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

export default CategoryList;
