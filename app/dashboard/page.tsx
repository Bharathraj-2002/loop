import { getServerSession } from "next-auth";

export default async function DashboardPage() {
  const session = await getServerSession();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to LOOP Dashboard</h1>
      <p className="mt-2 text-gray-600">
        You are logged in as: {session?.user?.email}
      </p>
    </div>
  );
}