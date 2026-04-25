import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginPageClient from "./login-client";

export const metadata = {
  title: "Login - Flash Tool Pro",
  description: "เข้าสู่ระบบเพื่อใช้งานเครื่องมือซ่อมมือถือออนไลน์",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return <LoginPageClient />;
}
