export default function ProductLoading() {
  return (
    <div className="max-w-[1920px] w-full mx-auto site-padding-x py-6 md:py-8 pt-20 md:pt-24 mt-12 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-8">
        <div className="aspect-square bg-gray-100 rounded-2xl" />
        <div className="flex flex-col gap-5">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-12 bg-gray-200 rounded w-full" />
          <div className="h-12 bg-gray-200 rounded w-full" />
        </div>
      </div>
    </div>
  );
}
