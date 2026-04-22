import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Trophy, X } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ScoredItem {
  id: string;
  imageUrl: string;
  score: number;
  note?: string | null;
  uploadedAt: Date | null;
}

export default function Scores() {
  const [items, setItems] = useState<ScoredItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<ScoredItem | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const q = query(collection(db, 'uploads'), orderBy('uploadedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedItems: ScoredItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // 只擷取『有被評分的』項目
          if (data.score !== undefined && data.score !== null) {
            fetchedItems.push({
              id: doc.id,
              imageUrl: data.imageUrl,
              score: data.score,
              note: data.note,
              uploadedAt: data.uploadedAt?.toDate() || null
            });
          }
        });
        setItems(fetchedItems);
      } catch (err: any) {
        console.error(err);
        if (err?.code === 'permission-denied') {
          setError('目前沒有權限讀取成績。請聯絡管理員更新資料庫規則 (需將 uploads 設為 allow read: if true)。');
        } else {
          setError(err.message || '無法取得成績資料。');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchScores();
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
        <div className="bg-yellow-50 text-yellow-500 p-3 rounded-full">
          <Trophy size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">成績展示區</h1>
          <p className="text-gray-500 mt-1">查看大家上傳並經過評分的優良作答</p>
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
            <Loader2 className="animate-spin mb-4 text-yellow-500" size={36} />
            <p>載入成績中...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Trophy size={64} className="mb-4 opacity-30" />
            <p className="text-lg">目前還沒有任何已經評分的紀錄。</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.id} className="border border-yellow-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col bg-yellow-50/30">
                <button 
                  onClick={() => setSelectedImage(item)}
                  className="block w-full aspect-square overflow-hidden relative group cursor-pointer border-0 p-0 text-left bg-white"
                >
                  <img 
                    src={item.imageUrl} 
                    alt="Scored Answer" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white font-medium drop-shadow-md transition-opacity">點擊看成績</span>
                  </div>
                </button>
                <div className="p-4 flex flex-col items-center justify-center border-t border-yellow-100">
                  <span className="text-xs text-gray-500 mb-1">獲得分數</span>
                  <div className="text-2xl font-black text-amber-600">{item.score} / 20</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-gray-800 hover:bg-black p-2 rounded-full transition-colors z-10"
              title="關閉"
            >
              <X size={24} />
            </button>
            <div 
              className="bg-white p-4 sm:p-6 rounded-2xl shadow-2xl w-full max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 w-full flex-shrink overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center relative">
                <img 
                  src={selectedImage.imageUrl} 
                  alt="Enlarged view" 
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
              <div className="mt-6 flex flex-col items-center w-full px-4">
                <div className="bg-yellow-100 text-yellow-800 px-8 py-3 rounded-2xl border-2 border-yellow-300 flex items-center gap-3">
                  <Trophy size={28} className="text-yellow-600" />
                  <span className="text-3xl font-black">{selectedImage.score} / 20 分</span>
                </div>
                {selectedImage.note && (
                  <p className="mt-4 text-gray-600 text-center max-w-xl bg-gray-50 p-3 rounded-lg border border-gray-200">
                    "{selectedImage.note}"
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
