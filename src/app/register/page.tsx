import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import RegisterPageClient from "./register-client";

export const metadata = {
  title: "Register - Flash Tool Pro",
  description: "สมัครสมาชิกเพื่อเริ่มต้นใช้งานเครื่องมือซ่อมมือถือออนไลน์",
};

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return <RegisterPageClient />;
}
