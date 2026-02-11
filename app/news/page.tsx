'use client';

import React, { useState, useEffect } from 'react';
import NewsCard from '@/components/NewsCard';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  slug: string;
  image: string;
  badge?: string;
}

export default function NewsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const response = await fetch('/api/news');
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Помилка завантаження новостей:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  if (loading) {
    return (
      <main className='max-w-[1920px] w-full mx-auto site-padding-x py-20'>
        <div className='text-center text-[18px]'>Завантаження новостей...</div>
      </main>
    );
  }

  return (
    <main className='max-w-[1920px] w-full mx-auto site-padding-x py-20 '>
      <h1 className='text-[55px] font-bold uppercase text-black mb-14'>Новини</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {posts.length > 0 ? (
          posts.map((post) => <NewsCard key={post.id} post={post} />)
        ) : (
          <div className='col-span-full text-center text-[18px] text-gray-500'>
            Новостей не знайдено
          </div>
        )}
      </div>
    </main>
  );
}
