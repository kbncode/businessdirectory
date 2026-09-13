import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage() {
  // An already-authenticated admin landing here (stale bookmark, back
  // button) should never see the login form — send them straight in
  // instead of rendering a confusing half-logged-in page.
  const session = await getAdminSession();
  if (session?.user) redirect("/admin/dashboard");

  return <AdminLoginForm />;
}
