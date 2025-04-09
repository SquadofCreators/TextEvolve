import React from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import DesignedBy from '../components/DesignedBy'

function MainLayout({ children }) {
  return (
    <div className='flex flex-row h-screen w-screen bg-white dark:bg-gray-900'>
        <Sidebar />
        <div className='relative w-full flex flex-col h-screen overflow-y-hidden'>
            <Navbar />
            <div className='flex-1 overflow-y-auto md:p-4 mb-6'>
                {children}
            </div>
            {/* Designed by */}
            <DesignedBy />
        </div>
    </div>
  )
}

export default MainLayout