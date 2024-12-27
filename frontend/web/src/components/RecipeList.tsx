import React, { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import { Recipe, RecipeSearchFilters, TagFilters, Tag } from '../types/recipe';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import RecipeCard from './RecipeCard';

interface RecipeListProps {
  dishTypeSlug: string;
}

const RecipeList: React.FC<RecipeListProps> = ({ dishTypeSlug }) => {
  const { token } = useAuth();
  const [searchFilters, setSearchFilters] = useState<RecipeSearchFilters>({});
  const [localSearchValue, setLocalSearchValue] = useState("");
  const [localAuthorValue, setLocalAuthorValue] = useState("");
  
  // Debounced search filter update
  const debouncedSetSearchFilters = useCallback(
    debounce((updates: Partial<RecipeSearchFilters>) => {
      setSearchFilters(prev => ({
        ...prev,
        ...updates
      }));
    }, 500),
    []
  );

  // Cleanup debounced function on unmount
  React.useEffect(() => {
    return () => {
      debouncedSetSearchFilters.cancel();
    };
  }, [debouncedSetSearchFilters]);

  // Update local state immediately and debounce the API call
  const handleSearchChange = (value: string) => {
    setLocalSearchValue(value);
    if (!value || value.length >= 2) {
      debouncedSetSearchFilters({ name: value || undefined });
    }
  };

  const handleAuthorChange = (value: string) => {
    setLocalAuthorValue(value);
    if (!value || value.length >= 2) {
      debouncedSetSearchFilters({ 
        author: value ? {
          ...searchFilters.author,
          fullname: value
        } : undefined
      });
    }
  };

  const [tagFilters, setTagFilters] = useState<TagFilters>({});
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  const { data: tags } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags', {
        headers: {
          'Authorization': token || ''
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      return response.json();
    }
  });

  const queryClient = useQueryClient();

  const favoriteMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
        method: 'PATCH',
        headers: {
          'Authorization': token || '',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    }
  });

  const handleFavoriteToggle = (recipeId: string) => {
    favoriteMutation.mutate(recipeId);
  };

  const handleSchedule = (recipeId: string) => {
    // TODO: Implement schedule functionality
    console.log('Schedule recipe:', recipeId);
  };

  const { data: recipes, isLoading, error } = useQuery<Recipe[]>({
    queryKey: ['recipes', dishTypeSlug, searchFilters, tagFilters],
    enabled: !searchFilters.name || searchFilters.name.length >= 2,
    staleTime: 1000, // Keep data fresh for 1 second
    queryFn: async () => {
      const queryParams: Record<string, string> = {
        dishType: dishTypeSlug
      };

      if (searchFilters.name) {
        queryParams.name = searchFilters.name;
      }
      
      if (searchFilters.author?.fullname) {
        queryParams.author = searchFilters.author.fullname;
      }
      
      if (searchFilters.author?._id) {
        queryParams.myRecipes = 'true';
      }
      
      if (Object.keys(tagFilters).length > 0) {
        const selectedTags = Object.keys(tagFilters).filter(tag => tagFilters[tag]);
        if (selectedTags.length > 0) {
          queryParams.tags = selectedTags.join(',');
        }
      }

      const params = new URLSearchParams(queryParams);

      const response = await fetch(`/api/recipes?${params.toString()}`, {
        headers: {
          'Authorization': token || ''
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      return response.json();
    }
  });

  return (
    <div>
      <div className="search-container mb-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control form-control-lg"
            placeholder="Search recipes (type at least 2 characters)..."
            value={localSearchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          >
            <i className={`bi ${showAdvancedSearch ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            <span className="ms-2">{showAdvancedSearch ? 'Hide' : 'Advanced'} Search</span>
          </button>
        </div>
      </div>

      {showAdvancedSearch && (
        <div className="card mb-3">
          <div className="card-body">
            <div className="row">
              <div className="col-12 mb-3">
                <label htmlFor="authorSearch" className="form-label">Author</label>
                <input
                  type="text"
                  id="authorSearch"
                  className="form-control"
                  placeholder="Search by author (type at least 2 characters)..."
                  value={localAuthorValue}
                  onChange={(e) => handleAuthorChange(e.target.value)}
                />
              </div>
              <div className="col-12">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="myRecipes"
                    checked={!!searchFilters.author?._id}
                    onChange={(e) => setSearchFilters(prev => ({
                      ...prev,
                      author: {
                        ...prev.author,
                        _id: e.target.checked ? 'my' : undefined
                      }
                    }))}
                  />
                  <label className="form-check-label" htmlFor="myRecipes">
                    Show only my recipes
                  </label>
                </div>
              </div>
            </div>

            {tags && tags.length > 0 && (
              <>
                <div className="col-12 mt-3">
                  <h5>Tags</h5>
                </div>
                <div className="col-12">
                  <div className="row">
                    {tags.map(tag => (
                      <div key={tag.text} className="col-6 col-sm-4 col-md-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`tag-${tag.text}`}
                            checked={!!tagFilters[tag.text]}
                            onChange={(e) => setTagFilters(prev => ({
                              ...prev,
                              [tag.text]: e.target.checked
                            }))}
                          />
                          <label className="form-check-label" htmlFor={`tag-${tag.text}`}>
                            {tag.text} ({tag.count})
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="d-flex justify-content-center mt-3">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger mt-3">
          Error loading recipes: {error.message}
        </div>
      )}

      {recipes && recipes.length > 0 ? (
        <div className="row mt-3">
          {recipes.map(recipe => (
            <div key={recipe._id} className="col-12 col-md-6 col-lg-4 mb-3">
              <RecipeCard
                recipe={recipe}
                onFavoriteToggle={handleFavoriteToggle}
                onSchedule={handleSchedule}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info mt-3">
          No recipes found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default RecipeList;
