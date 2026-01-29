import React from 'react';
import { wp } from '@/lib/wp';

export default async function NewsPage() {
  const res = await wp.get('/posts', { params: { per_page: 5 } });
  const posts = res.data;
  return (
    <main>
      <h1>News</h1>
      <pre>{JSON.stringify(posts.map(p => ({id: p.id, title: p.title.rendered})), null, 2)}</pre>
    </main>
  );
}
