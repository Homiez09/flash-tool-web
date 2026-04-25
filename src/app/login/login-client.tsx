"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { ShieldCheck, Zap, Smartphone, CheckCircle2 } from "lucide-react";

export default function LoginPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (res?.error) {
        toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else {
        toast.success("เข้าสู่ระบบสำเร็จ");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
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
            <path d="M0 0 L100 100 M0 100 L100 0" stroke="currentColor" strokeWidth="0.5" fill="none" />
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
            เครื่องมือสำหรับ <br />
            <span className="text-blue-100 text-5xl">ช่างเทคนิคมือถือ</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-md">
            จัดการงานซ่อมแซมซอฟต์แวร์ด้วยเครื่องมือมาตรฐานที่ทำงานผ่านบราวเซอร์ สะดวก รวดเร็ว และปลอดภัย
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10">
            <div className="bg-blue-400/20 p-2 rounded-lg text-blue-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Standard Flashing</p>
              <p className="text-sm text-blue-100">รองรับโปรโตคอลการเชื่อมต่อสากล</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10">
            <div className="bg-blue-400/20 p-2 rounded-lg text-blue-200">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Automated Scripts</p>
              <p className="text-sm text-blue-100">ช่วยลดขั้นตอนการทำงานที่ซับซ้อน</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-blue-200 uppercase tracking-widest font-bold">
          Professional Grade Software Utility
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-gray-900">เข้าสู่ระบบ</h2>
            <p className="text-gray-500">กรุณากรอกข้อมูลเพื่อเข้าใช้งานแดชบอร์ด</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.com"
                required
                className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Link href="#" className="text-xs font-bold text-blue-600">ลืมรหัสผ่าน?</Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-all"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 transition-all cursor-pointer" disabled={loading}>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>

          <div className="pt-8 text-center border-t border-gray-100">
            <p className="text-sm text-gray-500">
              ยังไม่มีบัญชี?{" "}
              <Link href="/register" className="font-bold text-blue-600 hover:underline">
                สร้างบัญชีใหม่
              </Link>
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-4">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Developer</p>
            <a href="https://github.com/Homiez09" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-400 hover:text-blue-600">@Homiez09</a>
          </div>
        </div>
      </div>
    </div>
  );
}
