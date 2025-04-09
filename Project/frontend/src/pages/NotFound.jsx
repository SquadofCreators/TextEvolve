import React from 'react'

function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
      <div className='w-5/6 text-center'>
        <span className='text-7xl text-orange-500 font-extrabold'>404</span>
        <h1 className="text-3xl font-bold mb-4">Oops! Page Not Found</h1>
        <p className="text-lg text-gray-500 mb-4">Sorry, the page you are looking for does not exist.</p>
        <a href="/" className="mt-6 text-blue-600 dark:text-blue-400 underline">
          Go to Home
        </a>
      </div>
    </div>
  )
}

export default NotFound