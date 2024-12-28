import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RECIPE_FILTERS, RecipeCount, DishType } from '../types/recipe';
import './RecipesPage.css';
import { useQuery } from '@tanstack/react-query';
import { otherApi } from '../utils/otherApi';
import { api } from '../utils/api';
import RecipeList from '../components/RecipeList';

const RecipesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dishTypeSlug = searchParams.get('dishType');

  // Query for recipe counts
  const { data: recipeCount } = useQuery<RecipeCount>({
    queryKey: ['recipeCount'],
    queryFn: () => otherApi.getRecipeCounts()
  });

  const { data: dishTypes, isLoading: isLoadingDishTypes } = useQuery<DishType[]>({
    queryKey: ['dishTypes'],
    queryFn: () => api.get('/dishtypes')
  });

  return (
    <div className="container">
      <div className="row">
        <div className="col-xs-12 mb-5">
          <div className="d-flex justify-content-end mb-4">
            <Link 
              to="/recipes/new" 
              className="btn btn-primary"
              role="button"
            >
              <i className="bi bi-plus-lg me-2"></i>
              <span>New recipe</span>
            </Link>
          </div>

          {dishTypeSlug ? (
            <RecipeList />
          ) : (
            <>
              {/* Recipe Filters */}
              <div className="row g-4 mb-4">
                {RECIPE_FILTERS.map((type) => (
                  <div key={type._id} className="col-12 col-sm-6 col-lg-3">
                    <Link 
                      to={`/recipes/filter?dishType=${type.identifier}`} 
                      className="text-decoration-none"
                      state={{ isSpecialFilter: true }}
                    >
                      <div className="card h-100">
                        {type.imagePath ? (
                          <img 
                            src={`/img/dishtypes/${type.imagePath}`} 
                            className="card-img-top" 
                            alt={type.name.en}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/img/dishtypes/no_image.png';
                            }}
                          />
                        ) : (
                          <img
                            src="/img/dishtypes/no_image.png"
                            className="card-img-top"
                            alt={type.name.en}
                          />
                        )}
                        <div className="card-body">
                          <h5 className="card-title">{type.name.en}</h5>
                          <p className="card-text text-muted">
                            {recipeCount ? 
                              `${recipeCount[type.identifier as keyof RecipeCount] || 0} recipes` : 
                              '0 recipes'
                            }
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Visual Separator */}
              <div className="border-bottom mb-4"></div>

              {/* Dish Types */}
              <div className="row g-4">
                {isLoadingDishTypes ? (
                  <div className="col-12 text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : dishTypes?.map((type) => (
                  <div key={type._id} className="col-12 col-sm-6 col-lg-4 col-xxl-3">
                    <Link 
                      to={`/recipes/filter?dishType=${type.identifier}`} 
                      className="text-decoration-none"
                    >
                      <div className="card h-100">
                        {type.imagePath ? (
                          <img 
                            src={`/img/dishtypes/${type.imagePath}`} 
                            className="card-img-top" 
                            alt={type.name.en}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/img/dishtypes/no_image.png';
                            }}
                          />
                        ) : (
                          <img
                            src="/img/dishtypes/no_image.png"
                            className="card-img-top"
                            alt={type.name.en}
                          />
                        )}
                        <div className="card-body">
                          <h5 className="card-title">{type.name.en}</h5>
                          <p className="card-text text-muted">
                            {recipeCount ? 
                              `${recipeCount[type.identifier as keyof RecipeCount] || 0} recipes` : 
                              '0 recipes'
                            }
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export { RecipesPage };
