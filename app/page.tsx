export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900">
      <div className="flex flex-col items-center">
        {/* Spinning record */}
        <div className="mb-8">
          <img
            src="/record.png"
            alt="Spinning Record"
            className="h-32 w-32 animate-spin"
            style={{ animationDuration: "2s" }}
          />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Site Under Maintenance</h1>
        <p className="text-lg text-blue-100">
          The Man Behind The Music platform is temporarily offline for updates.<br />
          Please check back soon.
        </p>
      </div>
    </div>
  )
}