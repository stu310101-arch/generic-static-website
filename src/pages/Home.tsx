import { Link } from 'react-router-dom';
import { UploadCloud, ShieldCheck, BookOpen, Trophy } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">歡迎來到匿名圖片上傳系統</h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          你可以選擇以訪客身分匿名上傳圖片，或是以管理員身分登入檢視所有上傳的照片。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        <Link 
          to="/exams"
          className="group relative flex flex-col items-center justify-center p-8 bg-white border-2 border-green-100 rounded-2xl hover:border-green-400 hover:shadow-lg transition-all duration-200"
        >
          <div className="bg-green-50 text-green-500 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <BookOpen size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">考試題目</h2>
          <p className="text-center text-gray-500 text-sm">檢視管理員派發的考題</p>
        </Link>

        <Link 
          to="/upload"
          className="group relative flex flex-col items-center justify-center p-8 bg-white border-2 border-blue-100 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all duration-200"
        >
          <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">訪客上傳</h2>
          <p className="text-center text-gray-500 text-sm">無須登入即可上傳圖片給管理員</p>
        </Link>

        <Link 
          to="/admin"
          className="group relative flex flex-col items-center justify-center p-8 bg-white border-2 border-purple-100 rounded-2xl hover:border-purple-500 hover:shadow-lg transition-all duration-200"
        >
          <div className="bg-purple-50 text-purple-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">管理員登入</h2>
          <p className="text-center text-gray-500 text-sm">登入檢視所有訪客上傳的照片</p>
        </Link>

        <Link 
          to="/scores"
          className="group relative flex flex-col items-center justify-center p-8 bg-white border-2 border-yellow-100 rounded-2xl hover:border-yellow-400 hover:shadow-lg transition-all duration-200"
        >
          <div className="bg-yellow-50 text-yellow-500 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <Trophy size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">成績展示區</h2>
          <p className="text-center text-gray-500 text-sm">查看優良評分紀錄</p>
        </Link>
      </div>
    </div>
  );
}
