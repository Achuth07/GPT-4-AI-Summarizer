import React, { useState } from 'react';
import { useUploadArticleMutation } from '../services/backendApi';
import { loader } from '../assets';

const PdfUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadArticle, { isLoading, error }] = useUploadArticleMutation();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await uploadArticle(formData).unwrap();
      alert('PDF uploaded successfully! Processing started.');
      setSelectedFile(null);
      // Clear file input
      document.getElementById('pdf-file').value = '';
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <section className='mt-8 w-full max-w-xl mx-auto'>
      <div className='flex flex-col w-full gap-4'>
        <form onSubmit={handleUpload} className='flex flex-col gap-4'>
          <div className='flex items-center justify-center w-full'>
            <label
              htmlFor='pdf-file'
              className='flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100'
            >
              <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                <svg
                  className='w-8 h-8 mb-4 text-gray-500'
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
                <p className='text-xs text-gray-500'>PDF only</p>
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

          {selectedFile && (
            <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
              <span className='text-sm text-blue-800 truncate'>
                {selectedFile.name}
              </span>
              <button
                type='button'
                onClick={() => setSelectedFile(null)}
                className='text-red-500 hover:text-red-700'
              >
                Remove
              </button>
            </div>
          )}

          <button
            type='submit'
            disabled={!selectedFile || isLoading}
            className='submit_btn disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? (
              <div className='flex items-center gap-2'>
                <img src={loader} alt='loader' className='w-5 h-5' />
                Uploading...
              </div>
            ) : (
              'Upload & Process PDF'
            )}
          </button>
        </form>

        {error && (
          <div className='p-3 bg-red-50 rounded-lg'>
            <p className='text-red-800 text-sm'>
              Error: {error.data?.message || 'Upload failed'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PdfUpload;