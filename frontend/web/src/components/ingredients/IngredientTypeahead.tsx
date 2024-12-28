import React, { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from 'lodash';
import { Ingredient } from '../../types/ingredient';
import { ingredientsApi } from '../../utils/ingredientsApi';

interface IngredientTypeaheadProps {
  onSelect: (ingredient: Ingredient) => void;
  onCreateNew: (name: string) => void;
  placeholder?: string;
  selectedIngredient?: Ingredient;
}

export const IngredientTypeahead: React.FC<IngredientTypeaheadProps> = ({
  onSelect,
  onCreateNew,
  placeholder = 'Search ingredients...',
  selectedIngredient,
}) => {
  // Separate state for search input and display value
  const [searchQuery, setSearchQuery] = useState('');
  const [displayValue, setDisplayValue] = useState(selectedIngredient?.name.en || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const MIN_SEARCH_LENGTH = 2;
  const MAX_RESULTS = 10;

  // Update display value when selected ingredient changes
  useEffect(() => {
    setDisplayValue(selectedIngredient?.name.en || '');
    setSearchQuery('');
  }, [selectedIngredient]);

  useEffect(() => {
    // Load all ingredients on component mount
    const loadIngredients = async () => {
      try {
        const data = await ingredientsApi.getIngredients();
        setIngredients(data);
      } catch (error) {
        console.error('Failed to load ingredients:', error);
      }
    };
    loadIngredients();
  }, []);

  // Improved filtering algorithm that prioritizes matches at the start of words
  const filterIngredients = useCallback((query: string, allIngredients: Ingredient[]) => {
    if (!query || query.length < MIN_SEARCH_LENGTH) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const scored = allIngredients.map(ingredient => {
      const enName = ingredient.name.en.toLowerCase();
      const deName = ingredient.name.de.toLowerCase();
      const fiName = ingredient.name.fi.toLowerCase();
      
      // Calculate match scores (lower is better)
      let score = 1000;
      
      // Exact match at start (highest priority)
      if (enName.startsWith(lowerQuery) || deName.startsWith(lowerQuery) || fiName.startsWith(lowerQuery)) {
        score = 1;
      }
      // Word start match
      else if (
        enName.includes(' ' + lowerQuery) || 
        deName.includes(' ' + lowerQuery) || 
        fiName.includes(' ' + lowerQuery)
      ) {
        score = 2;
      }
      // Contains match (lowest priority)
      else if (
        enName.includes(lowerQuery) || 
        deName.includes(lowerQuery) || 
        fiName.includes(lowerQuery)
      ) {
        score = 3;
      }
      else {
        return null; // No match
      }
      
      return { ingredient, score };
    })
    .filter((item): item is { ingredient: Ingredient; score: number } => item !== null)
    .sort((a, b) => {
      // Sort by score first
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      // Then alphabetically by English name
      return a.ingredient.name.en.localeCompare(b.ingredient.name.en);
    })
    .slice(0, MAX_RESULTS) // Limit results
    .map(item => item.ingredient);

    return scored;
  }, []);

  // Debounced filter effect
  useEffect(() => {
    setHighlightedIndex(-1);
    const query = isOpen ? searchQuery : displayValue;
    
    if (!query || query.length < MIN_SEARCH_LENGTH) {
      setFilteredIngredients([]);
      return;
    }

    setIsLoading(true);
    const debouncedFilter = debounce(() => {
      const filtered = filterIngredients(query, ingredients);
      setFilteredIngredients(filtered);
      setIsLoading(false);
    }, 150);

    debouncedFilter();
    return () => debouncedFilter.cancel();
  }, [searchQuery, displayValue, ingredients, isOpen, filterIngredients]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        setSearchQuery('');
        setDisplayValue(selectedIngredient?.name.en || '');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedIngredient]);

  const handleSelect = (ingredient: Ingredient) => {
    onSelect(ingredient);
    setDisplayValue(ingredient.name.en);
    setSearchQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setDisplayValue(value);
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className="position-relative">
      <input
        type="text"
        className="form-control"
        value={isOpen ? searchQuery : displayValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          setIsOpen(true);
          setSearchQuery(displayValue);
        }}
        onKeyDown={(e) => {
          switch (e.key) {
            case 'ArrowDown':
              e.preventDefault();
              setIsOpen(true);
              setHighlightedIndex(prev => 
                prev < filteredIngredients.length - 1 ? prev + 1 : prev
              );
              break;
            case 'ArrowUp':
              e.preventDefault();
              setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
              break;
            case 'Enter':
              e.preventDefault();
              if (highlightedIndex >= 0 && highlightedIndex < filteredIngredients.length) {
                handleSelect(filteredIngredients[highlightedIndex]);
              } else if (searchQuery.trim() && filteredIngredients.length === 0) {
                onCreateNew(searchQuery);
              }
              break;
            case 'Escape':
              setIsOpen(false);
              setHighlightedIndex(-1);
              setSearchQuery('');
              setDisplayValue(selectedIngredient?.name.en || '');
              break;
          }
        }}
        placeholder={placeholder}
        aria-label="Search ingredients"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="ingredient-listbox"
        aria-autocomplete="list"
        aria-activedescendant={
          highlightedIndex >= 0 ? `ingredient-option-${highlightedIndex}` : undefined
        }
      />
      {isOpen && (
        <div 
          id="ingredient-listbox"
          role="listbox"
          className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm" 
          style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
        >
          {isLoading && (
            <div className="p-2 text-muted">Loading...</div>
          )}
          {!isLoading && searchQuery.length < MIN_SEARCH_LENGTH && (
            <div className="p-2 text-muted">Type at least {MIN_SEARCH_LENGTH} characters to search...</div>
          )}
          {!isLoading && searchQuery.length >= MIN_SEARCH_LENGTH && filteredIngredients.length > 0 && (
            filteredIngredients.map((ingredient, index) => (
              <div
                key={ingredient._id}
                id={`ingredient-option-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                className={`p-2 cursor-pointer ${
                  highlightedIndex === index ? 'bg-primary text-white' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleSelect(ingredient)}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseLeave={() => setHighlightedIndex(-1)}
              >
                {ingredient.name.en}
              </div>
            ))
          )}
          {!isLoading && searchQuery.length >= MIN_SEARCH_LENGTH && filteredIngredients.length === 0 && searchQuery.trim() && (
            <div
              role="option"
              aria-selected={false}
              className="p-2 cursor-pointer hover:bg-gray-100 d-flex align-items-center"
              onClick={() => onCreateNew(searchQuery)}
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Create new ingredient: "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IngredientTypeahead;
