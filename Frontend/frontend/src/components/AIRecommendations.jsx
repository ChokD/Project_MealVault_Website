import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://localhost:3000/api';

function AIRecommendations() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/ai/recommendations`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (err) {
        console.error('Error fetching AI recommendations:', err);
        setError('ไม่สามารถโหลดคำแนะนำได้');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [token]);

  const trackAndNavigate = async (menuId) => {
    if (token && menuId) {
      try {
        // Track menu view
        await fetch(`${API_URL}/behavior/menu/view`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ menu_id: menuId, user_id: user?.user_id })
        });
      } catch (error) {
        console.error('Failed to track view:', error);
      }
    }
    
    if (menuId) {
      navigate(`/menus/${menuId}`);
    }
  };

  if (!token) {
    return (
      <div className="mb-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🤖 AI แนะนำเมนูสำหรับคุณ
        </h2>
        <p className="text-gray-600 mb-6">
          เข้าสู่ระบบเพื่อรับคำแนะนำเมนูที่เหมาะกับคุณโดยเฉพาะ
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:shadow-lg transition-all"
        >
          เข้าสู่ระบบ
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mb-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🤖 AI แนะนำเมนูสำหรับคุณ
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-white/50 rounded-2xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🤖 AI แนะนำเมนูสำหรับคุณ
        </h2>
        <span className="text-xs text-purple-600 font-medium px-3 py-1 bg-white rounded-full">
          ปรับตามพฤติกรรมของคุณ
        </span>
      </div>
      
      <div className="space-y-4">
        {recommendations.slice(0, 5).map((rec, index) => (
          <div
            key={rec.menu_id || index}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-purple-100"
            onClick={() => trackAndNavigate(rec.menu_id)}
          >
            <div className="flex items-start gap-4">
              {rec.menu_image && (
                <img
                  src={rec.menu_image.startsWith('http') 
                    ? rec.menu_image 
                    : `http://localhost:3000/images/${rec.menu_image}`}
                  alt={rec.menu_name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">
                  {rec.menu_name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {rec.menu_description || rec.reason}
                </p>
                <div className="flex flex-wrap gap-2">
                  {rec.matching_preferences?.map((pref, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full"
                    >
                      {pref}
                    </span>
                  ))}
                  {rec.estimated_calories && (
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                      ~{rec.estimated_calories} แคล
                    </span>
                  )}
                  {!rec.exists_in_db && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      AI สร้างขึ้น
                    </span>
                  )}
                </div>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/search')}
          className="text-purple-600 font-medium hover:text-purple-700 text-sm"
        >
          ดูเมนูแนะนำเพิ่มเติม →
        </button>
      </div>
    </div>
  );
}

export default AIRecommendations;
