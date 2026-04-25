"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { USBConnection } from "@/components/usb-connection";
import { FastbootDevice } from "@/lib/fastboot";
import { MaintenanceTools } from "@/lib/maintenance";
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
  Check,
  RefreshCw,
  Terminal,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [connectedUsbDevice, setConnectedUsbDevice] = useState<USBDevice | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-100), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

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

  const handleMaintenance = async (action: "unlock" | "frp" | "bootloop", cost: number) => {
    if (!connectedUsbDevice) {
      toast.error("กรุณาเชื่อมต่ออุปกรณ์ก่อน");
      return;
    }

    if ((session?.user?.credits || 0) < cost) {
      toast.error("เครดิตไม่เพียงพอ");
      return;
    }

    setIsProcessing(true);
    addLog(`Starting ${action} operation... (Cost: ${cost} Credits)`);

    try {
      const tools = new MaintenanceTools(connectedUsbDevice);
      await tools.init();

      let result;
      if (action === "unlock") result = await tools.unlockBootloader();
      else if (action === "frp") result = await tools.bypassFRP();
      else result = await tools.fixBootloop();

      if (result.success) {
        addLog(`Success: ${result.message}`);
        toast.success(result.message);
        
        // Call API to deduct credits
        const res = await fetch("/api/user/use-credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: cost, description: `${action} operation` }),
        });

        if (res.ok) {
          addLog(`Credits deducted: -${cost}`);
          await update();
        }
      } else {
        addLog(`Failed: ${result.message}`);
        toast.error(result.message);
      }
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
      toast.error(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReboot = async () => {
    if (!connectedUsbDevice) return;
    setIsProcessing(true);
    addLog("Sending reboot command...");
    try {
      const fb = new FastbootDevice(connectedUsbDevice);
      await fb.init();
      const resp = await fb.reboot();
      addLog(`Response: ${resp}`);
      toast.success("Reboot command sent");
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
      toast.error(e.message);
    } finally {
      setIsProcessing(false);
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
          <span className="font-bold text-xl tracking-tight text-gray-900">Flash Tool <span className="text-blue-600">Pro</span></span>
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
          <div className="px-2 pb-2 text-center">
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
                  <h1 className="text-2xl font-bold text-gray-900 font-sans tracking-tight leading-tight">ยินดีต้อนรับ, {session?.user?.name || "ช่างซ่อม"}</h1>
                  <p className="text-gray-500">สถานะระบบพร้อมทำงาน</p>
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-gray-900">
                <div className="lg:col-span-2 space-y-8">
                  <USBConnection onDeviceConnected={(dev) => setConnectedUsbDevice(dev)} />
                  
                  {connectedUsbDevice && (
                    <Card className="border-blue-100 bg-blue-50/20 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-blue-700 font-bold uppercase tracking-wider">
                          <Activity className="w-4 h-4" />
                          คำสั่งเร่งด่วน (Fast Actions)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-3">
                        <Button variant="outline" size="sm" className="gap-2 bg-white rounded-lg h-10 px-4" onClick={handleReboot} disabled={isProcessing}>
                          <RefreshCw className={cn("w-4 h-4", isProcessing && "animate-spin")} />
                          Reboot Device
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 bg-white rounded-lg h-10 px-4 border-orange-200 text-orange-700 hover:bg-orange-50" onClick={() => handleMaintenance("unlock", 10)} disabled={isProcessing}>
                          <Unlock className="w-4 h-4" />
                          Unlock Bootloader (10c)
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 bg-white rounded-lg h-10 px-4 border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleMaintenance("frp", 20)} disabled={isProcessing}>
                          <Key className="w-4 h-4" />
                          Bypass FRP (20c)
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-900">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group border-2 border-transparent hover:border-blue-100 bg-white" onClick={() => setActiveTab("flash")}>
                      <CardHeader className="pb-2">
                        <Zap className="w-8 h-8 text-yellow-500 mb-2 group-hover:scale-110 transition-transform" />
                        <CardTitle className="font-bold">Flash ROM</CardTitle>
                        <CardDescription>ติดตั้ง Firmware ศูนย์หรือรอมโมดิฟายด์</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group border-2 border-transparent hover:border-blue-100 bg-white" onClick={() => setActiveTab("oneclick")}>
                      <CardHeader className="pb-2">
                        <Smartphone className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                        <CardTitle className="font-bold">One-Click Tools</CardTitle>
                        <CardDescription>ปลดล็อก, Root, และแก้ปัญหาเบื้องต้น</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                </div>

                <div className="space-y-6">
                   {/* Terminal Logs */}
                  <Card className="bg-gray-900 text-white border-none shadow-xl overflow-hidden">
                    <CardHeader className="bg-gray-800 py-3 px-4 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                          <Terminal className="w-3 h-3 text-green-500" /> System Output Log
                        </CardTitle>
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-red-500/50" />
                          <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                          <div className="w-2 h-2 rounded-full bg-green-500/50" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 h-64 overflow-y-auto font-mono text-[11px] space-y-1 bg-black/20">
                      {logs.length === 0 && <p className="text-gray-600 italic">// Ready for operation...</p>}
                      {logs.map((log, i) => (
                        <p key={i} className={cn(
                          log.includes("Error") || log.includes("Failed") ? "text-red-400" : 
                          log.includes("Success") ? "text-green-400" : "text-blue-300"
                        )}>
                          <span className="opacity-30 mr-2">{">"}</span>
                          {log}
                        </p>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-2 border-blue-50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">ประวัติล่าสุด</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                      <div className="space-y-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 border-b last:border-0 border-gray-100">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                              <Check className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900">Flash Firmware Success</p>
                              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Xiaomi Redmi Note 13 Pro</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50/50 py-2 px-6">
                      <Button variant="ghost" className="w-full text-xs font-bold text-blue-600 cursor-pointer" onClick={() => setActiveTab("history")}>ดูประวัติทั้งหมด</Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "flash" && (
            <div className="space-y-6">
               {/* Flash UI will be added in Phase 4-5 refinement */}
               <h2 className="text-2xl font-bold">Flash ROM Engine</h2>
               <p className="text-gray-500">Coming soon in Phase 4 integration.</p>
            </div>
          )}

          {activeTab === "oneclick" && (
            <div className="space-y-6">
               <h2 className="text-2xl font-bold">One-Click Maintenance</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="hover:border-blue-200 transition-all shadow-sm group">
                    <CardHeader>
                      <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-orange-100">
                        <Unlock className="w-6 h-6 text-orange-600" />
                      </div>
                      <CardTitle className="font-bold">Unlock Bootloader</CardTitle>
                      <CardDescription className="text-xs">ปลดล็อกระบบเพื่อให้สามารถโมดิฟายตัวเครื่องได้</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center border-t py-4 px-6 bg-gray-50/30">
                      <span className="text-sm font-black text-blue-600">10 Credits</span>
                      <Button variant="default" size="sm" className="font-bold h-9 rounded-lg bg-blue-600 shadow-md shadow-blue-100" onClick={() => handleMaintenance("unlock", 10)} disabled={isProcessing}>เริ่มทำงาน</Button>
                    </CardFooter>
                  </Card>

                  <Card className="hover:border-blue-200 transition-all shadow-sm group">
                    <CardHeader>
                      <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-green-100">
                        <ShieldCheck className="w-6 h-6 text-green-600" />
                      </div>
                      <CardTitle className="font-bold">Root (Magisk)</CardTitle>
                      <CardDescription className="text-xs">ดึงไฟล์ Boot มา Patch และรูทอัตโนมัติ</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center border-t py-4 px-6 bg-gray-50/30">
                      <span className="text-sm font-black text-blue-600">15 Credits</span>
                      <Button variant="default" size="sm" className="font-bold h-9 rounded-lg bg-blue-600 shadow-md shadow-blue-100 disabled">Coming Soon</Button>
                    </CardFooter>
                  </Card>

                  <Card className="hover:border-blue-200 transition-all shadow-sm group">
                    <CardHeader>
                      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-red-100">
                        <Key className="w-6 h-6 text-red-600" />
                      </div>
                      <CardTitle className="font-bold">Bypass FRP</CardTitle>
                      <CardDescription className="text-xs">ลบการติดล็อกบัญชี Google (FRP Lock)</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center border-t py-4 px-6 bg-gray-50/30">
                      <span className="text-sm font-black text-blue-600">20 Credits</span>
                      <Button variant="default" size="sm" className="font-bold h-9 rounded-lg bg-blue-600 shadow-md shadow-blue-100" onClick={() => handleMaintenance("frp", 20)} disabled={isProcessing}>เริ่มทำงาน</Button>
                    </CardFooter>
                  </Card>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
