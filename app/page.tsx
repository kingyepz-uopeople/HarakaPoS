import { redirect } from "next/navigation";

/**
 * Root page - redirects to login
 * Users will be redirected based on their role after authentication
 */
export default function Home() {
  redirect("/login");
}
