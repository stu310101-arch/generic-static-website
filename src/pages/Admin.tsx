import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Lock, LogOut, Loader2, Image as ImageIcon, ArrowLeft, X } from 'lucide-react';

interface UploadItem {
  id: string;
  imageUrl: string;
  note?: string | null;
  uploadedAt: Date | null;
}

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUploads();
    }
  }, [user]);

  const fetchUploads = async () => {
    setIsLoadingUploads(true);
    setFetchError('');
    try {
      // Create a query against the collection
      const q = query(collection(db, 'uploads'), orderBy('uploadedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const items: UploadItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          imageUrl: data.imageUrl,
          note: data.note,
          uploadedAt: data.uploadedAt?.toDate() || null
        });
      });
      setUploads(items);
    } catch (error: any) {
      console.error('Fetch error:', error);
      setFetchError(error.message || '無法取得資料，請確認您是否有管理員權限，或 Firebase 權限設定是否正確。');
    } finally {
      setIsLoadingUploads(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setLoginError('密碼錯誤或帳號不存在。');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={16} className="mr-1" />
            返回首頁
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Lock className="text-purple-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">管理員登入</h1>
            <p className="text-gray-500 text-sm">請輸入管理員帳號密碼以檢視所有上傳內容</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn || !email || !password}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex justify-center items-center"
            >
              {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : '登入'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} className="mr-1" />
          返回首頁
        </Link>
      </div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Lock className="text-purple-600" />
            後台管理面板
          </h1>
          <p className="text-gray-500 mt-2">目前登入身分：{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium text-sm"
        >
          <LogOut size={16} />
          <span>登出</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        {fetchError ? (
          <div className="p-8">
            <div className="bg-red-50 text-red-700 p-4 rounded-xl">
              {fetchError}
            </div>
          </div>
        ) : isLoadingUploads ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mb-4 text-purple-500" size={32} />
            <p>載入圖片中...</p>
          </div>
        ) : uploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ImageIcon size={48} className="mb-4 opacity-50" />
            <p>目前還沒有人上傳圖片。</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {uploads.map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button 
                  onClick={() => setSelectedImage(item.imageUrl)}
                  className="block w-full aspect-square bg-gray-50 overflow-hidden relative group cursor-pointer border-0 p-0 text-left"
                >
                  <img 
                    src={item.imageUrl} 
                    alt="Uploaded" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
                <div className="p-3 bg-white text-xs text-gray-500 border-b border-gray-100 flex justify-between items-center">
                  <span>上傳時間</span>
                  <span>{item.uploadedAt ? item.uploadedAt.toLocaleString() : '未知'}</span>
                </div>
                {item.note && (
                  <div className="p-3 bg-gray-50 text-sm text-gray-700 min-h-[60px] max-h-[100px] overflow-y-auto w-full break-words">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center">
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
              className="max-w-full max-h-[85vh] rounded-lg shadow-xl object-contain bg-black/50"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
