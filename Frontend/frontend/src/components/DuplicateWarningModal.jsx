import React from 'react';

function DuplicateWarningModal({ isOpen, onClose, onContinue, duplicateData }) {
  if (!isOpen) return null;

  const { risk, overallScore, duplicateMatches = [], patternAnalysis } = duplicateData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start mb-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              risk === 'high' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <svg className={`w-6 h-6 ${risk === 'high' ? 'text-red-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className={`text-xl font-bold ${risk === 'high' ? 'text-red-600' : 'text-yellow-600'}`}>
                {risk === 'high' ? 'ตรวจพบสูตรที่คล้ายกันมาก' : 'พบสูตรที่คล้ายกัน'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                คะแนนความคล้าย: <span className="font-semibold">{overallScore}%</span>
              </p>
            </div>
          </div>

          {/* Pattern Analysis */}
          {patternAnalysis && (patternAnalysis.hasUrl || patternAnalysis.hasCreditKeywords || patternAnalysis.hasCopyrightSymbol) && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">📋 ตรวจพบรูปแบบเนื้อหา:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {patternAnalysis.hasUrl && <li>• มี URL อ้างอิง</li>}
                {patternAnalysis.hasCreditKeywords && <li>• มีคำที่แสดงถึงการอ้างอิง (เครดิต/ที่มา)</li>}
                {patternAnalysis.hasCopyrightSymbol && <li>• มีสัญลักษณ์ลิขสิทธิ์ (©/®/™)</li>}
              </ul>
            </div>
          )}

          {/* Duplicate Matches */}
          {duplicateMatches.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">สูตรที่คล้ายกันในระบบ:</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {duplicateMatches.map((match, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold text-gray-900">{match.recipe_title}</h5>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        match.similarity >= 70 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {match.similarity}% คล้าย
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">โดย: {match.creator_username}</p>
                    {match.source_url && (
                      <p className="text-xs text-blue-600 mt-1 truncate">
                        แหล่งอ้างอิง: {match.source_url}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning Message */}
          <div className={`p-4 rounded-lg mb-6 ${
            risk === 'high' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={`text-sm ${risk === 'high' ? 'text-red-800' : 'text-yellow-800'}`}>
              {risk === 'high' ? (
                <>
                  <strong>ไม่สามารถเผยแพร่สูตรนี้ได้</strong> เนื่องจากมีความคล้ายกับสูตรอื่นมากเกินไป 
                  กรุณาตรวจสอบและแก้ไขเนื้อหาให้แตกต่างมากขึ้น หรือระบุแหล่งอ้างอิงที่ชัดเจน
                </>
              ) : (
                <>
                  <strong>โปรดทราบ:</strong> สูตรนี้มีความคล้ายกับสูตรอื่นในระบบ 
                  หากนี่เป็นสูตรต้นฉบับของคุณ โปรดระบุว่าเป็นสูตรต้นฉบับ 
                  หากดัดแปลงมาจากที่อื่น ควรระบุแหล่งอ้างอิงให้ชัดเจน
                </>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {risk === 'high' ? 'แก้ไขสูตร' : 'ย้อนกลับแก้ไข'}
            </button>
            {risk !== 'high' && (
              <button
                onClick={onContinue}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ดำเนินการต่อ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DuplicateWarningModal;
