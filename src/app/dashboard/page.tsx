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
  Link as LinkIcon,
  FileDown,
  Trash2,
  LockKeyhole,
  Bug,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionHistory {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

interface Firmware {
  id: string;
  brand: string;
  model: string;
  version: string;
  region: string;
  size: string;
  url: string;
  type: string;
}

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [connectedUsbDevice, setConnectedUsbDevice] = useState<USBDevice | null>(null);
  const [deviceSpecs, setDeviceSpecs] = useState<DeviceSpecs | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [historyData, setHistoryData] = useState<TransactionHistory[]>([]);
  const [sysConfig, setSysConfig] = useState<any>(null);
  
  // Firmware State
  const [firmwares, setFirmwares] = useState<Firmware[]>([]);
  const [fwSearch, setFwSearch] = useState("");

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
    } else if (status === "authenticated") {
      fetchHistory();
      fetchSysConfig();
      fetchFirmware();
    }
  }, [status, router]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/user/history");
      if (res.ok) setHistoryData(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchSysConfig = async () => {
    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) setSysConfig(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchFirmware = async (query = "") => {
    try {
      const res = await fetch(`/api/firmware?q=${query}`);
      if (res.ok) setFirmwares(await res.json());
    } catch (e) { console.error(e); }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-200), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const exportLogs = () => {
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `log-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Log exported");
  };

  const handleDeviceConnected = async (dev: USBDevice) => {
    setConnectedUsbDevice(dev);
    addLog(`Device Connected: ${dev.productName}`);
    try {
      const tools = new MaintenanceTools(dev);
      await tools.init();
      const specs = await tools.getDeviceSpecs();
      setDeviceSpecs(specs);
      addLog(`Specs Detected: Chipset=${specs.chipset}, BL=${specs.unlocked ? "Unlocked" : "Locked"}`);
    } catch (e: any) { addLog(`Error: ${e.message}`); }
  };

  if (status === "loading" || !sysConfig) {
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
        toast.success("Top-up Success!");
        await update();
        fetchHistory();
      }
    } catch (error) { toast.error("Error"); } finally { setLoading(false); }
  };

  const handleFlash = async () => {
    if (!sysConfig.features.flash) { toast.error("Disabled"); return; }
    if (!connectedUsbDevice) { toast.error("Connect device"); return; }
    const cost = sysConfig.prices.flash;
    if ((session?.user?.credits || 0) < cost) { toast.error("Low credits"); return; }

    setIsProcessing(true);
    try {
      const fb = new FastbootDevice(connectedUsbDevice);
      await fb.init();
      if (flashMethod === "file" && flashFile) {
        const arrayBuffer = await flashFile.arrayBuffer();
        await fb.download(arrayBuffer, arrayBuffer.byteLength, (p) => setProgress(p));
      } else if (flashMethod === "url" && flashUrl) {
        const response = await fetch(flashUrl);
        const totalSize = parseInt(response.headers.get("Content-Length") || "0", 10);
        await fb.download(response.body!, totalSize, (p) => setProgress(p));
      }
      await fb.flash(partition);
      toast.success("Flash Success!");
      await fetch("/api/user/use-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cost, description: `Flash ${partition}` }),
      });
      await update();
      fetchHistory();
    } catch (e: any) { toast.error(e.message); } finally { setIsProcessing(false); setProgress(null); }
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
      toast.error(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoRoot = async () => {
    if (!sysConfig.features.root) { toast.error("ฟีเจอร์นี้ยังไม่เปิดใช้งาน"); return; }
    if (!connectedUsbDevice) { toast.error("กรุณาเชื่อมต่ออุปกรณ์ก่อน"); return; }
    if (!flashFile) { toast.error("กรุณาเลือกไฟล์ boot.img ต้นฉบับก่อน"); return; }

    const cost = sysConfig.prices.root;
    if ((session?.user?.credits || 0) < cost) { toast.error(`เครดิตไม่เพียงพอ (ต้องการ ${cost} Credits)`); return; }

    setIsProcessing(true);
    addLog("Starting Auto Magisk Root process...");

    try {
      const tools = new MaintenanceTools(connectedUsbDevice);
      await tools.init();

      addLog("Parsing boot image...");
      const bootImg = await flashFile.arrayBuffer();
      
      addLog("Applying Magisk patches...");
      const result = await tools.patchMagisk(bootImg);

      if (result.success && result.patchedBuffer) {
        addLog("Patch successful. Uploading patched image to device...");
        const fb = new FastbootDevice(connectedUsbDevice);
        await fb.init();
        await fb.download(result.patchedBuffer, result.patchedBuffer.byteLength, (p) => setProgress(p));
        
        addLog("Flashing patched boot image...");
        await fb.flash("boot");
        
        addLog("Rooting Operation Successful!");
        toast.success("Root สำเร็จแล้ว! เครื่องกำลังรีบูต...");
        await fb.reboot();

        await fetch("/api/user/use-credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: cost, description: "Auto Magisk Root" }),
        });
        await update();
        fetchHistory();
      } else {
        throw new Error(result.message);
      }
    } catch (e: any) {
      addLog(`Root Error: ${e.message}`);
      toast.error(e.message);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleMaintenance = async (action: string, cost: number) => {
    if (!sysConfig.features[action]) { toast.error("Disabled"); return; }
    if (!connectedUsbDevice) { toast.error("Connect device"); return; }
    if ((session?.user?.credits || 0) < cost) { toast.error("Low credits"); return; }
    setIsProcessing(true);
    try {
      const tools = new MaintenanceTools(connectedUsbDevice);
      await tools.init();
      let result: any;
      if (action === "unlock") result = await tools.unlockBootloader();
      else if (action === "frp") result = await tools.bypassFRP();
      else if (action === "bootloop") result = await tools.fixBootloop();
      else if (action === "demo") result = await tools.removeDemoMode();
      else if (action === "cache") result = await tools.cleanCache();

      if (result.success) {
        toast.success(result.message);
        await fetch("/api/user/use-credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: cost, description: `${action}` }),
        });
        await update();
        fetchHistory();
      } else { toast.error(result.message); }
    } catch (e: any) { toast.error(e.message); } finally { setIsProcessing(false); }
  };

  const menuItems = [
    { id: "dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
    { id: "flash", label: "Flash ROM", icon: Zap },
    { id: "oneclick", label: "เครื่องมือด่วน", icon: Smartphone },
    { id: "firmware", label: "คลังรอม", icon: Download },
    { id: "history", label: "ประวัติ", icon: History },
    { id: "settings", label: "ตั้งค่า", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans tracking-tight">
      <aside className="hidden md:flex w-64 flex-col bg-white border-r sticky top-0 h-screen shadow-sm">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100"><ShieldCheck className="w-6 h-6 text-white" /></div>
          <span className="font-black text-xl tracking-tight text-gray-900 uppercase leading-none">Flash Tool <span className="text-blue-600 font-black italic">Pro</span></span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={cn("w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer", activeTab === item.id ? "bg-blue-600 text-white shadow-xl" : "text-gray-400 hover:bg-gray-50 hover:text-gray-900")}>
              <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-white" : "text-gray-400")} />{item.label}
            </button>
          ))}
          {session?.user?.role === "ADMIN" && (
            <button onClick={() => router.push("/admin")} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-purple-500 hover:bg-purple-50 cursor-pointer mt-4 border border-dashed border-purple-100"><LockKeyhole className="w-4 h-4" /> Management</button>
          )}
        </nav>
        <div className="p-4 border-t border-gray-100 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance</span><CreditCard className="w-3 h-3 text-blue-500" /></div>
            <div className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{session?.user?.credits || 0} <span className="text-[10px] text-gray-400 ml-1">Credits</span></div>
            <Button size="sm" variant="outline" className="w-full mt-4 h-9 text-[10px] font-black uppercase tracking-widest rounded-xl border-gray-100 text-gray-600 hover:bg-gray-50 cursor-pointer" onClick={handleTopUp} disabled={loading}><PlusCircle className="w-3 h-3" /> Top Up</Button>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer" onClick={() => signOut()}><LogOut className="w-4 h-4 mr-3" /> Sign Out</Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-10">
          {activeTab === "dashboard" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-gray-900">
                <div className="space-y-1">
                  <h1 className="text-4xl font-black tracking-tighter uppercase leading-none italic">ยินดีต้อนรับ, {session?.user?.name || "ช่างซ่อม"}</h1>
                  <p className="text-gray-500 font-bold text-sm lowercase tracking-tight opacity-70">Universal Phone Repair Utility v0.8.0 Alpha</p>
                </div>
                <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-green-50 flex items-center gap-3 pr-6">
                   <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                   <span className="text-xs font-black text-green-700 uppercase tracking-widest">System: Live</span>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  <USBConnection onDeviceConnected={handleDeviceConnected} />
                  {connectedUsbDevice && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-500">
                      <Card className="border border-gray-100 bg-blue-50/20 shadow-sm shadow-blue-600/5 rounded-3xl overflow-hidden">
                        <CardHeader className="pb-3 px-8 pt-8"><CardTitle className="text-[10px] flex items-center gap-2 text-blue-700 font-black uppercase tracking-[0.2em]"><Activity className="w-4 h-4" /> Fast Actions</CardTitle></CardHeader>
                        <CardContent className="flex flex-wrap gap-3 px-8 pb-8">
                          <Button variant="outline" size="sm" className="gap-2 bg-white rounded-2xl h-12 px-6 font-black text-[10px] uppercase border-gray-100 cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={handleReboot} disabled={isProcessing}><RefreshCw className={cn("w-3 h-3", isProcessing && "animate-spin")} /> Reboot</Button>
                          <Button variant="outline" size="sm" className="gap-2 bg-white rounded-2xl h-12 px-6 font-black text-[10px] uppercase border-orange-100 text-orange-700 hover:bg-orange-50 cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={() => handleMaintenance("unlock", sysConfig.prices.unlock)} disabled={isProcessing || !sysConfig.features.unlock}><Unlock className="w-4 h-4" /> Unlock BL</Button>
                          <Button variant="outline" size="sm" className="gap-2 bg-white rounded-2xl h-12 px-6 font-black text-[10px] uppercase border-red-100 text-red-700 hover:bg-red-50 cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={() => handleMaintenance("frp", sysConfig.prices.frp)} disabled={isProcessing || !sysConfig.features.frp}><Key className="w-4 h-4" /> Bypass FRP</Button>
                        </CardContent>
                      </Card>
                      <Card className="border border-green-100 bg-green-50/20 shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="pb-3 px-8 pt-8"><CardTitle className="text-[10px] flex items-center gap-2 text-green-700 font-black uppercase tracking-[0.2em]"><Cpu className="w-4 h-4" /> Hardware Info</CardTitle></CardHeader>
                        <CardContent className="px-8 pb-8 space-y-3">
                           <div className="flex justify-between items-center bg-white/50 p-2.5 rounded-xl border border-green-100/50"><span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Chipset</span><span className="text-xs font-black text-gray-900 uppercase">{deviceSpecs?.chipset || "Detecting..."}</span></div>
                           <div className="flex justify-between items-center bg-white/50 p-2.5 rounded-xl border border-green-100/50"><span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Status</span><span className="text-xs font-black text-green-600 uppercase">Ready</span></div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className={cn("hover:shadow-2xl transition-all cursor-pointer group border border-gray-100 shadow-sm rounded-3xl overflow-hidden", !sysConfig.features.flash && "opacity-50 grayscale pointer-events-none")} onClick={() => setActiveTab("flash")}>
                      <CardHeader className="p-8"><Zap className="w-12 h-12 text-yellow-500 mb-4 group-hover:scale-110 transition-transform bg-yellow-50 p-3 rounded-2xl border border-yellow-100" /><CardTitle className="font-black text-2xl text-gray-900 uppercase">Flash ROM</CardTitle><CardDescription className="text-xs font-bold text-gray-400 lowercase italic">Universal flashing from local/cloud.</CardDescription></CardHeader>
                    </Card>
                    <Card className="hover:shadow-2xl transition-all cursor-pointer group border border-gray-100 shadow-sm rounded-3xl overflow-hidden" onClick={() => setActiveTab("oneclick")}>
                      <CardHeader className="p-8"><Smartphone className="w-12 h-12 text-blue-500 mb-4 group-hover:scale-110 transition-transform bg-blue-50 p-3 rounded-2xl border border-blue-100" /><CardTitle className="font-black text-2xl text-gray-900 uppercase leading-none">One-Click</CardTitle><CardDescription className="text-xs font-bold text-gray-400 lowercase mt-2 italic">Automated root & maintenance scripts.</CardDescription></CardHeader>
                    </Card>
                  </div>
                </div>
                <div className="space-y-10">
                  <Card className="bg-gray-950 text-white border-none shadow-2xl overflow-hidden rounded-[2.5rem] ring-4 ring-white/5">
                    <CardHeader className="bg-gray-900/80 py-5 px-8 border-b border-white/5 flex items-center justify-between text-gray-900"><CardTitle className="text-[10px] font-black uppercase text-green-500 flex items-center gap-2 tracking-[0.3em]"><Terminal className="w-3 h-3" /> Console</CardTitle>
                      <div className="flex gap-2"><button onClick={exportLogs} className="p-2 text-gray-500 hover:text-white cursor-pointer"><FileDown className="w-4 h-4" /></button><button onClick={() => setLogs([])} className="p-2 text-gray-500 hover:text-red-500 cursor-pointer"><Trash2 className="w-4 h-4" /></button></div>
                    </CardHeader>
                    <CardContent className="p-8 h-80 overflow-y-auto font-mono text-[11px] space-y-2 bg-black/40">{logs.map((log, i) => (<p key={i} className={cn(log.includes("Error") || log.includes("Failed") ? "text-red-400" : log.includes("Success") ? "text-green-400" : "text-blue-300")}><span className="text-white/10 mr-3">➜</span>{log}</p>))}</CardContent>
                  </Card>
                  <Card className="bg-white border border-gray-100 shadow-sm rounded-[2.5rem] overflow-hidden text-gray-900">
                    <CardHeader className="bg-gray-50/50 p-8 border-b border-gray-100"><CardTitle className="text-lg font-black uppercase flex items-center gap-2 tracking-tighter"><History className="w-5 h-5 text-blue-600" /> Activity</CardTitle></CardHeader>
                    <CardContent className="px-0 py-2">{historyData.slice(0, 5).map((item) => (<div key={item.id} className="flex items-center gap-4 px-8 py-5 hover:bg-gray-50/50 transition-colors"><div className={cn("p-2 rounded-xl border", item.type === "ADD" ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100")}>{item.type === "ADD" ? <PlusCircle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}</div><div className="flex-1 min-w-0"><p className="text-xs font-black text-gray-900 uppercase truncate">{item.description}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString()}</p></div><div className={cn("text-xs font-black", item.type === "ADD" ? "text-green-600" : "text-red-600")}>{item.type === "ADD" ? "+" : "-"}{item.amount}</div></div>))}</CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "flash" && (
             <div className="space-y-10 animate-in fade-in duration-500 text-gray-900">
               <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Flash Engine <span className="text-blue-600 text-xs ml-4 tracking-[0.5em] opacity-40">Pro v0.8.0</span></h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("dashboard")} className="font-bold rounded-2xl cursor-pointer h-12 px-8 uppercase text-xs">Back</Button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                   <CardHeader className="bg-gray-50/50 border-b p-8">
                    <div className="flex gap-4">
                       <button onClick={() => setFlashMethod("file")} className={cn("flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 border-4 transition-all cursor-pointer", flashMethod === "file" ? "bg-blue-600 text-white border-blue-600 shadow-xl" : "bg-white text-gray-300 border-gray-100")}><UploadCloud className="w-5 h-5" /> Local File</button>
                       <button onClick={() => setFlashMethod("url")} className={cn("flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 border-4 transition-all cursor-pointer", flashMethod === "url" ? "bg-blue-600 text-white border-blue-600 shadow-xl" : "bg-white text-gray-300 border-gray-100")}><Globe className="w-5 h-5" /> Cloud Stream</button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 space-y-10">
                     {flashMethod === "file" ? (
                        <div onClick={() => fileInputRef.current?.click()} className={cn("border-4 border-dashed rounded-[2rem] p-20 flex flex-col items-center justify-center transition-all cursor-pointer group", flashFile ? "border-green-200 bg-green-50/20" : "border-gray-50 bg-gray-50/30 hover:border-blue-200")}>
                           <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                           {flashFile ? <><div className="bg-green-500 p-6 rounded-3xl mb-4 shadow-xl"><Check className="w-10 h-10 text-white" /></div><p className="font-black text-gray-900 text-xl tracking-tighter">{flashFile.name}</p></> : <><div className="bg-blue-600 p-6 rounded-3xl mb-6 shadow-xl"><UploadCloud className="w-10 h-10 text-white" /></div><p className="font-black text-gray-900 text-2xl tracking-tighter uppercase">Select Firmware</p></>}
                        </div>
                     ) : (
                        <div className="space-y-6 p-10 bg-blue-600/5 border-4 border-dashed border-blue-600/10 rounded-[2.5rem]">
                           <div className="bg-blue-600 p-5 w-fit rounded-2xl mb-2 shadow-xl"><Globe className="w-8 h-8 text-white" /></div>
                           <label className="text-[10px] font-black uppercase text-blue-600 ml-1">Direct Download Link</label>
                           <Input value={flashUrl} onChange={(e) => setFlashUrl(e.target.value)} placeholder="https://cdn.example.com/v14_firmware.img" className="h-16 pl-6 rounded-2xl border border-blue-100 bg-white focus:ring-8 focus:ring-blue-600/5 font-black text-gray-900" />
                        </div>
                     )}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Partition</label>
                           <select value={partition} onChange={(e) => setPartition(e.target.value)} className="w-full h-16 bg-white border border-gray-100 rounded-2xl px-6 font-black text-xs uppercase outline-none transition-all cursor-pointer focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5"><option value="boot">Boot Partition</option><option value="recovery">Recovery</option><option value="system">System (Sparse)</option></select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Cost</label>
                           <div className="h-16 bg-gray-50 border border-gray-100 rounded-2xl px-6 flex items-center justify-between"><CreditCard className="w-5 h-5 text-blue-600" /><span className="font-black text-gray-900 text-xl tracking-tighter">{sysConfig.prices.flash}.00 <span className="text-[10px] text-gray-400 ml-1 uppercase">Credits</span></span></div>
                        </div>
                     </div>
                     {progress && (
                        <div className="space-y-5 p-8 bg-gray-950 rounded-[2rem] shadow-2xl ring-4 ring-blue-600/20">
                           <div className="flex items-center justify-between"><span className="flex items-center gap-3 text-[10px] font-black uppercase text-blue-400"><div className="w-3 h-3 rounded-full bg-blue-600 animate-ping" />{progress.phase}</span><span className="text-2xl font-black text-white tracking-tighter">{(progress.bytesSent / progress.totalBytes * 100).toFixed(1)}%</span></div>
                           <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden p-1"><div className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 h-full rounded-full transition-all duration-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]" style={{ width: `${(progress.bytesSent / progress.totalBytes * 100)}%` }} /></div>
                        </div>
                     )}
                  </CardContent>
                  <CardFooter className="bg-gray-50/50 p-8 border-t flex justify-between items-center"><div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-green-600" /><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Active</span></div><Button onClick={handleFlash} disabled={isProcessing || (!flashFile && !flashUrl) || !connectedUsbDevice || !sysConfig.features.flash} className="h-16 px-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-2xl transition-all active:scale-95 font-black text-lg gap-4 cursor-pointer uppercase">{isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}{isProcessing ? "Deploying..." : "Start Flash"}</Button></CardFooter>
                </Card>
                <div className="space-y-10"><Card className="bg-gray-950 text-white rounded-[2.5rem] overflow-hidden shadow-2xl ring-4 ring-white/5 border-none"><CardHeader className="border-b border-white/5 py-6 px-8 bg-gray-900/80"><CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 flex items-center gap-3"><Terminal className="w-4 h-4" /> Live Output</CardTitle></CardHeader><CardContent className="p-8 h-[550px] overflow-y-auto font-mono text-[11px] space-y-2 bg-black/40 scrollbar-hide">{logs.map((log, i) => (<p key={i} className={cn(log.includes("Error") ? "text-red-400 bg-red-400/5 px-2 py-1 rounded" : log.includes("Successful") ? "text-green-400 bg-green-400/5 px-2 py-1 rounded" : "text-blue-300")}><span className="text-white/10 mr-3 select-none">➜</span>{log}</p>))}</CardContent></Card></div>
              </div>
             </div>
          )}

          {activeTab === "firmware" && (
            <div className="space-y-10 animate-in fade-in duration-500 text-gray-900">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Firmware Catalog</h2>
                  <div className="relative w-full md:w-96">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <Input value={fwSearch} onChange={(e) => { setFwSearch(e.target.value); fetchFirmware(e.target.value); }} placeholder="Search model or brand..." className="h-12 pl-12 rounded-2xl border border-gray-100 bg-white font-bold" />
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {firmwares.length === 0 ? (
                    <p className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest italic">No matching firmware found</p>
                  ) : (
                    firmwares.map((fw) => (
                      <Card key={fw.id} className="hover:shadow-xl transition-all border border-gray-100 shadow-sm rounded-3xl overflow-hidden group bg-white">
                         <CardContent className="p-6 flex flex-col md:flex-row items-center gap-8">
                            <div className="bg-blue-50 p-5 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                               <Smartphone className="w-8 h-8" />
                            </div>
                            <div className="flex-1 space-y-1 text-center md:text-left">
                               <h3 className="font-black text-xl tracking-tighter uppercase leading-none">{fw.brand} {fw.model}</h3>
                               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Version: {fw.version} | Region: {fw.region}</p>
                            </div>
                            <div className="text-center md:text-right space-y-1">
                               <p className="text-lg font-black tracking-tighter uppercase">{fw.size}</p>
                               <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">{fw.type} Image</p>
                            </div>
                            <Button onClick={() => { setActiveTab("flash"); setFlashMethod("url"); setFlashUrl(fw.url); }} className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-blue-600 transition-all font-black text-xs uppercase tracking-widest gap-2 cursor-pointer">
                               Select <ChevronRight className="w-4 h-4" />
                            </Button>
                         </CardContent>
                      </Card>
                    ))
                  )}
               </div>
            </div>
          )}

          {activeTab === "oneclick" && (
            <div className="space-y-8 animate-in fade-in duration-500 text-gray-900">
               <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Maintenance Scripts</h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("dashboard")} className="font-bold rounded-2xl cursor-pointer px-8 h-12 uppercase text-xs">Back</Button>
              </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
                  <MaintenanceCard title="Unlock BL" desc="Standard Fastboot unlock command for modern Android devices." cost={sysConfig.prices.unlock} icon={Unlock} color="orange" onClick={() => handleMaintenance("unlock", sysConfig.prices.unlock)} disabled={isProcessing || !sysConfig.features.unlock} />
                  <MaintenanceCard title="FRP Lock" desc="Clear Factory Reset Protection partition for supported models." cost={sysConfig.prices.frp} icon={Key} color="red" onClick={() => handleMaintenance("frp", sysConfig.prices.frp)} disabled={isProcessing || !sysConfig.features.frp} />
                  <Card className={cn("hover:shadow-xl transition-all shadow-sm group border border-gray-100 bg-white rounded-3xl overflow-hidden scale-100 hover:scale-[1.01]", !sysConfig.features.root && "opacity-50 grayscale pointer-events-none")}>
                     <CardHeader className="p-6"><div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform border shadow-sm bg-green-50 border-green-100 text-green-600"><ShieldCheck className="w-6 h-6" /></div><CardTitle className="font-black text-lg tracking-tighter uppercase leading-none mb-2">Magisk Root</CardTitle><CardDescription className="font-bold text-slate-400 lowercase tracking-tight leading-relaxed text-[10px] line-clamp-1">{flashFile ? flashFile.name : "Select boot.img"}</CardDescription></CardHeader>
                     <CardContent className="px-6 pb-2 pt-0"><Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full border border-dashed border-gray-100 h-10 text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 rounded-xl cursor-pointer"><input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />{flashFile ? "Change Image" : "Choose Image"}</Button></CardContent>
                     <CardFooter className="flex justify-between items-center border-t py-4 px-6 bg-slate-50/30"><div className="flex flex-col text-gray-900"><span className="text-[8px] font-black uppercase text-slate-400 tracking-widest opacity-60">Fee</span><span className="text-lg font-black text-blue-600 tracking-tighter">{sysConfig.prices.root}.00 <span className="text-[9px] uppercase opacity-50">c</span></span></div><Button variant="default" size="sm" className="font-black h-10 px-6 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer uppercase text-[9px] tracking-widest bg-green-600 hover:bg-green-700" onClick={handleAutoRoot} disabled={isProcessing || !flashFile}>Run</Button></CardFooter>
                  </Card>
                  <MaintenanceCard title="Bootloop" desc="Wipe userdata and cache to resolve startup hangs." cost={sysConfig.prices.bootloop} icon={RefreshCw} color="blue" onClick={() => handleMaintenance("bootloop", sysConfig.prices.bootloop)} disabled={isProcessing || !sysConfig.features.bootloop} />
                  <MaintenanceCard title="Demo Mode" desc="Remove shop demo restriction for Vivo/Oppo/Xiaomi." cost={sysConfig.prices.demo} icon={Eraser} color="purple" onClick={() => handleMaintenance("demo", sysConfig.prices.demo)} disabled={isProcessing || !sysConfig.features.demo} />
                  <MaintenanceCard title="Clean" desc="Flush Dalvik-Cache and system temporary files." cost={sysConfig.prices.cache} icon={Eraser} color="green" onClick={() => handleMaintenance("cache", sysConfig.prices.cache)} disabled={isProcessing || !sysConfig.features.cache} />
               </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none italic">Full Activity Log</h2>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("dashboard")} className="font-bold rounded-[1.5rem] cursor-pointer h-12 px-8 uppercase text-[10px] tracking-widest border-slate-100">Back Home</Button>
               </div>
               <Card className="rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden bg-white"><CardContent className="p-0"><table className="w-full text-left"><thead className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] bg-slate-50 border-b border-slate-100 text-gray-900"><tr><th className="px-12 py-8">Date / Time</th><th className="px-12 py-8">Type</th><th className="px-12 py-8">Description</th><th className="px-12 py-8 text-right">Amount</th></tr></thead><tbody className="divide-y divide-slate-50">{historyData.map((item) => (<tr key={item.id} className="hover:bg-slate-50 transition-all"><td className="px-12 py-8 text-[11px] font-black text-slate-500 uppercase">{new Date(item.createdAt).toLocaleString()}</td><td className="px-12 py-8"><span className={cn("px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ring-2 ring-inset", item.type === "ADD" ? "bg-green-50 text-green-700 ring-green-100" : "bg-red-50 text-red-700 ring-red-100")}>{item.type}</span></td><td className="px-12 py-8 text-xs font-black text-slate-900 uppercase tracking-tight">{item.description}</td><td className={cn("px-12 py-8 text-right font-black text-base uppercase tracking-tighter", item.type === "ADD" ? "text-green-600" : "text-red-600")}>{item.type === "ADD" ? "+" : "-"}{item.amount} <span className="text-[10px] opacity-40 ml-1">c</span></td></tr>))}</tbody></table></CardContent></Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-2xl mx-auto space-y-10 animate-in slide-in-from-bottom-6 duration-700 mt-20">
               <Card className="rounded-[3rem] border-4 border-red-50 bg-red-50/10 overflow-hidden shadow-2xl shadow-red-600/5"><CardHeader className="p-12 text-center text-gray-900"><div className="bg-red-500 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-500/40"><ShieldCheck className="w-10 h-10 text-white" /></div><CardTitle className="text-3xl font-black uppercase tracking-tighter mb-2 italic">Terminate?</CardTitle><CardDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Securely end your active technician session</CardDescription></CardHeader><CardContent className="p-12 pt-0"><Button variant="destructive" className="w-full h-16 rounded-2xl font-black text-lg uppercase tracking-tight gap-4 cursor-pointer shadow-2xl shadow-red-600/20 active:scale-95 transition-all" onClick={() => signOut()}><LogOut className="w-6 h-6" /> Sign Out Now</Button></CardContent></Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MaintenanceCard({ title, desc, cost, icon: Icon, color, onClick, disabled }: any) {
  const colorMap: any = {
    orange: "bg-orange-50 border-orange-100 text-orange-600 shadow-orange-50/30",
    red: "bg-red-50 border-red-100 text-red-600 shadow-red-50/30",
    blue: "bg-blue-50 border-blue-100 text-blue-600 shadow-blue-50/30",
    purple: "bg-purple-50 border-purple-100 text-purple-600 shadow-purple-50/30",
    green: "bg-green-50 border-green-100 text-green-600 shadow-green-50/30",
  };
  const btnColorMap: any = {
    orange: "bg-orange-600 hover:bg-orange-700 shadow-orange-200",
    red: "bg-red-600 hover:bg-red-700 shadow-red-200",
    blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
    purple: "bg-purple-600 hover:bg-purple-700 shadow-purple-200",
    green: "bg-green-600 hover:bg-green-700 shadow-green-100",
  };
  return (
    <Card className={cn("hover:shadow-xl transition-all shadow-sm group border border-transparent bg-white rounded-3xl overflow-hidden scale-100 hover:scale-[1.01]", disabled && "opacity-50 grayscale pointer-events-none")}>
      <CardHeader className="p-6"><div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform border shadow-sm", colorMap[color])}><Icon className="w-6 h-6" /></div><CardTitle className="font-black text-lg text-slate-900 tracking-tight uppercase leading-none mb-2">{title}</CardTitle><CardDescription className="font-bold text-slate-400 lowercase tracking-tight leading-relaxed text-[10px] line-clamp-2">{desc}</CardDescription></CardHeader><CardFooter className="flex justify-between items-center border-t py-4 px-6 bg-slate-50/30 text-gray-900"><div className="flex flex-col"><span className="text-[8px] font-black uppercase text-slate-400 tracking-widest opacity-60">Fee</span><span className="text-lg font-black text-blue-600 tracking-tighter">{cost}.00 <span className="text-[9px] uppercase opacity-50">c</span></span></div><Button variant="default" size="sm" className={cn("font-black h-10 px-6 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer uppercase text-[9px] tracking-widest", btnColorMap[color])} onClick={onClick} disabled={disabled}>Run</Button></CardFooter>
    </Card>
  );
}
