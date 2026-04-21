import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, CheckCircle, Loader2, ImagePlus, ArrowLeft } from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setErrorMsg('請選擇圖片檔案！');
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setErrorMsg('');
      setIsSuccess(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          // 設定最大長寬，因為 Firestore 文件限制為 1MB
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // 壓縮成 JPEG，品質 0.7 以確保小於 1MB 限制
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setErrorMsg('');

    try {
      console.log('Step 1: Compressing Image...');
      const base64String = await compressImage(file);
      
      console.log('Step 2: Saving encoded string directly to Firestore...');
      await addDoc(collection(db, 'uploads'), {
        imageUrl: base64String,
        imagePath: 'base64_direct', // 保留此欄位以符合你之前的 Firestore 檢查規則
        note: note.trim() || null, // 若無文字則存為 null
        uploadedAt: serverTimestamp()
      });

      console.log('Step 3: Success!');
      setIsSuccess(true);
      setFile(null);
      setPreview(null);
      setNote('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload Error Detailed:', error);
      
      if (error?.code === 'permission-denied') {
        setErrorMsg('資料庫權限不足。請檢查 Firestore 的 Rules 設定。');
      } else {
        setErrorMsg(error.message || '發生未知錯誤，這可能是由於圖片壓縮後仍然過大(>1MB)。請嘗試上傳較小的圖片。');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} className="mr-1" />
          返回首頁
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-10 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-3 mb-2">
            <UploadCloud className="text-blue-500" size={28} />
            <h1 className="text-2xl font-bold text-gray-900">匿名上傳</h1>
          </div>
          <p className="text-gray-500">上傳圖片給管理者，檔案會被安全儲存且不會顯示您的身分。</p>
        </div>

        <div className="p-6 sm:p-10 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
              {errorMsg}
            </div>
          )}
          
          {isSuccess && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center space-x-2">
              <CheckCircle size={20} />
              <span>上傳成功！管理者已能檢視此圖片。</span>
            </div>
          )}

          <div 
            onClick={() => !preview && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl relative overflow-hidden transition-all duration-200
              ${preview ? 'border-gray-300' : 'border-gray-300 hover:border-blue-400 cursor-pointer bg-gray-50'}
            `}
          >
            {preview ? (
              <div className="relative aspect-auto max-h-[400px]">
                <img src={preview} alt="Preview" className="w-full h-full object-contain bg-gray-900/5" referrerPolicy="no-referrer" />
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button 
                    onClick={() => {
                      setPreview(null);
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="bg-gray-900/70 hover:bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
                  >
                    重新選擇
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <ImagePlus size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium mb-1">點擊以選擇圖片</p>
                <p className="text-gray-400 text-sm">支援 JPG, PNG, GIF 等常見格式</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              備註文字 (選填)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="有什麼想對管理者說的嗎？可以留在這裡..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors resize-none h-24"
              disabled={isUploading}
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-200
              ${!file ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                     : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg focus:ring-4 focus:ring-blue-500/30'}`}
          >
            {isUploading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>上傳中...</span>
              </>
            ) : (
              <span>確認上傳</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
