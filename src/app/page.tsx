import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, Smartphone, Unlock, CreditCard } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flash Tool Pro - เว็บแอปสำหรับช่างซ่อมมือถือระดับมืออาชีพ",
  description: "เครื่องมือแฟลชรอม ปลดล็อกบุตโหลดเดอร์ และรูทเครื่องผ่านเบราว์เซอร์ด้วยเทคโนโลยี WebUSB รองรับชิปเซ็ต Qualcomm, MediaTek และ Samsung สำหรับช่างเทคนิค",
  keywords: ["Flash ROM", "WebUSB", "Unlock Bootloader", "Android Rooting", "FRP Bypass", "ช่างซ่อมมือถือ", "แฟลชรอม"],
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">Flash Tool <span className="text-blue-600">Pro</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">เข้าสู่ระบบ</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-blue-600 hover:bg-blue-700">เริ่มต้นใช้งาน</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="px-6 py-20 md:py-32 bg-gradient-to-b from-blue-50/30 to-white">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
              Professional Web-Based Utility
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
              เครื่องมือซ่อมแซมมือถือ <br />
              <span className="text-blue-600">ผ่านเว็บบราวเซอร์โดยตรง</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              แพลตฟอร์มสำหรับช่างเทคนิคเพื่อการแฟลช Firmware, ปลดล็อก และจัดการระบบปฏิบัติการ Android 
              ทำงานผ่านโปรโตคอล WebUSB ที่มีความเสถียรและปลอดภัย
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-xl w-full">
                  สมัครสมาชิก
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-xl w-full">
                  แดชบอร์ด
                </Button>
              </Link>
            </div>
            <div className="pt-10 flex flex-wrap items-center justify-center gap-6 md:gap-12 grayscale opacity-40">
              <span className="font-semibold text-xl">Qualcomm</span>
              <span className="font-semibold text-xl">MediaTek</span>
              <span className="font-semibold text-xl">Samsung</span>
              <span className="font-semibold text-xl">Xiaomi</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-6 py-24 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white border rounded-2xl space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold">Stable Flashing</h3>
              <p className="text-gray-500">รองรับการติดตั้ง Firmware ผ่าน WebUSB API ทำงานรวดเร็วและตรวจสอบข้อมูลได้แบบ Real-time</p>
            </div>
            <div className="p-8 bg-white border rounded-2xl space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Unlock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold">Maintenance Tools</h3>
              <p className="text-gray-500">รวมสคริปต์สำหรับการบำรุงรักษา เช่น การปลดล็อก Bootloader และการกู้คืนระบบเบื้องต้น</p>
            </div>
            <div className="p-8 bg-white border rounded-2xl space-y-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold">Billing System</h3>
              <p className="text-gray-500">ระบบเครดิตที่โปร่งใส ตรวจสอบประวัติการใช้งานได้ทุกขั้นตอน เพื่อความสะดวกในการบริหารจัดการ</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 border-t bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-gray-900">Flash Tool Pro</span>
            </div>
            <p className="text-xs text-gray-400">Developed by <a href="https://github.com/Homiez09" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Homiez09</a></p>
          </div>
          <p className="text-sm text-gray-500">© 2026 Flash Tool Pro. For professional use only.</p>
          <div className="flex gap-6 text-sm font-medium text-gray-400">
            <Link href="#" className="hover:text-blue-600 transition-colors">ความเป็นส่วนตัว</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">เงื่อนไขการใช้งาน</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
