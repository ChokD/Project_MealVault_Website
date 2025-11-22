import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { API_URL, IMAGE_URL } from '../config/api';

const emptyIngredient = { name: '', amount: '' };
const emptyStep = { detail: '' };

function CreateRecipePage() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipeSummary, setRecipeSummary] = useState('');
  const [recipeCategory, setRecipeCategory] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState([emptyIngredient]);
  const [steps, setSteps] = useState([emptyStep]);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkingPlagiarism, setCheckingPlagiarism] = useState(false);
  const [plagiarismWarning, setPlagiarismWarning] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const updateIngredient = (index, field, value) => {
    setIngredients(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const addIngredient = () => {
    setIngredients(prev => [...prev, emptyIngredient]);
  };

  const removeIngredient = (index) => {
    setIngredients(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateStep = (index, value) => {
    setSteps(prev => prev.map((item, idx) => idx === index ? { detail: value } : item));
  };

  const addStep = () => setSteps(prev => [...prev, emptyStep]);

  const removeStep = (index) => {
    setSteps(prev => prev.filter((_, idx) => idx !== index));
  };

  const checkPlagiarism = async () => {
    const filteredIngredients = ingredients.filter(item => item.name.trim());
    const filteredSteps = steps.filter(item => item.detail.trim());

    setCheckingPlagiarism(true);
    setPlagiarismWarning(null);
    
    try {
      const response = await fetch(`${API_URL}/plagiarism/check-recipe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: recipeTitle,
          summary: recipeSummary,
          ingredients: filteredIngredients,
          steps: filteredSteps.map((item, index) => ({
            order: index + 1,
            detail: item.detail
          }))
        })
      });

      const data = await response.json();
      if (data.plagiarismCheck && !data.isOriginal) {
        setPlagiarismWarning(data.plagiarismCheck);
      }
    } catch (error) {
      console.error('Plagiarism check failed:', error);
    } finally {
      setCheckingPlagiarism(false);
    }
  };

  const parseMinutes = (value) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : Math.max(0, parsed);
  };

  const prepMinutes = parseMinutes(prepTime);
  const cookMinutes = parseMinutes(cookTime);
  const computedTotalTime =
    prepMinutes === null && cookMinutes === null
      ? ''
      : (prepMinutes || 0) + (cookMinutes || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const filteredIngredients = ingredients.filter(item => item.name.trim());
    const filteredSteps = steps.filter(item => item.detail.trim());

    if (filteredIngredients.length === 0) {
      setError('กรุณาระบุวัตถุดิบอย่างน้อย 1 รายการ');
      return;
    }
    if (filteredSteps.length === 0) {
      setError('กรุณาระบุขั้นตอนอย่างน้อย 1 ขั้น');
      return;
    }

    // Check plagiarism before submitting
    await checkPlagiarism();

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('recipe_title', recipeTitle);
      formData.append('recipe_summary', recipeSummary);
      formData.append('recipe_category', recipeCategory);
      formData.append('prep_time_minutes', prepTime);
      formData.append('cook_time_minutes', cookTime);
      formData.append('total_time_minutes', computedTotalTime === '' ? '' : computedTotalTime);
      formData.append('servings', servings);
      formData.append('ingredients', JSON.stringify(filteredIngredients));
      formData.append('steps', JSON.stringify(filteredSteps.map((item, index) => ({
        order: index + 1,
        detail: item.detail
      }))));
      if (imageFile) {
        formData.append('recipe_image', imageFile);
      }

      const response = await fetch(`${API_URL}/recipes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'ไม่สามารถสร้างสูตรอาหารได้');
      }

      setSuccess('สร้างสูตรอาหารสำเร็จ!');
      setTimeout(() => {
        navigate(`/menus/${data.post?.recipe_id || data.post?.cpost_id || ''}`);
      }, 1200);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-6 sm:px-8 max-w-5xl">
          <div className="bg-white shadow-xl rounded-2xl p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">สร้างสูตรอาหาร</h1>
                <p className="text-gray-500">สร้างและแบ่งปันสูตรอาหารที่คุณชื่นชอบ</p>
              </div>
            </div>

            {plagiarismWarning && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-1">พบความคล้ายคลึงกับสูตรที่มีอยู่</h4>
                    <p className="text-sm text-yellow-700">
                      ระบบตรวจพบความคล้ายคลึง {Math.round(plagiarismWarning.similarityScore * 100)}% กับสูตรอื่นในระบบ
                    </p>
                    {plagiarismWarning.reason && (
                      <p className="text-sm text-yellow-600 mt-1">{plagiarismWarning.reason}</p>
                    )}
                    <p className="text-sm text-yellow-600 mt-2">
                      คุณยังสามารถสร้างสูตรนี้ได้ แต่ควรเพิ่มเอกลักษณ์หรือวิธีทำที่แตกต่างออกไป
                    </p>
                  </div>
                </div>
              </div>
            )}
            {checkingPlagiarism && (
              <p className="mb-4 text-sm text-yellow-600">กำลังตรวจสอบความซ้ำซ้อนของสูตร โปรดรอสักครู่...</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">ข้อมูลสูตร</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสูตรอาหาร *</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={recipeTitle}
                      onChange={(e) => setRecipeTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย / สรุปสูตร</label>
                    <textarea
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={recipeSummary}
                      onChange={(e) => setRecipeSummary(e.target.value)}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                    <input
                      type="text"
                      placeholder="เช่น อาหารเช้า, เมนูสุขภาพ"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={recipeCategory}
                      onChange={(e) => setRecipeCategory(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเสิร์ฟ</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={servings}
                      onChange={(e) => setServings(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเตรียม (นาที)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เวลาปรุง (นาที)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={cookTime}
                      onChange={(e) => setCookTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เวลารวม (นาที)</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
                      value={computedTotalTime}
                      placeholder="ระบบคำนวณจากเวลาเตรียม + เวลาปรุง"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพประกอบ</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0] || null)}
                      className="w-full text-sm text-gray-500"
                    />
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">รายการวัตถุดิบ *</h2>
                  <button type="button" onClick={addIngredient} className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200">
                    + เพิ่มวัตถุดิบ
                  </button>
                </div>
                <div className="space-y-4">
                  {ingredients.map((ingredient, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center bg-gray-50 p-4 rounded-xl">
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อวัตถุดิบ</label>
                        <input
                          type="text"
                          value={ingredient.name}
                          onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="เช่น อกไก่, กระเทียม"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">ปริมาณ / หน่วย</label>
                        <input
                          type="text"
                          value={ingredient.amount}
                          onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="เช่น 200 กรัม, 2 กลีบ"
                        />
                      </div>
                      {ingredients.length > 1 && (
                        <div className="md:col-span-5 flex justify-end">
                          <button type="button" onClick={() => removeIngredient(index)} className="text-sm text-red-500 hover:underline">
                            ลบรายการ
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">ขั้นตอนการทำ *</h2>
                  <button type="button" onClick={addStep} className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200">
                    + เพิ่มขั้นตอน
                  </button>
                </div>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-700">ขั้นตอนที่ {index + 1}</h3>
                        {steps.length > 1 && (
                          <button type="button" onClick={() => removeStep(index)} className="text-sm text-red-500 hover:underline">
                            ลบขั้นตอน
                          </button>
                        )}
                      </div>
                      <textarea
                        rows="3"
                        value={step.detail}
                        onChange={(e) => updateStep(index, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="อธิบายขั้นตอนการทำอาหารอย่างละเอียด"
                      ></textarea>
                    </div>
                  ))}
                </div>
              </section>

              {error && (
                <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg">
                  {success}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/menus')}
                  className="px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-50"
                  disabled={submitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'กำลังบันทึก...' : 'เผยแพร่สูตรอาหาร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreateRecipePage;


