"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { ShieldCheck, UserPlus, CreditCard, Sparkles } from "lucide-react";

export default function RegisterPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("สร้างบัญชีสำเร็จ!");
        router.push("/login");
      } else {
        toast.error(data.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side: Brand & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.1" />
          </svg>
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-12 w-fit">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md border border-white/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">Flash Tool <span className="text-blue-200">Pro</span></span>
          </Link>
          
          <h1 className="text-4xl font-extrabold leading-tight mb-6">
            เริ่มต้นใช้งาน <br />
            <span className="text-blue-100 text-5xl font-bold">ระบบซ่อมมือถือออนไลน์</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-md">
            สมัครสมาชิกวันนี้ รับฟรี <span className="text-white font-bold bg-white/20 px-2 py-0.5 rounded-lg border border-white/30">100 Credits</span> เพื่อทดลองใช้งานเครื่องมือพื้นฐานในระบบ
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10">
            <div className="bg-blue-400/20 p-2 rounded-lg text-blue-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Easy Access</p>
              <p className="text-sm text-blue-100">สมัครแล้วเริ่มใช้งานได้ทันที</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10">
            <div className="bg-blue-400/20 p-2 rounded-lg text-blue-200">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Credit System</p>
              <p className="text-sm text-blue-100">ระบบเติมเครดิตที่จัดการง่ายและโปร่งใส</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-blue-200 uppercase tracking-widest font-bold">
          Trusted by professionals
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-gray-900">สร้างบัญชีใหม่</h2>
            <p className="text-gray-500">สมัครสมาชิกเพื่อเข้าถึงเครื่องมือซ่อมแซมซอฟต์แวร์</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ-นามสกุล</Label>
              <Input
                id="name"
                placeholder="ชื่อของคุณ"
                required
                className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:bg-white transition-all px-4"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.com"
                required
                className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:bg-white transition-all px-4"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                placeholder="ระบุรหัสผ่าน 6 ตัวอักษรขึ้นไป"
                required
                className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:bg-white transition-all px-4"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 transition-all flex gap-2 cursor-pointer mt-4" disabled={loading}>
              <UserPlus className="w-5 h-5" />
              {loading ? "กำลังสร้างบัญชี..." : "สร้างบัญชีผู้ใช้"}
            </Button>
          </form>

          <div className="pt-8 text-center border-t border-gray-100">
            <p className="text-sm text-gray-500">
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/login" className="font-bold text-blue-600 hover:underline transition-all">
                เข้าสู่ระบบที่นี่
              </Link>
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-6 border-t border-gray-50">
             <div className="flex items-center gap-2 grayscale opacity-40">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold tracking-widest uppercase">Secure Connection</span>
             </div>
             <div className="h-4 w-px bg-gray-200" />
             <a href="https://github.com/Homiez09" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-400 hover:text-blue-600">@Homiez09</a>
          </div>
        </div>
      </div>
    </div>
  );
}
