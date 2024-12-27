import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Unit } from '../../types/recipe';
import { unitsApi } from '../../utils/unitsApi';

interface UnitsListProps {
  units: Unit[];
}

const UnitsList: React.FC<UnitsListProps> = ({ units }) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this unit?')) {
      try {
        await unitsApi.deleteUnit(id);
        // Refresh the page to get updated list
        window.location.reload();
      } catch (err) {
        setError('Failed to delete unit');
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
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit._id}>
                <td>{unit.name.en}</td>
                <td>{unit.name.de}</td>
                <td>{unit.name.fi}</td>
                <td className="text-end">
                  <button
                    onClick={() => navigate(`edit/${unit._id}`)}
                    className="btn btn-warning btn-sm me-2"
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(unit._id)}
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

export default UnitsList;
