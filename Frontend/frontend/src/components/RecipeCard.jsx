import React from 'react';
import { Link } from 'react-router-dom';

function RecipeCard({ recipe }) {
  const categoryAndArea = [recipe.strCategory, recipe.strArea]
    .filter(Boolean)
    .join(' / ');

  return (
    <Link to={`/menus/${recipe.idMeal}`} className="block bg-white rounded-xl shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
      <img className="w-full h-48 object-cover" src={recipe.strMealThumb} alt={recipe.strMeal} />
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 truncate" title={recipe.strMeal}>{recipe.strMeal}</h3>
        <p className="text-sm text-gray-500">{categoryAndArea}</p>
      </div>
    </Link>
  );
}

export default RecipeCard;
