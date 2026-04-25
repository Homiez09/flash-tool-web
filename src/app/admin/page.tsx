"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Users, 
  Settings, 
  ShieldCheck, 
  CreditCard, 
  Zap, 
  Unlock, 
  Key, 
  Smartphone, 
  History,
  LayoutDashboard,
  Search,
  Plus,
  Minus,
  RefreshCw,
  ToggleLeft as Toggle,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    } else if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchUsers();
      fetchConfig();
    }
  }, [status, session]);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  };

  const fetchConfig = async () => {
    const res = await fetch("/api/admin/config");
    if (res.ok) setConfig(await res.json());
  };

  const handleAdjustCredits = async (userId: string, amount: number, type: "ADD" | "USE") => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount, type, description: "Admin manual adjustment" }),
    });
    if (res.ok) {
      toast.success("Credits adjusted");
      fetchUsers();
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      toast.success("System configuration saved");
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading" || !session || session.user.role !== "ADMIN") {
    return <div className="flex items-center justify-center min-h-screen">Loading Admin Panel...</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans tracking-tight">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col p-6 space-y-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="font-black text-xl uppercase italic">Flash <span className="text-blue-500">Admin</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab("users")} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer", activeTab === "users" ? "bg-white/10 text-white shadow-xl" : "text-gray-400 hover:text-white hover:bg-white/5")}>
            <Users className="w-4 h-4" /> User Management
          </button>
          <button onClick={() => setActiveTab("config")} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer", activeTab === "config" ? "bg-white/10 text-white shadow-xl" : "text-gray-400 hover:text-white hover:bg-white/5")}>
            <Settings className="w-4 h-4" /> System Config
          </button>
        </nav>

        <Button variant="ghost" className="justify-start text-gray-400 hover:text-white uppercase text-[10px] font-black cursor-pointer" onClick={() => router.push("/dashboard")}>
          <LayoutDashboard className="w-4 h-4 mr-2" /> Back to App
        </Button>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-10">
          <header className="flex justify-between items-center">
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
              {activeTab === "users" ? "User Management" : "System Configuration"}
            </h1>
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border font-black text-xs uppercase tracking-widest text-slate-500">
               Role: Super Admin
            </div>
          </header>

          {activeTab === "users" && (
            <div className="space-y-6">
               <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="Search users by name or email..." 
                    className="h-14 pl-12 rounded-2xl border-none shadow-md bg-white font-bold"
                  />
               </div>

               <Card className="rounded-[2rem] overflow-hidden border-none shadow-2xl bg-white">
                  <CardContent className="p-0">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b">
                           <tr>
                              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">User</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Role</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Credits</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {filteredUsers.map((u) => (
                             <tr key={u.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="px-8 py-6">
                                   <p className="font-black text-slate-900 text-sm">{u.name}</p>
                                   <p className="text-xs text-slate-400 font-bold">{u.email}</p>
                                </td>
                                <td className="px-8 py-6">
                                   <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-2 ring-inset", u.role === "ADMIN" ? "bg-purple-50 text-purple-700 ring-purple-100" : "bg-blue-50 text-blue-700 ring-blue-100")}>
                                      {u.role}
                                   </span>
                                </td>
                                <td className="px-8 py-6 font-black text-slate-900">{u.credits.toLocaleString()}</td>
                                <td className="px-8 py-6 text-right space-x-2">
                                   <Button onClick={() => handleAdjustCredits(u.id, 100, "ADD")} size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg bg-green-50 text-green-600 border-green-100 cursor-pointer">
                                      <Plus className="w-4 h-4" />
                                   </Button>
                                   <Button onClick={() => handleAdjustCredits(u.id, 100, "USE")} size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg bg-red-50 text-red-600 border-red-100 cursor-pointer">
                                      <Minus className="w-4 h-4" />
                                   </Button>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </CardContent>
               </Card>
            </div>
          )}

          {activeTab === "config" && config && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <Card className="rounded-[2rem] border-none shadow-2xl bg-white overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b p-8">
                     <CardTitle className="text-xl font-black uppercase text-slate-900 tracking-tight">Feature Flags</CardTitle>
                     <CardDescription className="font-bold text-slate-400 lowercase italic">Toggle global feature availability</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-4">
                     {Object.keys(config.features).map((key) => (
                       <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="font-black text-slate-700 uppercase text-xs tracking-widest">{key} Engine</span>
                          <button 
                            onClick={() => setConfig({...config, features: { ...config.features, [key]: !config.features[key] }})}
                            className={cn("w-12 h-6 rounded-full relative transition-all cursor-pointer", config.features[key] ? "bg-green-500" : "bg-slate-300")}
                          >
                             <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", config.features[key] ? "left-7" : "left-1")} />
                          </button>
                       </div>
                     ))}
                  </CardContent>
                  <CardFooter className="p-8 bg-slate-50 border-t">
                     <Button onClick={saveConfig} disabled={loading} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 font-black text-lg gap-3 uppercase cursor-pointer">
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Changes
                     </Button>
                  </CardFooter>
               </Card>

               <Card className="rounded-[2rem] border-none shadow-2xl bg-white overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b p-8">
                     <CardTitle className="text-xl font-black uppercase text-slate-900 tracking-tight">Pricing Engine</CardTitle>
                     <CardDescription className="font-bold text-slate-400 lowercase italic">Set credit cost per operation</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                     {Object.keys(config.prices).map((key) => (
                       <div key={key} className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{key} Cost</label>
                          <div className="relative">
                             <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                             <Input 
                                type="number" 
                                value={config.prices[key]} 
                                onChange={(e) => setConfig({...config, prices: { ...config.prices, [key]: parseInt(e.target.value) || 0 }})}
                                className="h-12 pl-12 rounded-xl border-2 border-slate-100 font-black text-slate-900"
                             />
                          </div>
                       </div>
                     ))}
                  </CardContent>
               </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
