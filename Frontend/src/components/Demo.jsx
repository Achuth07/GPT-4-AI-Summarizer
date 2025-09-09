import React, { useState, useEffect } from "react";

import { copy, linkIcon, loader, tick } from "../assets";
import { useSummarizeUrlMutation } from "../services/backendApi";

const Demo = () => {
  const [article, setArticle] = useState({
    url: "",
    summary: null,
  });
  const [allArticles, setAllArticles] = useState([]);
  const [copied, setCopied] = useState("");

  // Using the backend instead of RapidAPI
  const [summarizeUrl, { error, isLoading }] = useSummarizeUrlMutation();

  // Load data from localStorage on mount
  useEffect(() => {
    const articlesFromLocalStorage = JSON.parse(
      localStorage.getItem("articles")
    );

    if (articlesFromLocalStorage) {
      setAllArticles(articlesFromLocalStorage);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const existingArticle = allArticles.find(
      (item) => item.url === article.url
    );

    if (existingArticle) return setArticle(existingArticle);

    try {
      const { data } = await summarizeUrl(article.url);
      if (data?.article) {
        const newArticle = { 
          url: article.url, 
          summary: data.article.summary 
        };
        const updatedAllArticles = [newArticle, ...allArticles];

        setArticle(newArticle);
        setAllArticles(updatedAllArticles);
        localStorage.setItem("articles", JSON.stringify(updatedAllArticles));
      }
    } catch (err) {
      console.error("Summarization error:", err);
    }
  };

  // copy the url and toggle the icon for user feedback
  const handleCopy = (copyUrl) => {
    setCopied(copyUrl);
    navigator.clipboard.writeText(copyUrl);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleKeyDown = (e) => {
    if (e.keyCode === 13) {
      handleSubmit(e);
    }
  };

  // Helper function to render the structured summary
  const renderSummary = (summary) => {
    if (!summary) return null;
    
    return (
      <div className='flex flex-col gap-4'>
        <h2 className='font-satoshi font-bold text-gray-600 text-xl'>
          Article <span className='blue_gradient'>Summary</span>
        </h2>
        
        {summary.abstract && (
          <div className="summary-section">
            <h3 className="font-semibold text-gray-800 mb-2">Abstract</h3>
            <p className='font-inter font-medium text-sm text-gray-700'>
              {summary.abstract}
            </p>
          </div>
        )}
        
        {summary.methodology && (
          <div className="summary-section">
            <h3 className="font-semibold text-gray-800 mb-2">Methodology</h3>
            <p className='font-inter font-medium text-sm text-gray-700'>
              {summary.methodology}
            </p>
          </div>
        )}
        
        {summary.keyFindings && (
          <div className="summary-section">
            <h3 className="font-semibold text-gray-800 mb-2">Key Findings</h3>
            <p className='font-inter font-medium text-sm text-gray-700'>
              {summary.keyFindings}
            </p>
          </div>
        )}
        
        {summary.proposedWayForward && (
          <div className="summary-section">
            <h3 className="font-semibold text-gray-800 mb-2">Proposed Way Forward</h3>
            <p className='font-inter font-medium text-sm text-gray-700'>
              {summary.proposedWayForward}
            </p>
          </div>
        )}
        
        {summary.additionalInsights && (
          <div className="summary-section">
            <h3 className="font-semibold text-gray-800 mb-2">Additional Insights</h3>
            <p className='font-inter font-medium text-sm text-gray-700'>
              {summary.additionalInsights}
            </p>
          </div>
        )}
        
        {summary.overallSummary && (
          <div className="summary-section">
            <h3 className="font-semibold text-gray-800 mb-2">Overall Summary</h3>
            <p className='font-inter font-medium text-sm text-gray-700'>
              {summary.overallSummary}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className='mt-16 w-full max-w-xl mx-auto'>
      {/* Search */}
      <div className='flex flex-col w-full gap-2'>
        <form
          className='relative flex justify-center items-center'
          onSubmit={handleSubmit}
        >
          <img
            src={linkIcon}
            alt='link-icon'
            className='absolute left-3 my-2 w-5 z-10'
          />

          <input
            type='url'
            placeholder='Paste the article link'
            value={article.url}
            onChange={(e) => setArticle({ ...article, url: e.target.value })}
            onKeyDown={handleKeyDown}
            required
            className='url_input peer pl-10'
          />
          <button
            type='submit'
            disabled={isLoading}
            className='submit_btn peer-focus:border-gray-700 peer-focus:text-gray-700 disabled:opacity-50'
          >
            <p>↵</p>
          </button>
        </form>

        {/* Browse History */}
        <div className='flex flex-col gap-1 max-h-60 overflow-y-auto'>
          {allArticles.reverse().map((item, index) => (
            <div
              key={`link-${index}`}
              onClick={() => setArticle(item)}
              className='link_card'
            >
              <div className='copy_btn' onClick={() => handleCopy(item.url)}>
                <img
                  src={copied === item.url ? tick : copy}
                  alt={copied === item.url ? "tick_icon" : "copy_icon"}
                  className='w-[40%] h-[40%] object-contain'
                />
              </div>
              <p className='flex-1 font-satoshi text-blue-700 font-medium text-sm truncate'>
                {item.url}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Display Result */}
      <div className='my-10 max-w-full flex justify-center items-center'>
        {isLoading ? (
          <img src={loader} alt='loader' className='w-20 h-20 object-contain' />
        ) : error ? (
          <div className='text-center'>
            <p className='font-inter font-bold text-black'>
              Well, that wasn't supposed to happen...
            </p>
            <p className='font-satoshi font-normal text-gray-700 mt-2'>
              {error?.data?.error || error?.error || 'Unknown error occurred'}
            </p>
            {/* Some debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <details className='mt-4 text-xs text-gray-500'>
                <summary className='cursor-pointer'>Technical details</summary>
                <pre className='mt-2 p-2 bg-gray-100 rounded overflow-auto'>
                  {JSON.stringify(error, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ) : (
          article.summary && renderSummary(article.summary)
        )}
      </div>
    </section>
  );
};

export default Demo;