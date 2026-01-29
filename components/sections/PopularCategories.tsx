'use client'

import React, { useState, useEffect } from 'react'

const PopularCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Замените YOUR_DOMAIN на ваш WordPress домен
        const response = await fetch(
          'https://YOUR_DOMAIN/wp-json/wp/v2/categories?parent=39&per_page=100'
        )
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) return <div>Завантаження...</div>

  return (
    <section className='max-w-[1920px] w-full mx-auto px-10 sm:px-6 lg:px-[144px]'>
      <h2 className='text-[55px] font-bold uppercase text-black py-14'>Популярні категорії</h2>
      
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {categories.map((category) => (
          <div key={category.id} className='p-4 border rounded hover:shadow-lg transition'>
            <h3 className='font-semibold text-lg'>{category.name}</h3>
          </div>
        ))}
      </div>
    </section>
  )
}

export default PopularCategories