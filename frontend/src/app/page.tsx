type ApiResponse = {
  message: string;
};

export default async function Home() {
  const API_URL = process.env.API_URL;

  try {
    if (!API_URL) {
      throw new Error("API_URL is not set");
    }

    const response = await fetch(API_URL, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const data: ApiResponse = await response.json();

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="p-6 max-w-md bg-white rounded-lg shadow-md text-black">
          <h1 className="text-2xl font-bold mb-4">Server Component Data</h1>
          <p className="mb-2">{data.message}</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching data:", error);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-black p-6 max-w-md bg-white rounded-lg shadow-md border-l-4 border-red-500">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Error</h1>
          <p>Failed to load data from API. Please try again later.</p>
        </div>
      </div>
    );
  }
}
