
import React, { useState } from 'react';
import { ImageEditor } from './components/ImageEditor';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { VideoGenerator } from './components/VideoGenerator';
import { FilmIcon, PhotoIcon, VideoCameraIcon, SparklesIcon } from './components/Icons';

type Tab = 'edit' | 'analyze' | 'generate';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('edit');

  const renderContent = () => {
    switch (activeTab) {
      case 'edit':
        return <ImageEditor />;
      case 'analyze':
        return <VideoAnalyzer />;
      case 'generate':
        return <VideoGenerator />;
      default:
        return null;
    }
  };

  const getTabClass = (tab: Tab) => {
    return `flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg transition-all duration-300 ${
      activeTab === tab 
      ? 'bg-blue-600 text-white shadow-lg' 
      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
    }`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-600 mb-2 flex items-center justify-center gap-3">
            <SparklesIcon className="w-10 h-10" />
            Gemini Multimedia Suite
          </h1>
          <p className="text-lg text-gray-400">
            Create, Edit, and Analyze with the power of Google's Gemini AI
          </p>
        </header>

        <nav className="mb-8 p-2 bg-gray-800/50 backdrop-blur-sm rounded-xl grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto">
          <button onClick={() => setActiveTab('edit')} className={getTabClass('edit')}>
            <PhotoIcon className="w-6 h-6" />
            <span className="hidden sm:inline">Image Editor</span>
          </button>
          <button onClick={() => setActiveTab('analyze')} className={getTabClass('analyze')}>
            <FilmIcon className="w-6 h-6" />
            <span className="hidden sm:inline">Video Analyzer</span>
          </button>
          <button onClick={() => setActiveTab('generate')} className={getTabClass('generate')}>
            <VideoCameraIcon className="w-6 h-6" />
            <span className="hidden sm:inline">Video Generator</span>
          </button>
        </nav>

        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
