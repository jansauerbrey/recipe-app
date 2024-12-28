import React, { useState, useEffect, useRef } from 'react';
import { Ingredient } from '../../types/ingredient';
import { ingredientsApi } from '../../utils/ingredientsApi';

interface IngredientTypeaheadProps {
  onSelect: (ingredient: Ingredient) => void;
  placeholder?: string;
  selectedIngredient?: Ingredient;
}

export const IngredientTypeahead: React.FC<IngredientTypeaheadProps> = ({
  onSelect,
  placeholder = 'Search ingredients...',
  selectedIngredient,
}) => {
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    if (selectedIngredient) {
      setQuery(selectedIngredient.name.en);
    } else {
      setQuery('');
    }
  }, [selectedIngredient]);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setHighlightedIndex(-1);
    // Filter ingredients based on search query
    const filtered = ingredients.filter((ingredient) =>
      ingredient.name.en.toLowerCase().includes(query.toLowerCase()) ||
      ingredient.name.de.toLowerCase().includes(query.toLowerCase()) ||
      ingredient.name.fi.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredIngredients(filtered);
  }, [query, ingredients]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (ingredient: Ingredient) => {
    onSelect(ingredient);
    setQuery(ingredient.name.en);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div ref={wrapperRef} className="position-relative">
      <input
        type="text"
        className="form-control"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
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
              }
              break;
            case 'Escape':
              setIsOpen(false);
              setHighlightedIndex(-1);
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
      {isOpen && filteredIngredients.length > 0 && (
        <div 
          id="ingredient-listbox"
          role="listbox"
          className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm" 
          style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
        >
          {filteredIngredients.map((ingredient, index) => (
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
          ))}
        </div>
      )}
    </div>
  );
};

export default IngredientTypeahead;
