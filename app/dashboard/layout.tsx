import { getCurrentUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

/**
 * Admin Dashboard Layout
 * Protected layout for admin users only
 * Features collapsible sidebar for better space management
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Redirect if not authenticated
  if (!user) {
    redirect("/login");
  }

  // Redirect if not admin
  if (user.role !== "admin") {
    redirect("/driver");
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
