import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { DISH_TYPES, RecipeCount, Recipe } from '../types/recipe';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import RecipeList from '../components/RecipeList';

const RecipesPage: React.FC = () => {
  const { dishTypeSlug } = useParams();
  const { token } = useAuth();

  // Query for recipe counts
  const { data: recipeCount } = useQuery<RecipeCount>({
    queryKey: ['recipeCount'],
    queryFn: async () => {
      const response = await fetch('/api/other/recipecount', {
        headers: {
          'Authorization': token || ''
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recipe counts');
      }
      return response.json();
    }
  });

  // Query for recipes
  useQuery<Recipe[]>({
    queryKey: ['recipes', dishTypeSlug],
    queryFn: async () => {
      // Only fetch recipes if dishTypeSlug is defined
      if (!dishTypeSlug) return [];
      
      const response = await fetch(`/api/recipes?dishType=${dishTypeSlug}`, {
        headers: {
          'Authorization': token || ''
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      const data = await response.json();
      console.log('Recipes data:', data); // Log the recipe data
      return data;
    }
  });

  return (
    <div className="container">
      <div className="row">
        <div className="col-xs-12 mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="hidden-xs">Recipes</h3>
            <Link 
              to="/recipes/new" 
              className="btn btn-primary"
              role="button"
            >
              <i className="bi bi-plus-lg me-2"></i>
              <span>New recipe</span>
            </Link>
          </div>

          <div className="row g-4">
            {DISH_TYPES.map((type) => (
              <div key={type.id} className="col-6 col-sm-4 col-md-3">
                <Link to={`/recipes/${type.slug}`} className="text-decoration-none">
                  <div className="card h-100">
                    <img 
                      src={type.imageUrl} 
                      className="card-img-top" 
                      alt={type.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/img/dishtypes/no_image.png';
                      }}
                    />
                    <div className="card-body">
                      <h5 className="card-title">{type.name}</h5>
                      <p className="card-text text-muted">
                        {recipeCount ? 
                          `${recipeCount[type.slug as keyof RecipeCount] || 0} recipes` : 
                          '0 recipes'
                        }
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {dishTypeSlug && (
            <div className="mt-4">
              <RecipeList dishTypeSlug={dishTypeSlug} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { RecipesPage };
