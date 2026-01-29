'use client';
import React from 'react';
import ProductCard from './ProductCard';
import { useProducts } from '../hooks/useProducts';

interface RelatedProductsProps {
  tagId?: number;
  categoryId?: number;
  excludeProductId?: number;
  limit?: number;
}

export default function RelatedProducts({ 
  tagId, 
  categoryId, 
  excludeProductId,
  limit = 4 
}: RelatedProductsProps) {
  const params: any = {};
  if (tagId) params.tag = tagId;
  if (categoryId) params.category = categoryId;
  
  const { data: products, isLoading } = useProducts(params);

  // Фильтруем товары, исключая текущий товар
  const filteredProducts = React.useMemo(() => {
    if (!products) return [];
    let filtered = products;
    
    // Дополнительная фильтрация по тегам на клиенте
    if (tagId) {
      filtered = filtered.filter((product: any) => {
        return product.tags && product.tags.some((tag: any) => tag.id === tagId);
      });
    }
    
    // Дополнительная фильтрация по категориям на клиенте
    if (categoryId) {
      filtered = filtered.filter((product: any) => {
        return product.categories && product.categories.some((cat: any) => cat.id === categoryId);
      });
    }
    
    // Исключаем текущий товар
    if (excludeProductId) {
      filtered = filtered.filter((product: any) => product.id !== excludeProductId);
    }
    
    // Ограничиваем количество
    return filtered.slice(0, limit);
  }, [products, tagId, categoryId, excludeProductId, limit]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold">Схожі товари</h2>
        <div>Завантаження...</div>
      </div>
    );
  }

  if (!filteredProducts || filteredProducts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl font-bold">Схожі товари</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredProducts.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

