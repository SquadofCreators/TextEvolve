import React from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

function MainLayout({ children }) {
  return (
    <div className='flex flex-row h-screen w-screen bg-white dark:bg-gray-900'>
        <Sidebar />
        <div className='w-full flex flex-col h-screen overflow-y-hidden'>
            <Navbar />
            <div className='flex-1 overflow-y-auto p-6'>
                {children}
            </div>
        </div>
    </div>
  )
}

export default MainLayout