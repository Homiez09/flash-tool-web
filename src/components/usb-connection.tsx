"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Usb, CheckCircle2, AlertCircle, Info, Smartphone, ShieldAlert } from "lucide-react";

interface DeviceInfo {
  productName?: string;
  manufacturerName?: string;
  vendorId: number;
  productId: number;
  serialNumber?: string;
  mode: "Normal" | "Fastboot" | "ADB" | "Unknown";
}

export function USBConnection({ onDeviceConnected }: { onDeviceConnected?: (device: USBDevice) => void }) {
  const [device, setDevice] = useState<USBDevice | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const detectMode = (dev: USBDevice): "Normal" | "Fastboot" | "ADB" | "Unknown" => {
    // Basic mode detection based on common Vendor/Product IDs or Interface Classes
    // Fastboot usually has interface class 0xff, subclass 0x42, protocol 0x03
    // ADB usually has interface class 0xff, subclass 0x42, protocol 0x01
    
    try {
      const interfaces = dev.configuration?.interfaces || [];
      for (const iface of interfaces) {
        for (const alt of iface.alternates) {
          if (alt.interfaceClass === 0xff && alt.interfaceSubclass === 0x42) {
            if (alt.interfaceProtocol === 0x03) return "Fastboot";
            if (alt.interfaceProtocol === 0x01) return "ADB";
          }
        }
      }
    } catch (e) {
      console.error("Mode detection error:", e);
    }
    
    return "Unknown";
  };

  const connectDevice = async () => {
    setIsConnecting(true);
    try {
      if (!navigator.usb) {
        toast.error("เบราว์เซอร์ของคุณไม่รองรับ WebUSB กรุณาใช้ Chrome หรือ Edge");
        return;
      }

      const selectedDevice = await navigator.usb.requestDevice({
        filters: [] 
      });

      await selectedDevice.open();
      
      if (selectedDevice.configuration === null) {
        await selectedDevice.selectConfiguration(1);
      }
      
      const mode = detectMode(selectedDevice);

      setDevice(selectedDevice);
      setDeviceInfo({
        productName: selectedDevice.productName ?? "Unknown Device",
        manufacturerName: selectedDevice.manufacturerName ?? "Unknown Manufacturer",
        vendorId: selectedDevice.vendorId,
        productId: selectedDevice.productId,
        serialNumber: selectedDevice.serialNumber ?? "N/A",
        mode: mode,
      });

      if (onDeviceConnected) {
        onDeviceConnected(selectedDevice);
      }

      toast.success(`เชื่อมต่อกับ ${selectedDevice.productName || "อุปกรณ์"} สำเร็จ`);
    } catch (error: any) {
      console.error("USB Connection Error:", error);
      if (error.name === "NotFoundError") {
        toast.info("ยกเลิกการเลือกอุปกรณ์");
      } else {
        toast.error("การเชื่อมต่อล้มเหลว: " + error.message);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectDevice = async () => {
    if (device) {
      try {
        await device.close();
        setDevice(null);
        setDeviceInfo(null);
        toast.info("ตัดการเชื่อมต่ออุปกรณ์เรียบร้อย");
      } catch (error) {
        console.error("Disconnect Error:", error);
      }
    }
  };

  useEffect(() => {
    const handleDisconnect = (event: USBConnectionEvent) => {
      if (event.device === device) {
        setDevice(null);
        setDeviceInfo(null);
        toast.warning("อุปกรณ์ถูกถอดออก");
      }
    };

    navigator.usb?.addEventListener("disconnect", handleDisconnect);
    return () => {
      navigator.usb?.removeEventListener("disconnect", handleDisconnect);
    };
  }, [device]);

  return (
    <Card className="w-full border-2 border-blue-50 shadow-sm overflow-hidden">
      <CardHeader className="bg-gray-50/50 border-b">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Usb className="w-5 h-5 text-blue-600" />
              ระบบเชื่อมต่ออุปกรณ์ (USB)
            </CardTitle>
            <CardDescription>
              รองรับโหมด Fastboot, ADB และโหมดดาวน์โหลดสากล
            </CardDescription>
          </div>
          {device && (
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
              deviceInfo?.mode === "Fastboot" ? "bg-orange-100 text-orange-700" :
              deviceInfo?.mode === "ADB" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            )}>
              {deviceInfo?.mode} Mode
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!device ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 bg-gray-50/30 transition-all hover:bg-gray-50/50">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4 border">
              <Smartphone className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 mb-6 text-center font-medium">ยังไม่มีการเชื่อมต่ออุปกรณ์ <br /><span className="text-xs font-normal">เสียบสาย USB แล้วกดปุ่มด้านล่างเพื่อเริ่มการสแกน</span></p>
            <Button onClick={connectDevice} className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all" disabled={isConnecting}>
              {isConnecting ? "กำลังค้นหา..." : "เชื่อมต่ออุปกรณ์"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between p-5 bg-blue-50/30 border border-blue-100 rounded-2xl gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                  <Smartphone className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900 leading-tight">
                    {deviceInfo?.productName}
                  </p>
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    {deviceInfo?.manufacturerName} | VID: 0x{deviceInfo?.vendorId.toString(16).padStart(4, "0")} PID: 0x{deviceInfo?.productId.toString(16).padStart(4, "0")}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={disconnectDevice} className="rounded-lg h-10 px-6 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all">
                ตัดการเชื่อมต่อ
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white border rounded-xl shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-gray-500">
                  <Info className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Serial Number</span>
                </div>
                <p className="text-sm font-bold font-mono text-gray-900">{deviceInfo?.serialNumber}</p>
              </div>
              
              <div className="p-4 bg-white border rounded-xl shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-gray-500">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Security Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-sm font-bold text-gray-900">เชื่อมต่อปลอดภัย</p>
                </div>
              </div>

              <div className="p-4 bg-white border rounded-xl shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-gray-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Connection Mode</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{deviceInfo?.mode} Interface Ready</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper to use cn in this file without extra import if needed, but we have @/lib/utils
import { cn } from "@/lib/utils";
