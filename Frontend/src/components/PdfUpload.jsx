import React, { useState } from 'react';
import { uploadPdf } from '../services/uploadService';
import { loader } from '../assets';

const PdfUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleFile = (file) => {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please select a PDF file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await uploadPdf(selectedFile);
      setSelectedFile(null);
      document.getElementById('pdf-file').value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className='mt-8 w-full max-w-xl mx-auto'>
      <div className='flex flex-col w-full gap-4'>
        <form onSubmit={handleUpload} className='flex flex-col gap-4'>
          {/* Upload Area */}
          <div className='flex items-center justify-center w-full'>
            <label
              htmlFor='pdf-file'
              className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                <svg
                  className='w-12 h-12 mb-4 text-gray-400'
                  aria-hidden='true'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 20 16'
                >
                  <path
                    stroke='currentColor'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2'
                  />
                </svg>
                <p className='mb-2 text-sm text-gray-500'>
                  <span className='font-semibold'>Click to upload</span> or drag and drop
                </p>
                <p className='text-xs text-gray-500'>PDF, MAX. 10MB</p>
              </div>
              <input
                id='pdf-file'
                type='file'
                className='hidden'
                accept='.pdf'
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {/* Selected File Preview - Appears between upload area and button */}
          {selectedFile && (
            <div className='flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-blue-100 rounded-full'>
                  <svg className='w-5 h-5 text-blue-600' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-gray-900 truncate'>
                    {selectedFile.name}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type='button'
                onClick={() => setSelectedFile(null)}
                className='p-1 text-gray-400 hover:text-red-500 transition-colors duration-200'
                aria-label="Remove file"
              >
                <svg className='w-5 h-5' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Upload Button - Professional styling */}
          <button
            type='submit'
            disabled={!selectedFile || isLoading}
            className={`
              relative flex items-center justify-center w-full py-3 px-4 
              text-white font-medium rounded-lg transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isLoading 
                ? 'bg-blue-600 cursor-wait' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md'
              }
            `}
          >
            {isLoading ? (
              <>
                <img src={loader} alt='loader' className='w-5 h-5 mr-2 animate-spin' />
                Processing...
              </>
            ) : (
              <>
                <svg className='w-5 h-5 mr-2' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload & Process PDF
              </>
            )}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-center gap-2 text-red-800'>
              <svg className='w-5 h-5' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className='text-sm font-medium'>{error}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PdfUpload;