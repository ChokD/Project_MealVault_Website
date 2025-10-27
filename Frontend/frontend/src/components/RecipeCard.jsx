import React from 'react';
import { Link } from 'react-router-dom';

function RecipeCard({ recipe }) {
  const categoryAndArea = [recipe.strCategory, recipe.strArea]
    .filter(Boolean)
    .join(' / ');

  return (
    <Link to={`/menus/${recipe.idMeal}`} className="block bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">
      <div className="relative overflow-hidden">
        <img className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" src={recipe.strMealThumb} alt={recipe.strMeal} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 truncate text-gray-800 group-hover:text-green-600 transition-colors" title={recipe.strMeal}>{recipe.strMeal}</h3>
        <p className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full inline-block">{categoryAndArea}</p>
      </div>
    </Link>
  );
}

export default RecipeCard;
