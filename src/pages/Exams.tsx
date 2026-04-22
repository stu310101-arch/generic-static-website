import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ExamItem {
  id: string;
  imageUrl: string;
  note?: string | null;
  uploadedAt: Date | null;
}

export default function Exams() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const q = query(collection(db, 'exams'), orderBy('uploadedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const items: ExamItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            imageUrl: data.imageUrl,
            note: data.note,
            uploadedAt: data.uploadedAt?.toDate() || null
          });
        });
        setExams(items);
      } catch (err: any) {
        console.error(err);
        if (err?.code === 'permission-denied') {
          setError('目前沒有權限讀取題目。請聯絡管理員更新資料庫規則。');
        } else {
          setError(err.message || '無法取得考試題目。');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} className="mr-1" />
          返回首頁
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-amber-50 text-amber-600 p-3 rounded-full">
          <BookOpen size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">考試題目區</h1>
          <p className="text-gray-500 mt-1">此處的圖片受到防拷貝保護 (禁止右鍵下載即可防君子)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        {error ? (
          <div className="p-8">
            <div className="bg-red-50 text-red-700 p-4 rounded-xl font-medium">
              {error}
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="animate-spin mb-4 text-amber-500" size={36} />
            <p>載入考試題目中...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <BookOpen size={64} className="mb-4 opacity-30" />
            <p className="text-lg">目前沒有任何考試題目。</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {exams.map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button 
                  onClick={() => setSelectedImage(item.imageUrl)}
                  className="block w-full aspect-square bg-gray-50 overflow-hidden relative group cursor-pointer border-0 p-0 text-left"
                >
                  <img 
                    src={item.imageUrl} 
                    alt="Exam" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white font-medium drop-shadow-md transition-opacity">點擊放大查看</span>
                  </div>
                </button>
                <div className="p-3 bg-white text-xs text-gray-500 border-b border-gray-100 flex justify-between items-center">
                  <span>發布時間</span>
                  <span>{item.uploadedAt ? item.uploadedAt.toLocaleString() : '未知'}</span>
                </div>
                {item.note && (
                  <div 
                    className="p-3 bg-amber-50/50 text-sm text-gray-800 min-h-[60px] max-h-[100px] overflow-y-auto w-full break-words select-none"
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {item.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center select-none">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-gray-800 hover:bg-black p-2 rounded-full transition-colors"
              title="關閉"
            >
              <X size={24} />
            </button>
            <img 
              src={selectedImage} 
              alt="Enlarged view" 
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain bg-black/50 pointer-events-none"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
