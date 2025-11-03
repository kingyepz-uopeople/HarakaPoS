import { getCurrentUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";

/**
 * Driver Dashboard Layout
 * Protected layout for driver users only
 */
export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Redirect if not authenticated
  if (!user) {
    redirect("/login");
  }

  // Redirect if not driver
  if (user.role !== "driver") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
