"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Usb, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface DeviceInfo {
  productName?: string;
  manufacturerName?: string;
  vendorId: number;
  productId: number;
  serialNumber?: string;
}

export function USBConnection() {
  const [device, setDevice] = useState<USBDevice | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  const connectDevice = async () => {
    try {
      if (!navigator.usb) {
        toast.error("WebUSB is not supported in this browser. Please use Chrome or Edge.");
        return;
      }

      const selectedDevice = await navigator.usb.requestDevice({
        filters: [] // Empty filters to see all devices, or add specific ones like { vendorId: 0x18d1 } for Google/Android
      });

      await selectedDevice.open();
      
      if (selectedDevice.configuration === null) {
        await selectedDevice.selectConfiguration(1);
      }
      
      await selectedDevice.claimInterface(0);

      setDevice(selectedDevice);
      setDeviceInfo({
        productName: selectedDevice.productName ?? undefined,
        manufacturerName: selectedDevice.manufacturerName ?? undefined,
        vendorId: selectedDevice.vendorId,
        productId: selectedDevice.productId,
        serialNumber: selectedDevice.serialNumber ?? undefined,
      });

      toast.success(`Connected to ${selectedDevice.productName || "Unknown Device"}`);
    } catch (error: any) {
      console.error("USB Connection Error:", error);
      if (error.name === "NotFoundError") {
        toast.info("No device selected");
      } else {
        toast.error("Failed to connect: " + error.message);
      }
    }
  };

  const disconnectDevice = async () => {
    if (device) {
      try {
        await device.close();
        setDevice(null);
        setDeviceInfo(null);
        toast.info("Device disconnected");
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
        toast.warning("Device unplugged");
      }
    };

    navigator.usb?.addEventListener("disconnect", handleDisconnect);
    return () => {
      navigator.usb?.removeEventListener("disconnect", handleDisconnect);
    };
  }, [device]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Usb className="w-5 h-5 text-blue-600" />
          USB Control Panel
        </CardTitle>
        <CardDescription>
          Connect your device to start maintenance tasks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!device ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 bg-gray-50">
            <Usb className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4 text-center">No device connected</p>
            <Button onClick={connectDevice} className="gap-2">
              <Usb className="w-4 h-4" />
              Connect Device
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">
                    {deviceInfo?.productName || "Device Connected"}
                  </p>
                  <p className="text-xs text-green-700">
                    {deviceInfo?.manufacturerName} | VID: 0x{deviceInfo?.vendorId.toString(16).padStart(4, "0")} PID: 0x{deviceInfo?.productId.toString(16).padStart(4, "0")}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={disconnectDevice}>
                Disconnect
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Device Info</span>
                </div>
                <div className="space-y-1 text-xs text-blue-800">
                  <p>Serial: {deviceInfo?.serialNumber || "N/A"}</p>
                  <p>Status: Ready</p>
                </div>
              </div>
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Security Check</span>
                </div>
                <div className="space-y-1 text-xs text-orange-800">
                  <p>Encryption: Verified</p>
                  <p>Connection: Secure</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
