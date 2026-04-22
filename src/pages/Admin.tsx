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
import { Lock, LogOut, Loader2, Image as ImageIcon, ArrowLeft, X, BookOpen, UploadCloud, CheckCircle } from 'lucide-react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

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
  const [activeTab, setActiveTab] = useState<'uploads' | 'exams'>('uploads');
  const [fetchError, setFetchError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(false);
  const [examFile, setExamFile] = useState<File | null>(null);
  const [examPreview, setExamPreview] = useState<string | null>(null);
  const [examNote, setExamNote] = useState('');
  const [isUploadingExam, setIsUploadingExam] = useState(false);
  const [examUploadMsg, setExamUploadMsg] = useState({ type: '', text: '' });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
          const MAX_WIDTH = 1200; // 考題可能需要高一點的解析度
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleExamUpload = async () => {
    if (!examFile) return;
    setIsUploadingExam(true);
    setExamUploadMsg({ type: '', text: '' });

    try {
      const base64String = await compressImage(examFile);
      await addDoc(collection(db, 'exams'), {
        imageUrl: base64String,
        note: examNote.trim() || null,
        uploadedAt: serverTimestamp()
      });
      setExamUploadMsg({ type: 'success', text: '考試題目上傳成功！已同步至首頁。' });
      setExamFile(null);
      setExamPreview(null);
      setExamNote('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error(error);
      setExamUploadMsg({ type: 'error', text: '上傳失敗，請確認資料庫權限或圖片大小。' });
    } finally {
      setIsUploadingExam(false);
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
      <div className="flex justify-between items-center mb-6">
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

      <div className="flex space-x-2 mb-6 border-b border-gray-200 pb-px">
        <button
          onClick={() => { setActiveTab('uploads'); fetchUploads(); }}
          className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'uploads' 
              ? 'border-purple-600 text-purple-700 bg-purple-50 rounded-t-xl' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-xl'
          }`}
        >
          <ImageIcon size={18} />
          <span>訪客上傳照片</span>
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'exams' 
              ? 'border-amber-500 text-amber-700 bg-amber-50 rounded-t-xl' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-xl'
          }`}
        >
          <BookOpen size={18} />
          <span>發布考試題目</span>
        </button>
      </div>

      {activeTab === 'uploads' ? (
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
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 sm:p-10 max-w-2xl mx-auto">
          <div className="mb-6 flex items-center space-x-3">
            <BookOpen className="text-amber-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">上傳考試題目</h2>
          </div>
          <p className="text-gray-500 mb-8">在此上傳的圖片會顯示在首頁的「考試題目區」，供一般訪客檢視，且具有基本的防下載保護措施。</p>
          
          <div className="space-y-6">
            {examUploadMsg.text && (
              <div className={`p-4 rounded-lg text-sm font-medium flex items-center space-x-2 ${examUploadMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {examUploadMsg.type === 'success' ? <CheckCircle size={20} /> : null}
                <span>{examUploadMsg.text}</span>
              </div>
            )}

            <div 
              onClick={() => !examPreview && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl relative overflow-hidden transition-all duration-200 ${examPreview ? 'border-gray-300' : 'border-gray-300 hover:border-amber-400 cursor-pointer bg-gray-50'}`}
            >
              {examPreview ? (
                <div className="relative aspect-auto max-h-[400px]">
                  <img src={examPreview} alt="Preview" className="w-full h-full object-contain bg-gray-900/5" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setExamPreview(null); setExamFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="absolute top-2 right-2 bg-gray-900/70 hover:bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
                  >
                    選擇其他圖片
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <UploadCloud size={48} className="text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium mb-1">點擊以選擇題目圖片</p>
                </div>
              )}
              <input 
                type="file" accept="image/*" className="hidden" ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setExamFile(file); setExamPreview(URL.createObjectURL(file)); setExamUploadMsg({ type: '', text: '' }); }
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">題目備註或說明 (選填)</label>
              <textarea
                value={examNote}
                onChange={(e) => setExamNote(e.target.value)}
                placeholder="例如：第一單元小考、這題必考..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-colors resize-none h-24"
                disabled={isUploadingExam}
              />
            </div>

            <button
              onClick={handleExamUpload}
              disabled={!examFile || isUploadingExam}
              className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-200 ${!examFile ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'}`}
            >
              {isUploadingExam ? <><Loader2 size={20} className="animate-spin" /><span>上傳中...</span></> : <span>發布題目</span>}
            </button>
          </div>
        </div>
      )}

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
