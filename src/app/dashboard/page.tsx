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
import { MaintenanceTools, DeviceSpecs } from "@/lib/maintenance";
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
  FileCode,
  Eraser,
  Cpu,
  Lock,
  Globe,
  Link as LinkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [connectedUsbDevice, setConnectedUsbDevice] = useState<USBDevice | null>(null);
  const [deviceSpecs, setDeviceSpecs] = useState<DeviceSpecs | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Flashing State
  const [flashFile, setFile] = useState<File | null>(null);
  const [flashUrl, setFlashUrl] = useState("");
  const [flashMethod, setFlashMethod] = useState<"file" | "url">("file");
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

  const handleDeviceConnected = async (dev: USBDevice) => {
    setConnectedUsbDevice(dev);
    addLog(`Device Connected: ${dev.productName}`);
    try {
      const tools = new MaintenanceTools(dev);
      await tools.init();
      const specs = await tools.getDeviceSpecs();
      setDeviceSpecs(specs);
      addLog(`Specs Detected: Chipset=${specs.chipset}, Bootloader=${specs.unlocked ? "Unlocked" : "Locked"}`);
    } catch (e: any) {
      addLog(`Detection Error: ${e.message}`);
    }
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen font-sans uppercase">กำลังโหลด...</div>;
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
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleFlash = async () => {
    if (!connectedUsbDevice) {
      toast.error("กรุณาเชื่อมต่ออุปกรณ์ก่อน");
      return;
    }

    if (flashMethod === "file" && !flashFile) {
      toast.error("กรุณาเลือกไฟล์ก่อน");
      return;
    }

    if (flashMethod === "url" && !flashUrl) {
      toast.error("กรุณาระบุ URL ก่อน");
      return;
    }

    const cost = 5;
    if ((session?.user?.credits || 0) < cost) {
      toast.error("เครดิตไม่เพียงพอ");
      return;
    }

    setIsProcessing(true);
    addLog(`Starting Flash Engine... Method: ${flashMethod}, Partition: ${partition}`);

    try {
      const fb = new FastbootDevice(connectedUsbDevice);
      await fb.init();

      if (flashMethod === "file" && flashFile) {
        const arrayBuffer = await flashFile.arrayBuffer();
        addLog("Downloading file to device...");
        await fb.download(arrayBuffer, arrayBuffer.byteLength, (p) => setProgress(p));
      } else if (flashMethod === "url" && flashUrl) {
        addLog(`Fetching firmware from: ${flashUrl}`);
        const response = await fetch(flashUrl);
        if (!response.ok) throw new Error("Failed to fetch firmware from URL");
        
        const contentLength = response.headers.get("Content-Length");
        if (!contentLength) throw new Error("Server did not provide content length");
        
        const totalSize = parseInt(contentLength, 10);
        const stream = response.body;
        if (!stream) throw new Error("Failed to get stream from response");

        addLog("Streaming firmware directly to device...");
        await fb.download(stream, totalSize, (p) => setProgress(p));
      }

      addLog(`Flashing ${partition} partition...`);
      await fb.flash(partition);
      
      addLog("Flash Operation Successful!");
      toast.success("แฟลชรอมสำเร็จ!");

      await fetch("/api/user/use-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cost, description: `Flash ${partition} via ${flashMethod}` }),
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

  const handleMaintenance = async (action: "unlock" | "frp" | "bootloop" | "demo" | "cache", cost: number) => {
    if (!connectedUsbDevice) {
      toast.error("กรุณาเชื่อมต่ออุปกรณ์ก่อน");
      return;
    }
    if ((session?.user?.credits || 0) < cost) {
      toast.error("เครดิตไม่เพียงพอ");
      return;
    }
    setIsProcessing(true);
    addLog(`Starting ${action} operation...`);
    try {
      const tools = new MaintenanceTools(connectedUsbDevice);
      await tools.init();
      let result;
      switch(action) {
        case "unlock": result = await tools.unlockBootloader(); break;
        case "frp": result = await tools.bypassFRP(); break;
        case "bootloop": result = await tools.fixBootloop(); break;
        case "demo": result = await tools.removeDemoMode(); break;
        case "cache": result = await tools.cleanCache(); break;
      }
      if (result.success) {
        addLog(`Success: ${result.message}`);
        toast.success(result.message);
        await fetch("/api/user/use-credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: cost, description: `${action} operation` }),
        });
        await update();
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
    try {
      const fb = new FastbootDevice(connectedUsbDevice);
      await fb.init();
      await fb.reboot();
      addLog("Reboot command sent");
      toast.success("Reboot command sent");
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
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
          <span className="font-bold text-xl tracking-tight text-gray-900 uppercase">Flash Tool <span className="text-blue-600">Pro</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
                activeTab === item.id 
                  ? "bg-blue-50 text-blue-700 shadow-sm font-bold" 
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-blue-600" : "text-gray-400")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t space-y-4">
          <div className="px-2 pb-2 text-center border-b border-gray-50 mb-2 lowercase opacity-50 italic">
            <p className="text-[10px] uppercase font-black tracking-widest mb-1">Developer</p>
            <a href="https://github.com/Homiez09" target="_blank" rel="noopener noreferrer" className="text-xs font-bold">@Homiez09</a>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">My Credits</span>
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-gray-900 uppercase">{session?.user?.credits || 0}</div>
            <Button size="sm" variant="outline" className="w-full mt-3 h-8 text-xs font-bold gap-1.5 rounded-lg border-blue-100 text-blue-600 hover:bg-blue-50 cursor-pointer" onClick={handleTopUp} disabled={loading}>
              <PlusCircle className="w-3 h-3" /> เติมเครดิต
            </Button>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm cursor-pointer" onClick={() => signOut()}>
            <LogOut className="w-5 h-5 mr-3" /> ออกจากระบบ
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span className="font-bold uppercase">Flash Tool Pro</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut()} className="cursor-pointer">
            <LogOut className="w-5 h-5 text-red-500" />
          </Button>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 font-sans tracking-tight uppercase">
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">ยินดีต้อนรับ, {session?.user?.name || "ช่างซ่อม"}</h1>
                  <p className="text-gray-500 font-medium lowercase">เลือกเครื่องมือที่ต้องการเพื่อเริ่มต้นจัดการอุปกรณ์</p>
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
                  <USBConnection onDeviceConnected={handleDeviceConnected} />
                  
                  {connectedUsbDevice && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
                      <Card className="border-blue-100 bg-blue-50/20 shadow-sm border-2">
                        <CardHeader className="pb-3 px-6 pt-6">
                          <CardTitle className="text-[10px] flex items-center gap-2 text-blue-700 font-black uppercase tracking-widest">
                            <Activity className="w-4 h-4" /> Fast Actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3 px-6 pb-6">
                          <Button variant="outline" size="sm" className="gap-2 bg-white rounded-xl h-11 px-5 font-bold border-gray-200 cursor-pointer" onClick={handleReboot} disabled={isProcessing}>
                            <RefreshCw className={cn("w-4 h-4", isProcessing && "animate-spin")} /> Reboot
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2 bg-white rounded-xl h-11 px-5 font-bold border-orange-200 text-orange-700 hover:bg-orange-50 cursor-pointer" onClick={() => handleMaintenance("unlock", 10)} disabled={isProcessing}>
                            <Unlock className="w-4 h-4" /> Unlock BL
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2 bg-white rounded-xl h-11 px-5 font-bold border-red-200 text-red-700 hover:bg-red-50 cursor-pointer" onClick={() => handleMaintenance("frp", 20)} disabled={isProcessing}>
                            <Key className="w-4 h-4" /> Bypass FRP
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-green-100 bg-green-50/20 shadow-sm border-2">
                        <CardHeader className="pb-3 px-6 pt-6">
                          <CardTitle className="text-[10px] flex items-center gap-2 text-green-700 font-black uppercase tracking-widest">
                            <Cpu className="w-4 h-4" /> Device Info
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 space-y-2">
                           <div className="flex justify-between text-xs">
                              <span className="text-gray-500 font-bold uppercase tracking-tighter">Chipset:</span>
                              <span className="font-black text-gray-900">{deviceSpecs?.chipset || "Detecting..."}</span>
                           </div>
                           <div className="flex justify-between text-xs">
                              <span className="text-gray-500 font-bold uppercase tracking-tighter">Bootloader:</span>
                              <span className={cn("font-black", deviceSpecs?.unlocked ? "text-green-600" : "text-red-600")}>
                                {deviceSpecs ? (deviceSpecs.unlocked ? "UNLOCKED" : "LOCKED") : "..."}
                              </span>
                           </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-blue-200 bg-white shadow-sm overflow-hidden" onClick={() => setActiveTab("flash")}>
                      <CardHeader className="pb-2">
                        <Zap className="w-10 h-10 text-yellow-500 mb-3 group-hover:scale-110 transition-transform bg-yellow-50 p-2 rounded-xl" />
                        <CardTitle className="font-black text-xl text-gray-900">Flash ROM Engine</CardTitle>
                        <CardDescription className="font-medium text-gray-500 lowercase">แฟลชไฟล์ Firmware จากเครื่องหรือ URL</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-blue-200 bg-white shadow-sm overflow-hidden" onClick={() => setActiveTab("oneclick")}>
                      <CardHeader className="pb-2">
                        <Smartphone className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform bg-blue-50 p-2 rounded-xl" />
                        <CardTitle className="font-black text-xl text-gray-900">One-Click Tools</CardTitle>
                        <CardDescription className="font-medium text-gray-500 lowercase">สคริปต์อัตโนมัติสำหรับปลดล็อกและแก้ปัญหา</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                </div>

                <div className="space-y-6">
                  <Card className="bg-gray-950 text-white border-none shadow-2xl overflow-hidden rounded-2xl ring-1 ring-white/10">
                    <CardHeader className="bg-gray-900/50 py-4 px-5 border-b border-white/5">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-2">
                        <Terminal className="w-3 h-3" /> System Log
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 h-64 overflow-y-auto font-mono text-[11px] space-y-1.5 bg-black/20">
                      {logs.length === 0 && <p className="text-white/20 italic">// Ready...</p>}
                      {logs.map((log, i) => (
                        <p key={i} className={cn(log.includes("Error") || log.includes("Failed") ? "text-red-400" : log.includes("Success") ? "text-green-400" : "text-blue-300")}>
                          <span className="text-white/10 mr-2">➜</span>{log}
                        </p>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-2 border-blue-50 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gray-50/50"><CardTitle className="text-lg font-black text-gray-900 uppercase">Recent Activity</CardTitle></CardHeader>
                    <CardContent className="px-0 py-0">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b last:border-0 border-gray-100">
                          <div className="bg-blue-600/10 p-2 rounded-xl text-blue-600"><Check className="w-4 h-4" /></div>
                          <div className="flex-1">
                            <p className="text-xs font-black text-gray-900 uppercase tracking-tighter">Operation Success</p>
                            <p className="text-[10px] text-gray-500 font-bold lowercase italic tracking-tighter opacity-70">Xiaomi Device detected</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "flash" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Flash ROM Engine <span className="text-blue-600 text-sm ml-2 font-bold opacity-50 tracking-widest">v0.4.0 Alpha</span></h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("dashboard")} className="font-bold rounded-xl cursor-pointer">Back to Dashboard</Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-2 border-blue-50 shadow-sm rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b p-6">
                    <div className="flex gap-4 mb-4">
                       <button onClick={() => setFlashMethod("file")} className={cn("flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all cursor-pointer", flashMethod === "file" ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-white text-gray-400 border-gray-100 hover:border-blue-200")}>
                          <UploadCloud className="w-4 h-4" /> Local File
                       </button>
                       <button onClick={() => setFlashMethod("url")} className={cn("flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all cursor-pointer", flashMethod === "url" ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-white text-gray-400 border-gray-100 hover:border-blue-200")}>
                          <Globe className="w-4 h-4" /> URL / Cloud
                       </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    {flashMethod === "file" ? (
                      <div onClick={() => fileInputRef.current?.click()} className={cn("border-4 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center transition-all cursor-pointer group", flashFile ? "border-green-200 bg-green-50/30" : "border-gray-100 bg-gray-50/50 hover:border-blue-200 hover:bg-blue-50/30")}>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        {flashFile ? (
                          <>
                            <div className="bg-green-100 p-5 rounded-3xl mb-4 shadow-sm"><Check className="w-10 h-10 text-green-600" /></div>
                            <p className="font-black text-gray-900 text-lg">{flashFile.name}</p>
                            <p className="text-sm text-gray-500 font-bold tracking-wider mt-1 uppercase">{(flashFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </>
                        ) : (
                          <>
                            <div className="bg-blue-100 p-5 rounded-3xl mb-4 group-hover:scale-110 transition-transform shadow-sm"><UploadCloud className="w-10 h-10 text-blue-600" /></div>
                            <p className="font-black text-gray-900 text-lg">Select local firmware</p>
                            <p className="text-xs text-gray-400 font-medium mt-2 lowercase">Drag and drop file here</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4 p-8 bg-blue-50/30 border-4 border-dashed border-blue-100 rounded-3xl">
                         <div className="bg-blue-100 p-4 w-fit rounded-2xl mb-4"><Globe className="w-8 h-8 text-blue-600" /></div>
                         <label className="text-xs font-black uppercase tracking-widest text-blue-600 ml-1">Firmware Direct Link</label>
                         <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input value={flashUrl} onChange={(e) => setFlashUrl(e.target.value)} placeholder="https://cloud.storage.com/rom.img" className="h-14 pl-12 rounded-2xl border-2 border-blue-100 bg-white focus:ring-4 focus:ring-blue-500/10 font-bold" />
                         </div>
                         <p className="text-[10px] text-gray-500 font-bold lowercase px-2 opacity-70 italic tracking-tight">ระบบจะทำการสตรีมข้อมูลไปยังอุปกรณ์โดยตรง ไม่กินพื้นที่ RAM เครื่องคอมพิวเตอร์ของคุณ</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Partition</label>
                        <select value={partition} onChange={(e) => setPartition(e.target.value)} className="w-full h-14 bg-white border-2 border-gray-100 rounded-2xl px-5 font-black text-sm outline-none transition-all cursor-pointer focus:border-blue-500">
                          <option value="boot">Boot Partition</option>
                          <option value="recovery">Recovery Partition</option>
                          <option value="system">System (Sparse)</option>
                          <option value="vendor">Vendor</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Cost</label>
                         <div className="h-14 bg-blue-600/5 border-2 border-blue-100 rounded-2xl px-5 flex items-center gap-3">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="font-black text-blue-700 text-lg uppercase">5 Credits</span>
                         </div>
                      </div>
                    </div>

                    {progress && (
                      <div className="space-y-4 p-6 bg-gray-900 rounded-3xl border-4 border-blue-500/20 shadow-xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-white">
                          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />{progress.phase}</span>
                          <span className="text-blue-400">{(progress.bytesSent / progress.totalBytes * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3.5 overflow-hidden p-0.5">
                          <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.6)]" style={{ width: `${(progress.bytesSent / progress.totalBytes * 100)}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          <span>{(progress.bytesSent / (1024 * 1024)).toFixed(1)} / {(progress.totalBytes / (1024 * 1024)).toFixed(1)} MB</span>
                          <span className="text-green-500">Speed: {(progress.speed / (1024 * 1024)).toFixed(2)} MB/s</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-gray-50/50 p-6 border-t flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                      <ShieldCheck className="w-5 h-5 text-green-600" /> Hardware Safety Secure
                    </div>
                    <Button onClick={handleFlash} disabled={isProcessing || (!flashFile && !flashUrl) || !connectedUsbDevice} className="h-14 px-12 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-[0.98] font-black text-lg gap-3 cursor-pointer uppercase">
                      {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 shadow-sm" />}
                      {isProcessing ? "FLASHING..." : "START ENGINE"}
                    </Button>
                  </CardFooter>
                </Card>

                <div className="space-y-6">
                   <Card className="bg-gray-950 text-white rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 border-none">
                      <CardHeader className="border-b border-white/5 py-4 px-6 bg-gray-900/50">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                           <Terminal className="w-3 h-3" /> Console Output
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 h-[440px] overflow-y-auto font-mono text-[11px] space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 bg-black/30">
                         {logs.length === 0 && <p className="text-white/20 italic">// No activity...</p>}
                         {logs.map((log, i) => (
                           <p key={i} className={cn(log.includes("Error") ? "text-red-400" : log.includes("Successful") ? "text-green-400" : "text-blue-300")}>
                             <span className="text-white/10 mr-2 opacity-50">➜</span>{log}
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
                <Button variant="outline" size="sm" onClick={() => setActiveTab("dashboard")} className="font-bold rounded-xl cursor-pointer">Back to Dashboard</Button>
              </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <MaintenanceCard title="Unlock Bootloader" desc="ปลดล็อกระบบเพื่อให้สามารถโมดิฟายตัวเครื่องได้ รองรับคำสั่งมาตรฐาน Fastboot" cost={10} icon={Unlock} color="orange" onClick={() => handleMaintenance("unlock", 10)} disabled={isProcessing} />
                  <MaintenanceCard title="Bypass FRP Lock" desc="ลบการติดล็อกบัญชี Google (FRP Lock) สำหรับรุ่นที่รองรับโหมด Fastboot Erase" cost={20} icon={Key} color="red" onClick={() => handleMaintenance("frp", 20)} disabled={isProcessing} />
                  <MaintenanceCard title="Fix Bootloop" desc="ล้างพาร์ทิชัน UserData และ Cache เพื่อแก้ไขอาการค้างโลโก้หรือบูทวน" cost={5} icon={RefreshCw} color="blue" onClick={() => handleMaintenance("bootloop", 5)} disabled={isProcessing} />
                  <MaintenanceCard title="Remove Demo Mode" desc="ปลดล็อกโหมดหน้าร้าน (Demo Mode) สำหรับ Vivo, Oppo และ Xiaomi" cost={30} icon={Eraser} color="purple" onClick={() => handleMaintenance("demo", 30)} disabled={isProcessing} />
                  <MaintenanceCard title="Clean Cache" desc="ล้างไฟล์ขยะในระบบ Dalvik/Cache เพื่อเพิ่มพื้นที่และความเร็ว" cost={2} icon={Eraser} color="green" onClick={() => handleMaintenance("cache", 2)} disabled={isProcessing} />
               </div>
            </div>
          )}
          
          {/* Settings Tab (Simple Logout for now) */}
          {activeTab === "settings" && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 mt-12">
               <Card className="rounded-3xl border-2 border-red-100 bg-red-50/20 overflow-hidden">
                  <CardHeader className="p-8">
                     <CardTitle className="text-red-700 uppercase font-black tracking-tight">Danger Zone</CardTitle>
                     <CardDescription className="font-bold lowercase">จัดการบัญชีและข้อมูลความปลอดภัยของคุณ</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                     <Button variant="destructive" className="w-full h-14 rounded-2xl font-black text-lg gap-2 cursor-pointer shadow-xl shadow-red-100" onClick={() => signOut()}>
                        <LogOut className="w-6 h-6" /> ออกจากระบบทันที
                     </Button>
                  </CardContent>
               </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MaintenanceCard({ title, desc, cost, icon: Icon, color, onClick, disabled }: any) {
  const colorMap: any = {
    orange: "bg-orange-50 border-orange-100 text-orange-600 hover:border-orange-200 shadow-orange-50/50",
    red: "bg-red-50 border-red-100 text-red-600 hover:border-red-200 shadow-red-50/50",
    blue: "bg-blue-50 border-blue-100 text-blue-600 hover:border-blue-200 shadow-blue-50/50",
    purple: "bg-purple-50 border-purple-100 text-purple-600 hover:border-purple-200 shadow-purple-50/50",
    green: "bg-green-50 border-green-100 text-green-600 hover:border-green-200 shadow-green-50/50",
  };
  const btnColorMap: any = {
    orange: "bg-orange-600 hover:bg-orange-700 shadow-orange-200",
    red: "bg-red-600 hover:bg-red-700 shadow-red-200",
    blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
    purple: "bg-purple-600 hover:bg-purple-700 shadow-purple-200",
    green: "bg-green-600 hover:bg-green-700 shadow-green-100",
  };
  return (
    <Card className="hover:shadow-2xl transition-all shadow-md group border-2 border-transparent bg-white rounded-3xl overflow-hidden scale-100 hover:scale-[1.02]">
      <CardHeader className="p-8">
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform border-2 shadow-sm", colorMap[color])}>
          <Icon className="w-8 h-8" />
        </div>
        <CardTitle className="font-black text-2xl text-gray-900 tracking-tighter uppercase leading-none mb-2">{title}</CardTitle>
        <CardDescription className="font-bold text-gray-500 lowercase tracking-tight leading-relaxed">{desc}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between items-center border-t py-6 px-8 bg-gray-50/50">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest opacity-60">Tech Service Fee</span>
          <span className="text-2xl font-black text-blue-600 tracking-tighter">{cost} <span className="text-xs uppercase ml-0.5">Credits</span></span>
        </div>
        <Button variant="default" size="lg" className={cn("font-black h-12 px-8 rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer uppercase text-xs tracking-widest", btnColorMap[color])} onClick={onClick} disabled={disabled}>Run Script</Button>
      </CardFooter>
    </Card>
  );
}
