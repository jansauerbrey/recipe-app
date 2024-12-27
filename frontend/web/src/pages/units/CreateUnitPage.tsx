import React, { useEffect } from 'react';
import { useNavigationTitle } from '../../contexts/NavigationTitleContext';
import UnitForm from '../../components/units/UnitForm';

const CreateUnitPage: React.FC = () => {
  const { setTitle } = useNavigationTitle();
  
  useEffect(() => {
    setTitle('Create Unit');
  }, [setTitle]);

  return (
    <div className="container mx-auto py-4">
      <UnitForm />
    </div>
  );
};

export default CreateUnitPage;
