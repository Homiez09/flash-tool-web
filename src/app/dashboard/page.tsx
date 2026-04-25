"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { USBConnection } from "@/components/usb-connection";
import { 
  Usb, 
  LogOut, 
  PlusCircle, 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  Settings, 
  History, 
  Download, 
  LayoutDashboard,
  Smartphone,
  Unlock,
  Key,
  HardDrive,
  Search,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const handleTopUp = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 100 }),
      });

      if (res.ok) {
        toast.success("Successfully topped up 100 credits!");
        await update();
      } else {
        toast.error("Failed to top up");
      }
    } catch (error) {
      toast.error("Error topping up");
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: "dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
    { id: "flash", label: "Flash ROM", icon: Zap },
    { id: "oneclick", label: "เครื่องมือด่วน", icon: Smartphone },
    { id: "firmware", label: "ดาวน์โหลดรอม", icon: Download },
    { id: "history", label: "ประวัติการใช้งาน", icon: History },
    { id: "settings", label: "ตั้งค่า", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r sticky top-0 h-screen">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Flash Tool <span className="text-blue-600">Pro</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
                activeTab === item.id 
                  ? "bg-blue-50 text-blue-700 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-blue-600" : "text-gray-400")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t space-y-4">
          <div className="px-2 pb-2">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Developer</p>
            <a 
              href="https://github.com/Homiez09" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-gray-500 hover:text-blue-600 transition-colors font-medium"
            >
              @Homiez09
            </a>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">เครดิตคงเหลือ</span>
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{session?.user?.credits || 0}</div>
            <Button size="sm" variant="outline" className="w-full mt-3 h-8 text-xs gap-1.5 rounded-lg" onClick={handleTopUp} disabled={loading}>
              <PlusCircle className="w-3 h-3" /> เติมเครดิต
            </Button>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={() => signOut()}>
            <LogOut className="w-5 h-5 mr-3" /> ออกจากระบบ
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span className="font-bold">Flash Tool Pro</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut()}>
            <LogOut className="w-5 h-5" />
          </Button>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">ยินดีต้อนรับ, {session?.user?.name || "ช่างซ่อม"}</h1>
                  <p className="text-gray-500">พร้อมสำหรับการซ่อมแซมวันนี้หรือยัง?</p>
                </div>
                <div className="bg-white p-2 rounded-xl shadow-sm border flex items-center gap-2">
                  <div className="px-4 py-2 bg-green-50 rounded-lg border border-green-100">
                    <span className="text-xs text-green-600 font-medium block">สถานะเซิร์ฟเวอร์</span>
                    <span className="text-sm font-bold text-green-700 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> ออนไลน์
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <USBConnection />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setActiveTab("flash")}>
                      <CardHeader className="pb-2">
                        <Zap className="w-8 h-8 text-yellow-500 mb-2 group-hover:scale-110 transition-transform" />
                        <CardTitle>Flash ROM</CardTitle>
                        <CardDescription>ติดตั้ง Firmware ศูนย์หรือรอมโมดิฟายด์</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setActiveTab("oneclick")}>
                      <CardHeader className="pb-2">
                        <Smartphone className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                        <CardTitle>One-Click Tools</CardTitle>
                        <CardDescription>ปลดล็อก, Root, และแก้ปัญหาเบื้องต้น</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">ประวัติล่าสุด</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                      <div className="space-y-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 border-b last:border-0">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Check className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Flash Firmware Success</p>
                              <p className="text-xs text-gray-500">Xiaomi Redmi Note 13 Pro</p>
                            </div>
                            <span className="text-xs text-gray-400">2ชม. ที่แล้ว</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" className="w-full text-xs" onClick={() => setActiveTab("history")}>ดูทั้งหมด</Button>
                    </CardFooter>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">ต้องการความช่วยเหลือ?</CardTitle>
                      <CardDescription className="text-blue-100">มีปัญหาในการใช้งาน หรืออยากสอบถามข้อมูลเพิ่มเติม</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 border-none font-bold">ติดต่อฝ่ายสนับสนุน</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "flash" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Flash ROM Engine</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>เลือกไฟล์ Firmware</CardTitle>
                    <CardDescription>รองรับไฟล์ .zip, .img, .tar, .tgz</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center bg-gray-50">
                      <HardDrive className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-sm text-gray-500 mb-4 text-center font-medium">ลากไฟล์ Firmware มาวางที่นี่ หรือกดเพื่อเลือกจากคอมพิวเตอร์</p>
                      <Button variant="outline" className="rounded-lg">เลือกไฟล์</Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>ความคืบหน้า</span>
                        <span>0%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full w-0 transition-all duration-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                      </div>
                      <div className="p-4 bg-gray-900 rounded-lg font-mono text-xs text-green-400 min-h-32 overflow-y-auto">
                        <p className="opacity-50 italic">// โปรแกรมพร้อมทำงาน รอการเลือกไฟล์...</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 border-t p-6 rounded-b-xl flex justify-between">
                    <div className="text-sm text-gray-500">ค่าธรรมเนียม: <span className="font-bold text-blue-600">5 Credits</span></div>
                    <Button disabled className="gap-2 px-8 font-bold">เริ่มแฟลชรอม</Button>
                  </CardFooter>
                </Card>
                
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">ตั้งค่าการแฟลช</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-gray-500">Chipset</label>
                        <select className="w-full p-2 border rounded-lg text-sm">
                          <option>Auto Detect</option>
                          <option>Qualcomm (EDL)</option>
                          <option>MediaTek (BROM)</option>
                          <option>Samsung (Odin)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-gray-500">โหมดการแฟลช</label>
                        <select className="w-full p-2 border rounded-lg text-sm">
                          <option>Clean All (แนะนำ)</option>
                          <option>Save User Data</option>
                          <option>Clean & Lock</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "oneclick" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">One-Click Maintenance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:border-blue-200 transition-colors">
                  <CardHeader>
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                      <Unlock className="w-6 h-6 text-orange-600" />
                    </div>
                    <CardTitle>Unlock Bootloader</CardTitle>
                    <CardDescription>ปลดล็อกระบบเพื่อให้สามารถโมดิฟายตัวเครื่องได้</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between items-center border-t py-3 px-6">
                    <span className="text-sm font-bold text-blue-600">10 Credits</span>
                    <Button variant="ghost" size="sm" className="font-bold">เริ่มทำงาน</Button>
                  </CardFooter>
                </Card>

                <Card className="hover:border-blue-200 transition-colors">
                  <CardHeader>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                      <ShieldCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle>Root (Magisk)</CardTitle>
                    <CardDescription>ดึงไฟล์ Boot มา Patch และรูทอัตโนมัติ</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between items-center border-t py-3 px-6">
                    <span className="text-sm font-bold text-blue-600">15 Credits</span>
                    <Button variant="ghost" size="sm" className="font-bold">เริ่มทำงาน</Button>
                  </CardFooter>
                </Card>

                <Card className="hover:border-blue-200 transition-colors">
                  <CardHeader>
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-2">
                      <Key className="w-6 h-6 text-red-600" />
                    </div>
                    <CardTitle>Bypass FRP</CardTitle>
                    <CardDescription>ลบการติดล็อกบัญชี Google (Factory Reset Protection)</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between items-center border-t py-3 px-6">
                    <span className="text-sm font-bold text-blue-600">20 Credits</span>
                    <Button variant="ghost" size="sm" className="font-bold">เริ่มทำงาน</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "firmware" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">Firmware Repository</h2>
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="ค้นหารุ่นมือถือ หรือรหัส Firmware..." className="pl-10 rounded-xl" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  { name: "Xiaomi Redmi Note 13 Pro (India)", version: "V14.0.5.0.TNRINXM", size: "4.2 GB", type: "Fastboot" },
                  { name: "Samsung Galaxy S23 Ultra (Global)", version: "S918BXXU3AWGJ", size: "8.1 GB", type: "Odin" },
                  { name: "Realme GT Master Edition", version: "RMX3360_11_C.12", size: "3.8 GB", type: "Fastboot" },
                ].map((fw, i) => (
                  <Card key={i} className="hover:bg-gray-50 transition-colors">
                    <CardContent className="p-6 flex items-center gap-6">
                      <div className="bg-blue-50 p-3 rounded-xl">
                        <Smartphone className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{fw.name}</h3>
                        <p className="text-sm text-gray-500">เวอร์ชัน: {fw.version} | ประเภท: {fw.type}</p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="font-bold text-gray-900">{fw.size}</p>
                        <p className="text-xs text-gray-500">ฟรีสำหรับสมาชิก</p>
                      </div>
                      <Button size="sm" className="gap-2 font-bold px-6">
                        <Download className="w-4 h-4" /> ดาวน์โหลด
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Transaction & Activity History</h2>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4">วันที่ / เวลา</th>
                        <th className="px-6 py-4">ประเภทรายการ</th>
                        <th className="px-6 py-4">อุปกรณ์ / รายละเอียด</th>
                        <th className="px-6 py-4">จำนวนเครดิต</th>
                        <th className="px-6 py-4 text-right">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50/50">
                          <td className="px-6 py-4 text-gray-500 font-medium">25 เม.ย. 2026, 14:30</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold uppercase">Flash ROM</span>
                          </td>
                          <td className="px-6 py-4 font-medium">Redmi Note 13 Pro</td>
                          <td className="px-6 py-4 text-red-600 font-bold">- 5 Credits</td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-green-600 font-bold flex items-center justify-end gap-1.5">
                              <Check className="w-3.5 h-3.5" /> สำเร็จ
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
