import { Loader2 } from "lucide-react"

export default function SubmissionsLoading() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-40 bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 w-12 bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-8 w-8 bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-8 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 h-10 bg-gray-700 rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="w-40 h-10 bg-gray-700 rounded animate-pulse"></div>
              <div className="w-40 h-10 bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Submissions List Skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-6 w-48 bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-4 w-32 bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-5 w-16 bg-gray-700 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="h-16 bg-gray-700 rounded animate-pulse mb-4"></div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-8 w-32 bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Indicator */}
        <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-xl">Loading your submissions...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
