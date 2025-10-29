export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-umblue/5 p-8">
        <h1 className="text-3xl font-semibold text-umblue">UM Lost & Found</h1>
        <p className="mt-2 max-w-2xl text-gray-700">
          A modern platform to report, discover, and claim lost or found items across University
          Malaya. Sign in with your UM email to get started.
        </p>
      </section>      

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-medium text-gray-900">Post an Item</h3>
          <p className="mt-1 text-sm text-gray-600">Describe and upload images of lost or found items.</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-medium text-gray-900">Browse Lost</h3>
          <p className="mt-1 text-sm text-gray-600">See what others have reported missing.</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-medium text-gray-900">Browse Found</h3>
          <p className="mt-1 text-sm text-gray-600">Check items that have been found on campus.</p>
        </div>
      </section>
    </div>
  );
}

