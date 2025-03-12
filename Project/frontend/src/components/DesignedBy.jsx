import React from 'react'

export const designedByData = {
    name: 'Dynamic Dreamers',
    link: 'https://squadofcreators.github.io/SquadofCreators/',
}

function DesignedBy() {
  return (
    <div>
        <div className="absolute bottom-0 right-0 w-full mx-auto bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-2 text-center text-xs">
            Designed by <a href={designedByData.link} className="text-orange-500 hover:underline">
                <span className='font-bold'>{designedByData.name}</span>
            </a>
        </div>
    </div>
  )
}

export default DesignedBy