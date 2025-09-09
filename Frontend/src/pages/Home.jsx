import React, { useState } from 'react';
import Hero from '../components/Hero';
import Demo from '../components/Demo';
import PdfUpload from '../components/PdfUpload';
import ArticleList from '../components/ArticleList';

const Home = () => {
  const [activeTab, setActiveTab] = useState('summarize');

  const tabs = [
    { id: 'summarize', label: 'Summarize URL' },
    { id: 'upload', label: 'Upload PDF' },
    { id: 'browse', label: 'Browse Articles' },
  ];

  return (
    <div className="w-full">
      <Hero />
      
      {/* Tab Navigation */}
      <div className="flex justify-center mt-8">
        <div className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'bg-white text-blue-700'
                  : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
              } rounded-lg py-2 px-4 text-sm font-medium transition-all`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'summarize' && <Demo />}
        {activeTab === 'upload' && <PdfUpload />}
        {activeTab === 'browse' && <ArticleList />}
      </div>
    </div>
  );
};

export default Home;