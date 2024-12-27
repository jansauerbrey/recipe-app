import React, { useEffect } from 'react';
import { useNavigationTitle } from '../../contexts/NavigationTitleContext';
import DishTypeForm from '../../components/dishtypes/DishTypeForm';

const CreateDishTypePage: React.FC = () => {
  const { setTitle } = useNavigationTitle();
  
  useEffect(() => {
    setTitle('Create Dish Type');
  }, [setTitle]);

  return (
    <div className="container">
      <div className="row">
        <div className="col-xs-12 mb-5">
          <DishTypeForm />
        </div>
      </div>
    </div>
  );
};

export default CreateDishTypePage;
