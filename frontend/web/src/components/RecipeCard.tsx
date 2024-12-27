import React from 'react';
import { Link } from 'react-router-dom';
import { Recipe } from '../types/recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onFavoriteToggle: (recipeId: string) => void;
  onSchedule: (recipeId: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onFavoriteToggle, onSchedule }) => {
  return (
    <div className="recipe-card card mb-3">
      <div className="row g-0">
        <div className="col-md-4">
          <Link to={`/recipes/${recipe._id}`}>
            <img
              src={recipe.imagePath?.startsWith('http') ? recipe.imagePath : `/upload/${recipe.imagePath}`}
              className="card-img-top"
              alt={recipe.name}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/img/dishtypes/no_image.png';
              }}
            />
          </Link>
        </div>
        <div className="col-md-8">
          <div className="card-body">
            <Link to={`/recipes/${recipe._id}`} className="text-decoration-none">
              <h5 className="card-title text-dark">{recipe.name}</h5>
              <p className="card-text text-muted">
                <small>{recipe.author?.fullname || 'Unknown author'}</small>
              </p>
            </Link>
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-link"
                onClick={() => onFavoriteToggle(recipe._id)}
              >
                <i className={`bi ${recipe.fav_recipe ? 'bi-heart-fill' : 'bi-heart'}`}></i>
              </button>
              <button
                className="btn btn-link"
                onClick={() => onSchedule(recipe._id)}
              >
                <i className="bi bi-calendar"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
