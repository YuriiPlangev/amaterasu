import React from 'react'

export const CardSkeleton = () => {
  return (
    <article className="rounded-2xl overflow-hidden animate-pulse bg-white shadow-sm">
      <div className="w-full h-[250px] bg-gray-200 dark:bg-gray-700 rounded-t-2xl" />
      <div className="p-6 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-2xl">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      </div>
    </article>
  )
}

export const SquareSkeleton = () => {
  return (
    <article className="rounded-2xl border border-[#9C0000] overflow-hidden animate-pulse bg-white">
      <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700" />
      <div className="bg-gray-200 dark:bg-gray-700 py-2" />
    </article>
  )
}

export const ProductSkeleton = () => {
  return (
    <article className="rounded-2xl overflow-hidden animate-pulse bg-white shadow-sm">
      <div className="w-full h-[320px] bg-gray-200 dark:bg-gray-700 rounded-t-2xl" />
      <div className="p-4 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-2xl">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-2/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2" />
      </div>
    </article>
  )
}
