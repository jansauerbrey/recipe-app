import React from 'react';
import { Recipe } from '../types/recipe';

interface RecipeDetailProps {
  recipe: Recipe;
  onFavoriteToggle: (recipeId: string) => void;
  onEdit: (recipeId: string) => void;
  onDelete: (recipeId: string) => void;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  onFavoriteToggle,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="recipe-detail">
      <div className="recipe-header">
        <div className="d-flex justify-content-between align-items-start">
          <h1>{recipe.name}</h1>
          <div className="recipe-actions">
            <button
              className="btn btn-link"
              onClick={() => onFavoriteToggle(recipe._id)}
            >
              <i className={`bi ${recipe.fav_recipe ? 'bi-heart-fill' : 'bi-heart'}`}></i>
            </button>
            <button
              className="btn btn-link"
              onClick={() => onEdit(recipe._id)}
            >
              <i className="bi bi-pencil"></i>
            </button>
            <button
              className="btn btn-link text-danger"
              onClick={() => onDelete(recipe._id)}
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
        <p className="text-muted">
          By {recipe.author?.fullname || 'Unknown'} | {new Date(recipe.updated_at).toLocaleDateString()}
        </p>
      </div>

      <div className="recipe-image mb-4">
        {recipe.imagePath ? (
          <img
            src={recipe.imagePath.startsWith('http') ? recipe.imagePath : `/upload/${recipe.imagePath}`}
            alt={recipe.name}
            className="img-fluid rounded"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/img/dishtypes/no_image.png';
            }}
          />
        ) : (
          <img
            src="/img/dishtypes/no_image.png"
            alt={recipe.name}
            className="img-fluid rounded"
          />
        )}
      </div>

      <div className="recipe-info mb-4">
        <div className="row">
          <div className="col-md-3">
            <h5>Preparation Time</h5>
            <p>{recipe.prepTime} min</p>
          </div>
          <div className="col-md-3">
            <h5>Cooking Time</h5>
            <p>{recipe.cookTime} min</p>
          </div>
          <div className="col-md-3">
            <h5>Total Time</h5>
            <p>{recipe.totalTime} min</p>
          </div>
          <div className="col-md-3">
            <h5>Servings</h5>
            <p>{recipe.yield}</p>
          </div>
        </div>
      </div>

      <div className="recipe-nutrition mb-4">
        <h3>Nutrition Information</h3>
        <div className="row">
          <div className="col-md-3">
            <h5>Calories</h5>
            <p>{recipe.kilocalories} kcal</p>
          </div>
          <div className="col-md-3">
            <h5>Protein</h5>
            <p>{recipe.protein}g</p>
          </div>
          <div className="col-md-3">
            <h5>Carbohydrates</h5>
            <p>{recipe.carb}g</p>
          </div>
          <div className="col-md-3">
            <h5>Fat</h5>
            <p>{recipe.fat}g</p>
          </div>
        </div>
      </div>

      {recipe.ingredients?.length > 0 && (
        <div className="recipe-ingredients mb-4">
          <h3>Ingredients</h3>
          <ul className="list-unstyled">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="mb-2">
                {ingredient.amount} {ingredient.unit.name.en} {ingredient.name.en}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recipe.instructions && (
        <div className="recipe-instructions">
          <h3>Instructions</h3>
          {recipe.instructions.split('\n').map((instruction, index) => (
            <p key={index}>{instruction}</p>
          ))}
        </div>
      )}

      {recipe.tags?.length > 0 && (
        <div className="recipe-tags mt-4">
          <h3>Tags</h3>
          <div className="d-flex flex-wrap gap-2">
            {recipe.tags.map((tag, index) => (
              <span key={index} className="badge bg-secondary">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDetail;
