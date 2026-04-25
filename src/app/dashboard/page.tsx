"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { USBConnection } from "@/components/usb-connection";
import { FastbootDevice, FlashProgress } from "@/lib/fastboot";
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
  Activity,
  UploadCloud,
  FileCode
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
  
  // Flashing State
  const [flashFile, setFile] = useState<File | null>(null);
  const [partition, setPartition] = useState("boot");
  const [progress, setProgress] = useState<FlashProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-100), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen font-sans">กำลังโหลด...</div>;
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
        toast.success("เติมเครดิตสำเร็จ 100 Credits!");
        await update();
      } else {
        toast.error("เติมเครดิตไม่สำเร็จ");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเติมเครดิต");
    } finally {
      setLoading(false);
    }
  };

  const handleFlash = async () => {
    if (!connectedUsbDevice || !flashFile) {
      toast.error("กรุณาเชื่อมต่ออุปกรณ์และเลือกไฟล์");
      return;
    }

    const cost = 5;
    if ((session?.user?.credits || 0) < cost) {
      toast.error("เครดิตไม่เพียงพอ (ต้องการ 5 Credits)");
      return;
    }

    setIsProcessing(true);
    addLog(`Starting Flash Engine... Partition: ${partition}, File: ${flashFile.name}`);

    try {
      const fb = new FastbootDevice(connectedUsbDevice);
      await fb.init();

      const arrayBuffer = await flashFile.arrayBuffer();
      
      addLog("Downloading data to device...");
      await fb.download(arrayBuffer, (p) => {
        setProgress(p);
      });

      addLog(`Flashing ${partition} partition...`);
      await fb.flash(partition);
      
      addLog("Flash Operation Successful!");
      toast.success("แฟลชรอมสำเร็จ!");

      // Deduct Credits
      await fetch("/api/user/use-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cost, description: `Flash ${partition}: ${flashFile.name}` }),
      });
      await update();

    } catch (e: any) {
      addLog(`Flash Error: ${e.message}`);
      toast.error(`Flash Failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
      setProgress(null);
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
    <div className="flex min-h-screen bg-gray-50/50 font-sans">
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
          <div className="px-2 pb-2 text-center border-b border-gray-50 mb-2">
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Developer</p>
            <a href="https://github.com/Homiez09" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">@Homiez09</a>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">My Credits</span>
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-gray-900">{session?.user?.credits || 0}</div>
            <Button size="sm" variant="outline" className="w-full mt-3 h-8 text-xs font-bold gap-1.5 rounded-lg border-blue-100 text-blue-600 hover:bg-blue-50" onClick={handleTopUp} disabled={loading}>
              <PlusCircle className="w-3 h-3" /> เติมเครดิต
            </Button>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm" onClick={() => signOut()}>
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
            <LogOut className="w-5 h-5 text-red-500" />
          </Button>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight uppercase">ยินดีต้อนรับ, {session?.user?.name || "ช่างซ่อม"}</h1>
                  <p className="text-gray-500 font-medium tracking-tight">เลือกเครื่องมือที่ต้องการเพื่อเริ่มต้นจัดการอุปกรณ์</p>
                </div>
                <div className="bg-white p-2 rounded-2xl shadow-sm border flex items-center gap-2">
                  <div className="px-5 py-2 bg-green-50 rounded-xl border border-green-100">
                    <span className="text-[10px] text-green-600 font-black uppercase block tracking-widest">Server Status</span>
                    <span className="text-sm font-bold text-green-700 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Online & Stable
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <USBConnection onDeviceConnected={(dev) => setConnectedUsbDevice(dev)} />
                  
                  {connectedUsbDevice && (
                    <Card className="border-blue-100 bg-blue-50/20 shadow-sm border-2 animate-in slide-in-from-top-4 duration-500">
                      <CardHeader className="pb-3 px-6 pt-6">
                        <CardTitle className="text-[10px] flex items-center gap-2 text-blue-700 font-black uppercase tracking-widest">
                          <Activity className="w-4 h-4" />
                          คำสั่งเร่งด่วน (Fast Actions)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-3 px-6 pb-6">
                        <Button variant="outline" size="sm" className="gap-2 bg-white rounded-xl h-11 px-5 font-bold border-gray-200" onClick={handleReboot} disabled={isProcessing}>
                          <RefreshCw className={cn("w-4 h-4", isProcessing && "animate-spin")} />
                          Reboot
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 bg-white rounded-xl h-11 px-5 font-bold border-orange-200 text-orange-700 hover:bg-orange-50" onClick={() => handleMaintenance("unlock", 10)} disabled={isProcessing}>
                          <Unlock className="w-4 h-4" />
                          Unlock Bootloader
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 bg-white rounded-xl h-11 px-5 font-bold border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleMaintenance("frp", 20)} disabled={isProcessing}>
                          <Key className="w-4 h-4" />
                          Bypass FRP
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-blue-200 bg-white shadow-sm overflow-hidden" onClick={() => setActiveTab("flash")}>
                      <CardHeader className="pb-2">
                        <Zap className="w-10 h-10 text-yellow-500 mb-3 group-hover:scale-110 transition-transform bg-yellow-50 p-2 rounded-xl" />
                        <CardTitle className="font-black text-xl text-gray-900">Flash ROM Engine</CardTitle>
                        <CardDescription className="font-medium text-gray-500">ติดตั้ง Firmware ศูนย์หรือรอมโมดิฟายด์</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-blue-200 bg-white shadow-sm overflow-hidden" onClick={() => setActiveTab("oneclick")}>
                      <CardHeader className="pb-2">
                        <Smartphone className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform bg-blue-50 p-2 rounded-xl" />
                        <CardTitle className="font-black text-xl text-gray-900">One-Click Tools</CardTitle>
                        <CardDescription className="font-medium text-gray-500">ปลดล็อก, Root, และแก้ปัญหาอัตโนมัติ</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                </div>

                <div className="space-y-6">
                   {/* Terminal Logs */}
                  <Card className="bg-gray-950 text-white border-none shadow-2xl overflow-hidden rounded-2xl ring-1 ring-white/10">
                    <CardHeader className="bg-gray-900/50 py-4 px-5 border-b border-white/5">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-2">
                          <Terminal className="w-3 h-3" /> Output Log
                        </CardTitle>
                        <div className="flex gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 h-64 overflow-y-auto font-mono text-[11px] space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
                      {logs.length === 0 && <p className="text-white/20 italic">// Ready for system input...</p>}
                      {logs.map((log, i) => (
                        <p key={i} className={cn(
                          log.includes("Error") || log.includes("Failed") ? "text-red-400" : 
                          log.includes("Success") ? "text-green-400" : "text-blue-300"
                        )}>
                          <span className="text-white/10 mr-2">➜</span>
                          {log}
                        </p>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-2 border-blue-50 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gray-50/50">
                      <CardTitle className="text-lg font-black text-gray-900 uppercase tracking-tight">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 py-0">
                      <div className="space-y-0">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-blue-50/50 border-b last:border-0 border-gray-100 transition-colors">
                            <div className="bg-blue-600/10 p-2 rounded-xl text-blue-600">
                              <Check className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-black text-gray-900">Flash Operation</p>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Xiaomi Redmi Note 13 Pro</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50/30 py-3 px-6">
                      <Button variant="ghost" className="w-full text-xs font-black text-blue-600 hover:bg-blue-100/50 transition-all rounded-lg uppercase tracking-widest" onClick={() => setActiveTab("history")}>View All History</Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "flash" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Flash ROM Engine</h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("dashboard")} className="font-bold rounded-xl">Back to Dashboard</Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-2 border-blue-50 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-blue-600" />
                      Firmware Configuration
                    </CardTitle>
                    <CardDescription className="font-medium">เลือกไฟล์และพาร์ทิชันที่ต้องการแฟลช</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    {/* File Dropzone */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-4 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center transition-all cursor-pointer group",
                        flashFile ? "border-green-200 bg-green-50/30" : "border-gray-100 bg-gray-50/50 hover:border-blue-200 hover:bg-blue-50/30"
                      )}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      {flashFile ? (
                        <>
                          <div className="bg-green-100 p-5 rounded-3xl mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <Check className="w-10 h-10 text-green-600" />
                          </div>
                          <p className="font-black text-gray-900 text-lg">{flashFile.name}</p>
                          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mt-1">{(flashFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          <Button variant="ghost" size="sm" className="mt-4 text-red-500 font-bold hover:bg-red-50 rounded-xl" onClick={(e) => { e.stopPropagation(); setFile(null); }}>เปลี่ยนไฟล์</Button>
                        </>
                      ) : (
                        <>
                          <div className="bg-blue-100 p-5 rounded-3xl mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <UploadCloud className="w-10 h-10 text-blue-600" />
                          </div>
                          <p className="font-black text-gray-900 text-lg">ลากไฟล์ Firmware มาวางที่นี่</p>
                          <p className="text-sm text-gray-500 font-medium text-center max-w-xs mt-2">รองรับไฟล์ .img และไฟล์ Image มาตรฐานสากล</p>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Target Partition</label>
                        <select 
                          value={partition}
                          onChange={(e) => setPartition(e.target.value)}
                          className="w-full h-12 bg-white border-2 border-gray-100 rounded-xl px-4 font-bold text-sm focus:border-blue-500 focus:ring-0 outline-none transition-all"
                        >
                          <option value="boot">Boot Partition</option>
                          <option value="recovery">Recovery Partition</option>
                          <option value="system">System (Sparse Image)</option>
                          <option value="vendor">Vendor</option>
                          <option value="userdata">User Data (Wipe)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Cost Estimation</label>
                         <div className="h-12 bg-blue-600/5 border-2 border-blue-100 rounded-xl px-4 flex items-center gap-3">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="font-black text-blue-700">5 Credits</span>
                         </div>
                      </div>
                    </div>

                    {/* Progress UI */}
                    {progress && (
                      <div className="space-y-4 p-6 bg-gray-900 rounded-3xl border-4 border-blue-500/20 shadow-xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-white">
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            {progress.phase}
                          </span>
                          <span className="text-blue-400">{(progress.bytesSent / progress.totalBytes * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3.5 overflow-hidden p-0.5">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                            style={{ width: `${(progress.bytesSent / progress.totalBytes * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          <span>{(progress.bytesSent / (1024 * 1024)).toFixed(1)} / {(progress.totalBytes / (1024 * 1024)).toFixed(1)} MB</span>
                          <span className="text-green-500">Speed: {(progress.speed / (1024 * 1024)).toFixed(2)} MB/s</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-gray-50/50 p-6 border-t flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      Server-side validation enabled
                    </div>
                    <Button 
                      onClick={handleFlash} 
                      disabled={isProcessing || !flashFile || !connectedUsbDevice}
                      className="h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-[0.98] font-black text-lg gap-2"
                    >
                      {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                      {isProcessing ? "กำลังแฟลช..." : "เริ่มกระบวนการแฟลช"}
                    </Button>
                  </CardFooter>
                </Card>

                <div className="space-y-6">
                   <Card className="bg-gray-900 text-white rounded-2xl overflow-hidden shadow-xl ring-1 ring-white/10 border-none">
                      <CardHeader className="border-b border-white/5 py-4">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                           <Terminal className="w-3 h-3" /> Flash Output
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 h-[380px] overflow-y-auto font-mono text-[11px] space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
                         {logs.length === 0 && <p className="text-white/20 italic">// Ready for firmware data...</p>}
                         {logs.map((log, i) => (
                           <p key={i} className={cn(
                             log.includes("Error") ? "text-red-400" : 
                             log.includes("Successful") ? "text-green-400" : "text-blue-300"
                           )}>
                             <span className="text-white/10 mr-2">➜</span>
                             {log}
                           </p>
                         ))}
                      </CardContent>
                   </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "oneclick" && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">One-Click Maintenance</h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("dashboard")} className="font-bold rounded-xl">Back to Dashboard</Button>
              </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <Card className="hover:shadow-2xl transition-all shadow-sm group border-2 border-transparent hover:border-orange-200 bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="p-8">
                      <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-orange-100">
                        <Unlock className="w-7 h-7 text-orange-600" />
                      </div>
                      <CardTitle className="font-black text-2xl text-gray-900 tracking-tight uppercase">Unlock Bootloader</CardTitle>
                      <CardDescription className="font-bold text-gray-500">ปลดล็อกระบบเพื่อให้สามารถโมดิฟายตัวเครื่องได้ รองรับคำสั่งมาตรฐาน Fastboot</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center border-t py-6 px-8 bg-gray-50/50">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Service Fee</span>
                        <span className="text-xl font-black text-blue-600">10 Credits</span>
                      </div>
                      <Button 
                        variant="default" 
                        size="lg" 
                        className="font-black h-12 rounded-xl bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-100 cursor-pointer" 
                        onClick={() => handleMaintenance("unlock", 10)} 
                        disabled={isProcessing}
                      >
                        เริ่มทำงาน
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card className="hover:shadow-2xl transition-all shadow-sm group border-2 border-transparent hover:border-green-200 bg-white rounded-2xl overflow-hidden opacity-60">
                    <CardHeader className="p-8">
                      <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-green-100">
                        <ShieldCheck className="w-7 h-7 text-green-600" />
                      </div>
                      <CardTitle className="font-black text-2xl text-gray-900 tracking-tight uppercase">Auto Root (Magisk)</CardTitle>
                      <CardDescription className="font-bold text-gray-500">ดึงไฟล์ Boot มา Patch และรูทอัตโนมัติ (Coming Soon in v0.3.0)</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center border-t py-6 px-8 bg-gray-50/50">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Service Fee</span>
                        <span className="text-xl font-black text-blue-600">15 Credits</span>
                      </div>
                      <Button variant="default" size="lg" className="font-black h-12 rounded-xl bg-gray-200 text-gray-500 shadow-none cursor-not-allowed" disabled>ยังไม่เปิดใช้</Button>
                    </CardFooter>
                  </Card>

                  <Card className="hover:shadow-2xl transition-all shadow-sm group border-2 border-transparent hover:border-red-200 bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="p-8">
                      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-red-100">
                        <Key className="w-7 h-7 text-red-600" />
                      </div>
                      <CardTitle className="font-black text-2xl text-gray-900 tracking-tight uppercase">Bypass FRP</CardTitle>
                      <CardDescription className="font-bold text-gray-500">ลบการติดล็อกบัญชี Google (FRP Lock) สำหรับรุ่นที่รองรับโหมด Fastboot Erase</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center border-t py-6 px-8 bg-gray-50/50">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Service Fee</span>
                        <span className="text-xl font-black text-blue-600">20 Credits</span>
                      </div>
                      <Button 
                        variant="default" 
                        size="lg" 
                        className="font-black h-12 rounded-xl bg-red-600 hover:bg-red-700 shadow-xl shadow-red-100 cursor-pointer" 
                        onClick={() => handleMaintenance("frp", 20)} 
                        disabled={isProcessing}
                      >
                        เริ่มทำงาน
                      </Button>
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
