import React, { useEffect } from 'react';
import { useNavigationTitle } from '../../contexts/NavigationTitleContext';
import { useParams } from 'react-router-dom';
import DishTypeForm from '../../components/dishtypes/DishTypeForm';

const EditDishTypePage: React.FC = () => {
  const { id } = useParams();
  const { setTitle } = useNavigationTitle();
  
  useEffect(() => {
    setTitle('Edit Dish Type');
  }, [setTitle]);

  if (!id) {
    return <div>Error: Dish Type ID not provided</div>;
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col-xs-12 mb-5">
          <DishTypeForm id={id} />
        </div>
      </div>
    </div>
  );
};

export default EditDishTypePage;
