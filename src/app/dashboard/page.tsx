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
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionHistory {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
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
    }
  }, [status, router]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/user/history");
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data);
      }
    } catch (e) {
      console.error("Failed to fetch history");
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-200), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const exportLogs = () => {
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flash-tool-log-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("ส่งออกบันทึกการทำงานเรียบร้อย");
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
        fetchHistory();
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleFlash = async () => {
    if (!connectedUsbDevice) { toast.error("กรุณาเชื่อมต่ออุปกรณ์ก่อน"); return; }
    if (flashMethod === "file" && !flashFile) { toast.error("กรุณาเลือกไฟล์ก่อน"); return; }
    if (flashMethod === "url" && !flashUrl) { toast.error("กรุณาระบุ URL ก่อน"); return; }

    const cost = 5;
    if ((session?.user?.credits || 0) < cost) { toast.error("เครดิตไม่เพียงพอ"); return; }

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
        const totalSize = parseInt(response.headers.get("Content-Length") || "0", 10);
        const stream = response.body;
        if (!stream) throw new Error("Failed to get stream");
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
      fetchHistory();

    } catch (e: any) {
      addLog(`Flash Error: ${e.message}`);
      toast.error(`Flash Failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleMaintenance = async (action: "unlock" | "frp" | "bootloop" | "demo" | "cache", cost: number) => {
    if (!connectedUsbDevice) { toast.error("กรุณาเชื่อมต่ออุปกรณ์ก่อน"); return; }
    if ((session?.user?.credits || 0) < cost) { toast.error("เครดิตไม่เพียงพอ"); return; }
    
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
        fetchHistory();
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

  const menuItems = [
    { id: "dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
    { id: "flash", label: "Flash ROM", icon: Zap },
    { id: "oneclick", label: "เครื่องมือด่วน", icon: Smartphone },
    { id: "firmware", label: "ดาวน์โหลดรอม", icon: Download },
    { id: "history", label: "ประวัติการใช้งาน", icon: History },
    { id: "settings", label: "ตั้งค่า", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans tracking-tight">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r sticky top-0 h-screen shadow-sm">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight text-gray-900 uppercase">Flash Tool <span className="text-blue-600">Pro</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer",
                activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-100" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-white" : "text-gray-400")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t space-y-4">
          <div className="px-2 pb-2 text-center border-b border-gray-50 mb-2 opacity-40">
            <p className="text-[10px] uppercase font-black tracking-[0.2em] mb-1">Developed by</p>
            <a href="https://github.com/Homiez09" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase hover:text-blue-600 transition-colors">@Homiez09</a>
          </div>
          <div className="bg-gray-900 p-5 rounded-2xl border-none shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Balance</span>
              <CreditCard className="w-3 h-3 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-white uppercase tracking-tighter">{session?.user?.credits || 0} <span className="text-[10px] text-gray-500 ml-1">Credits</span></div>
            <Button size="sm" variant="outline" className="w-full mt-4 h-9 text-[10px] font-black uppercase tracking-widest gap-1.5 rounded-xl border-white/10 text-white hover:bg-white/5 cursor-pointer" onClick={handleTopUp} disabled={loading}>
              <PlusCircle className="w-3 h-3" /> Top Up
            </Button>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-3" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span className="font-black uppercase tracking-tight">Flash Tool Pro</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut()} className="cursor-pointer">
            <LogOut className="w-5 h-5 text-red-500" />
          </Button>
        </header>

        <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-10">
          {activeTab === "dashboard" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">ยินดีต้อนรับ, {session?.user?.name || "ช่างซ่อม"}</h1>
                  <p className="text-gray-500 font-bold text-sm lowercase tracking-tight opacity-70">Universal Phone Repair Utility v0.5.0 Alpha</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2.5 rounded-2xl shadow-sm border-2 border-green-50 flex items-center gap-3 pr-6">
                    <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <span className="text-xs font-black text-green-700 uppercase tracking-widest">Server: Online</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  <USBConnection onDeviceConnected={handleDeviceConnected} />
                  
                  {connectedUsbDevice && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-500">
                      <Card className="border-blue-100 bg-blue-50/20 shadow-xl shadow-blue-600/5 border-2 rounded-3xl overflow-hidden">
                        <CardHeader className="pb-3 px-8 pt-8">
                          <CardTitle className="text-[10px] flex items-center gap-2 text-blue-700 font-black uppercase tracking-[0.2em]">
                            <Activity className="w-4 h-4" /> Fast Actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3 px-8 pb-8">
                          <Button variant="outline" size="sm" className="gap-2 bg-white rounded-2xl h-12 px-6 font-black text-[10px] uppercase border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={() => handleMaintenance("unlock", 10)} disabled={isProcessing}><Unlock className="w-4 h-4" /> Unlock BL</Button>
                          <Button variant="outline" size="sm" className="gap-2 bg-white rounded-2xl h-12 px-6 font-black text-[10px] uppercase border-red-100 text-red-700 hover:bg-red-50 cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={() => handleMaintenance("frp", 20)} disabled={isProcessing}><Key className="w-4 h-4" /> Bypass FRP</Button>
                        </CardContent>
                      </Card>

                      <Card className="border-green-100 bg-green-50/20 shadow-xl shadow-green-600/5 border-2 rounded-3xl overflow-hidden">
                        <CardHeader className="pb-3 px-8 pt-8">
                          <CardTitle className="text-[10px] flex items-center gap-2 text-green-700 font-black uppercase tracking-[0.2em]">
                            <Cpu className="w-4 h-4" /> Hardware Info
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 space-y-3">
                           <div className="flex justify-between items-center bg-white/50 p-2.5 rounded-xl border border-green-100/50">
                              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Chipset</span>
                              <span className="text-xs font-black text-gray-900 uppercase">{deviceSpecs?.chipset || "Detecting..."}</span>
                           </div>
                           <div className="flex justify-between items-center bg-white/50 p-2.5 rounded-xl border border-green-100/50">
                              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Bootloader</span>
                              <span className={cn("text-xs font-black uppercase", deviceSpecs?.unlocked ? "text-green-600" : "text-red-600")}>
                                {deviceSpecs ? (deviceSpecs.unlocked ? "Unlocked" : "Locked") : "..."}
                              </span>
                           </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="hover:shadow-2xl transition-all cursor-pointer group border-2 border-transparent hover:border-blue-300 bg-white shadow-md rounded-3xl overflow-hidden" onClick={() => setActiveTab("flash")}>
                      <CardHeader className="p-8">
                        <Zap className="w-12 h-12 text-yellow-500 mb-4 group-hover:scale-110 transition-transform bg-yellow-50 p-3 rounded-2xl border border-yellow-100" />
                        <CardTitle className="font-black text-2xl text-gray-900 tracking-tight uppercase leading-none mb-2">Flash Engine</CardTitle>
                        <CardDescription className="font-bold text-gray-400 text-xs lowercase">High-speed firmware deployment from local or cloud.</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="hover:shadow-2xl transition-all cursor-pointer group border-2 border-transparent hover:border-blue-300 bg-white shadow-md rounded-3xl overflow-hidden" onClick={() => setActiveTab("oneclick")}>
                      <CardHeader className="p-8">
                        <Smartphone className="w-12 h-12 text-blue-500 mb-4 group-hover:scale-110 transition-transform bg-blue-50 p-3 rounded-2xl border border-blue-100" />
                        <CardTitle className="font-black text-2xl text-gray-900 tracking-tight uppercase leading-none mb-2">One-Click</CardTitle>
                        <CardDescription className="font-bold text-gray-400 text-xs lowercase">Automated maintenance scripts for technicians.</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                </div>

                <div className="space-y-10">
                   {/* Terminal Logs */}
                  <Card className="bg-gray-950 text-white border-none shadow-2xl overflow-hidden rounded-[2.5rem] ring-4 ring-white/5">
                    <CardHeader className="bg-gray-900/80 py-5 px-8 border-b border-white/5 flex flex-row items-center justify-between">
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500 flex items-center gap-2">
                        <Terminal className="w-3 h-3" /> Console
                      </CardTitle>
                      <div className="flex gap-2">
                         <button onClick={exportLogs} title="Export Log" className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-gray-400 hover:text-white">
                            <FileDown className="w-4 h-4" />
                         </button>
                         <button onClick={() => setLogs([])} title="Clear Log" className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-gray-400 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 h-80 overflow-y-auto font-mono text-[11px] space-y-2 bg-black/40 scrollbar-hide">
                      {logs.length === 0 && <p className="text-white/10 italic">// System ready for hardware interface...</p>}
                      {logs.map((log, i) => (
                        <p key={i} className={cn(
                          log.includes("Error") || log.includes("Failed") ? "text-red-400 bg-red-400/5 px-2 py-1 rounded" : 
                          log.includes("Success") ? "text-green-400 bg-green-400/5 px-2 py-1 rounded" : "text-blue-300"
                        )}>
                          <span className="text-white/10 mr-3 select-none">➜</span>{log}
                        </p>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-2 border-blue-50 shadow-xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-gray-50/50 p-8 border-b border-gray-100">
                      <CardTitle className="text-lg font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-600" />
                        Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 py-2">
                      {historyData.length === 0 ? (
                        <p className="p-8 text-center text-xs font-bold text-gray-300 uppercase italic">No recent activity</p>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {historyData.slice(0, 5).map((item) => (
                            <div key={item.id} className="flex items-center gap-4 px-8 py-5 hover:bg-gray-50/50 transition-colors">
                              <div className={cn("p-2 rounded-xl border-2", item.type === "ADD" ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600")}>
                                {item.type === "ADD" ? <PlusCircle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-gray-900 uppercase truncate">{item.description}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className={cn("text-xs font-black uppercase tracking-tighter", item.type === "ADD" ? "text-green-600" : "text-red-600")}>
                                {item.type === "ADD" ? "+" : "-"}{item.amount}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="bg-gray-50/30 py-5 px-8">
                      <Button variant="ghost" className="w-full text-[10px] font-black text-blue-600 hover:bg-blue-100/50 transition-all rounded-xl uppercase tracking-[0.2em] cursor-pointer" onClick={() => setActiveTab("history")}>View Full History</Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Full Activity Log</h2>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("dashboard")} className="font-bold rounded-2xl cursor-pointer h-12 px-8 uppercase text-xs tracking-widest">Back</Button>
               </div>

               <Card className="rounded-[2.5rem] border-2 border-gray-100 shadow-2xl overflow-hidden bg-white">
                  <CardContent className="p-0">
                    <table className="w-full text-left">
                      <thead className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] bg-gray-50/80 border-b">
                        <tr>
                          <th className="px-10 py-6">Date / Time</th>
                          <th className="px-10 py-6">Type</th>
                          <th className="px-10 py-6">Description</th>
                          <th className="px-10 py-6 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {historyData.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition-all group">
                            <td className="px-10 py-6 text-[11px] font-black text-gray-500 uppercase">{new Date(item.createdAt).toLocaleString()}</td>
                            <td className="px-10 py-6">
                              <span className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ring-2 ring-inset", item.type === "ADD" ? "bg-green-50 text-green-700 ring-green-100" : "bg-red-50 text-red-700 ring-red-100")}>
                                {item.type}
                              </span>
                            </td>
                            <td className="px-10 py-6 text-xs font-black text-gray-900 uppercase">{item.description}</td>
                            <td className={cn("px-10 py-6 text-right font-black text-sm uppercase tracking-tighter", item.type === "ADD" ? "text-green-600" : "text-red-600")}>
                              {item.type === "ADD" ? "+" : "-"}{item.amount} <span className="text-[10px] opacity-50 ml-1">Credits</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
               </Card>
            </div>
          )}

          {/* Flash Tab Remains v0.4.0 with styling refined */}
          {activeTab === "flash" && (
            <div className="space-y-8 animate-in fade-in duration-500">
               {/* ... (Refined Flash UI from previous versions) */}
               <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">Flash Engine <span className="text-blue-600 text-xs ml-4 tracking-[0.5em] opacity-40">v0.5.0</span></h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("dashboard")} className="font-bold rounded-2xl cursor-pointer px-8 h-12 uppercase text-[10px] tracking-widest">Home</Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <Card className="lg:col-span-2 border-2 border-blue-50 shadow-2xl shadow-blue-600/5 rounded-[2.5rem] overflow-hidden bg-white">
                  <CardHeader className="bg-gray-50/50 border-b p-8">
                    <div className="flex gap-4">
                       <button onClick={() => setFlashMethod("file")} className={cn("flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 border-4 transition-all cursor-pointer", flashMethod === "file" ? "bg-blue-600 text-white border-blue-600 shadow-2xl shadow-blue-600/20" : "bg-white text-gray-300 border-gray-50 hover:border-gray-200")}>
                          <UploadCloud className="w-5 h-5" /> Local File
                       </button>
                       <button onClick={() => setFlashMethod("url")} className={cn("flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 border-4 transition-all cursor-pointer", flashMethod === "url" ? "bg-blue-600 text-white border-blue-600 shadow-2xl shadow-blue-600/20" : "bg-white text-gray-300 border-gray-50 hover:border-gray-200")}>
                          <Globe className="w-5 h-5" /> Cloud Stream
                       </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 space-y-10">
                    {flashMethod === "file" ? (
                      <div onClick={() => fileInputRef.current?.click()} className={cn("border-4 border-dashed rounded-[2rem] p-20 flex flex-col items-center justify-center transition-all cursor-pointer group", flashFile ? "border-green-200 bg-green-50/20" : "border-gray-50 bg-gray-50/30 hover:border-blue-200 hover:bg-blue-50/20")}>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        {flashFile ? (
                          <>
                            <div className="bg-green-500 p-6 rounded-3xl mb-4 shadow-xl shadow-green-500/20"><Check className="w-10 h-10 text-white" /></div>
                            <p className="font-black text-gray-900 text-xl tracking-tighter">{flashFile.name}</p>
                            <p className="text-[10px] text-gray-400 font-black tracking-[0.3em] uppercase mt-2">{(flashFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </>
                        ) : (
                          <>
                            <div className="bg-blue-600 p-6 rounded-3xl mb-6 shadow-xl shadow-blue-600/20 group-hover:scale-110 transition-transform"><UploadCloud className="w-10 h-10 text-white" /></div>
                            <p className="font-black text-gray-900 text-2xl tracking-tighter uppercase">Select Firmware</p>
                            <p className="text-[10px] text-gray-400 font-black tracking-[0.2em] mt-2 uppercase opacity-60">Drag & Drop Binary Image</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6 p-10 bg-blue-600/5 border-4 border-dashed border-blue-600/10 rounded-[2.5rem] animate-in zoom-in-95 duration-500">
                         <div className="bg-blue-600 p-5 w-fit rounded-2xl mb-2 shadow-xl shadow-blue-600/20"><Globe className="w-8 h-8 text-white" /></div>
                         <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 ml-1">Direct Download Link</label>
                         <div className="relative">
                            <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 opacity-40" />
                            <Input value={flashUrl} onChange={(e) => setFlashUrl(e.target.value)} placeholder="https://cdn.example.com/v14_firmware.img" className="h-16 pl-14 rounded-2xl border-2 border-blue-100 bg-white focus:ring-8 focus:ring-blue-600/5 font-black text-gray-900 transition-all" />
                         </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Target Partition</label>
                        <select value={partition} onChange={(e) => setPartition(e.target.value)} className="w-full h-16 bg-white border-2 border-gray-100 rounded-2xl px-6 font-black text-xs uppercase tracking-widest outline-none transition-all cursor-pointer focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5">
                          <option value="boot">Boot Image</option>
                          <option value="recovery">Recovery</option>
                          <option value="system">System (Sparse)</option>
                          <option value="vendor">Vendor Image</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Estimated Cost</label>
                         <div className="h-16 bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 flex items-center justify-between">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            <span className="font-black text-gray-900 text-xl tracking-tighter">5.00 <span className="text-[10px] text-gray-400 ml-1 uppercase">Credits</span></span>
                         </div>
                      </div>
                    </div>

                    {progress && (
                      <div className="space-y-5 p-8 bg-gray-950 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-500 ring-4 ring-blue-600/20">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                             <div className="w-3 h-3 rounded-full bg-blue-600 animate-ping" />
                             {progress.phase}
                          </span>
                          <span className="text-2xl font-black text-white tracking-tighter">{(progress.bytesSent / progress.totalBytes * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden p-1">
                          <div className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 h-full rounded-full transition-all duration-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]" style={{ width: `${(progress.bytesSent / progress.totalBytes * 100)}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/5 p-3 rounded-xl">
                          <span>{((progress.bytesSent / (1024 * 1024)).toFixed(1))} MB SENT</span>
                          <span className="text-green-500">{(progress.speed / (1024 * 1024)).toFixed(2)} MB/s</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-gray-50/50 p-8 border-t flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm"><ShieldCheck className="w-5 h-5 text-green-600" /></div>
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kernel Protection Active</span>
                    </div>
                    <Button onClick={handleFlash} disabled={isProcessing || (!flashFile && !flashUrl) || !connectedUsbDevice} className="h-16 px-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all active:scale-95 font-black text-lg gap-4 cursor-pointer uppercase tracking-tight">
                      {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                      {isProcessing ? "Deploying..." : "Start Flash"}
                    </Button>
                  </CardFooter>
                </Card>

                <div className="space-y-10">
                   <Card className="bg-gray-950 text-white rounded-[2.5rem] overflow-hidden shadow-2xl ring-4 ring-white/5 border-none">
                      <CardHeader className="border-b border-white/5 py-6 px-8 bg-gray-900/80">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 flex items-center gap-3">
                           <Terminal className="w-4 h-4" /> Live Output
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-8 h-[550px] overflow-y-auto font-mono text-[11px] space-y-2 bg-black/40 scrollbar-hide">
                         {logs.map((log, i) => (
                           <p key={i} className={cn(log.includes("Error") ? "text-red-400 bg-red-400/5 px-2 py-1 rounded" : log.includes("Successful") ? "text-green-400 bg-green-400/5 px-2 py-1 rounded" : "text-blue-300")}><span className="text-white/10 mr-3 select-none">➜</span>{log}</p>
                         ))}
                      </CardContent>
                   </Card>
                </div>
              </div>
            </div>
          )}
          
          {/* One-Click Tab Refined */}
          {activeTab === "oneclick" && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Maintenance <span className="text-blue-600 text-xs ml-4 tracking-[0.5em] opacity-40">Scripts</span></h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("dashboard")} className="font-bold rounded-2xl cursor-pointer px-8 h-12 uppercase text-[10px] tracking-widest">Back</Button>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                  <MaintenanceCard title="Unlock Bootloader" desc="ปลดล็อกระบบเพื่อให้สามารถโมดิฟายตัวเครื่องได้ รองรับคำสั่งมาตรฐาน Fastboot" cost={10} icon={Unlock} color="orange" onClick={() => handleMaintenance("unlock", 10)} disabled={isProcessing} />
                  <MaintenanceCard title="Bypass FRP Lock" desc="ลบการติดล็อกบัญชี Google (FRP Lock) สำหรับรุ่นที่รองรับโหมด Fastboot Erase" cost={20} icon={Key} color="red" onClick={() => handleMaintenance("frp", 20)} disabled={isProcessing} />
                  <MaintenanceCard title="Fix Bootloop" desc="ล้างพาร์ทิชัน UserData และ Cache เพื่อแก้ไขอาการค้างโลโก้หรือบูทวน" cost={5} icon={RefreshCw} color="blue" onClick={() => handleMaintenance("bootloop", 5)} disabled={isProcessing} />
                  <MaintenanceCard title="Remove Demo Mode" desc="ปลดล็อกโหมดหน้าร้าน (Demo Mode) สำหรับ Vivo, Oppo และ Xiaomi" cost={30} icon={Eraser} color="purple" onClick={() => handleMaintenance("demo", 30)} disabled={isProcessing} />
                  <MaintenanceCard title="Clean Cache" desc="ล้างไฟล์ขยะในระบบ Dalvik/Cache เพื่อเพิ่มพื้นที่และความเร็ว" cost={2} icon={Eraser} color="green" onClick={() => handleMaintenance("cache", 2)} disabled={isProcessing} />
               </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-2xl mx-auto space-y-10 animate-in slide-in-from-bottom-6 duration-700 mt-20">
               <Card className="rounded-[3rem] border-4 border-red-50 bg-red-50/10 overflow-hidden shadow-2xl shadow-red-600/5">
                  <CardHeader className="p-12 text-center">
                     <div className="bg-red-500 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-500/40">
                        <ShieldCheck className="w-10 h-10 text-white" />
                     </div>
                     <CardTitle className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">Logout requested?</CardTitle>
                     <CardDescription className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Securely end your session and clear local cache</CardDescription>
                  </CardHeader>
                  <CardContent className="p-12 pt-0">
                     <Button variant="destructive" className="w-full h-16 rounded-2xl font-black text-lg uppercase tracking-tight gap-4 cursor-pointer shadow-2xl shadow-red-600/20 active:scale-95 transition-all" onClick={() => signOut()}>
                        <LogOut className="w-6 h-6" /> Terminate Session
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
    <Card className="hover:shadow-2xl transition-all shadow-md group border-2 border-transparent bg-white rounded-[2rem] overflow-hidden scale-100 hover:scale-[1.02]">
      <CardHeader className="p-8">
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform border-4 shadow-sm", colorMap[color])}>
          <Icon className="w-8 h-8" />
        </div>
        <CardTitle className="font-black text-2xl text-gray-900 tracking-tighter uppercase leading-none mb-3">{title}</CardTitle>
        <CardDescription className="font-bold text-gray-400 lowercase tracking-tight leading-relaxed text-xs">{desc}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between items-center border-t py-8 px-8 bg-gray-50/50">
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em] opacity-60 mb-1">Service Fee</span>
          <span className="text-2xl font-black text-blue-600 tracking-tighter">{cost} <span className="text-[10px] uppercase ml-1 opacity-50">Credits</span></span>
        </div>
        <Button variant="default" size="lg" className={cn("font-black h-14 px-10 rounded-2xl shadow-2xl transition-all active:scale-95 cursor-pointer uppercase text-[10px] tracking-widest", btnColorMap[color])} onClick={onClick} disabled={disabled}>Execute</Button>
      </CardFooter>
    </Card>
  );
}
