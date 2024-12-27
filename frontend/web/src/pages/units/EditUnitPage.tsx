import React, { useEffect } from 'react';
import { useNavigationTitle } from '../../contexts/NavigationTitleContext';
import { useParams } from 'react-router-dom';
import UnitForm from '../../components/units/UnitForm';

const EditUnitPage: React.FC = () => {
  const { id } = useParams();
  const { setTitle } = useNavigationTitle();
  
  useEffect(() => {
    setTitle('Edit Unit');
  }, [setTitle]);

  if (!id) {
    return <div>Error: Unit ID not provided</div>;
  }

  return (
    <div className="container mx-auto py-4">
      <UnitForm id={id} />
    </div>
  );
};

export default EditUnitPage;
