import { FastbootDevice } from "./fastboot";

export interface DeviceSpecs {
  chipset: "Qualcomm" | "MediaTek" | "Samsung" | "Unknown";
  product: string;
  secure: boolean;
  unlocked: boolean;
  version: string;
}

export class MaintenanceTools {
  private fb: FastbootDevice;

  constructor(device: USBDevice) {
    this.fb = new FastbootDevice(device);
  }

  async init() {
    await this.fb.init();
  }

  async getDeviceSpecs(): Promise<DeviceSpecs> {
    const product = await this.fb.getVariable("product");
    const secure = (await this.fb.getVariable("secure")) === "yes";
    const unlocked = (await this.fb.getVariable("unlocked")) === "yes";
    const version = await this.fb.getVariable("version-baseband");
    const cpu = await this.fb.getVariable("cpu");

    let chipset: DeviceSpecs["chipset"] = "Unknown";
    
    // Simple detection logic
    if (cpu.toLowerCase().includes("qcom") || cpu.toLowerCase().includes("msm") || cpu.toLowerCase().includes("sdm")) {
      chipset = "Qualcomm";
    } else if (cpu.toLowerCase().includes("mt") || cpu.toLowerCase().includes("mediatek")) {
      chipset = "MediaTek";
    } else if (product.toLowerCase().includes("samsung") || version.toLowerCase().includes("samsung")) {
      chipset = "Samsung";
    }

    return { chipset, product, secure, unlocked, version };
  }

  /**
   * Typical FRP Bypass for some devices involves erasing the config/frp partition
   */
  async bypassFRP(): Promise<{ success: boolean; message: string }> {
    try {
      const resp = await this.fb.sendCommand("erase:frp");
      if (resp.startsWith("OKAY")) return { success: true, message: "FRP Partition erased successfully" };
      
      const resp2 = await this.fb.sendCommand("erase:config");
      if (resp2.startsWith("OKAY")) return { success: true, message: "Config Partition erased successfully" };

      return { success: false, message: `Failed: ${resp}` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  /**
   * Unlock Bootloader (Standard Android Command)
   */
  async unlockBootloader(): Promise<{ success: boolean; message: string }> {
    try {
      const resp = await this.fb.sendCommand("flashing unlock");
      if (resp.startsWith("OKAY")) return { success: true, message: "Unlock request sent. Check device screen." };
      
      const resp2 = await this.fb.sendCommand("oem unlock");
      if (resp2.startsWith("OKAY")) return { success: true, message: "OEM Unlock request sent." };

      return { success: false, message: `Failed: ${resp}` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  /**
   * Fix Bootloop (Wipe Data/Cache)
   */
  async fixBootloop(): Promise<{ success: boolean; message: string }> {
    try {
      await this.fb.sendCommand("erase:cache");
      const resp = await this.fb.sendCommand("erase:userdata");
      if (resp.startsWith("OKAY")) {
        return { success: true, message: "Device wiped successfully. Bootloop should be fixed." };
      }
      return { success: false, message: `Failed: ${resp}` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  /**
   * Remove Demo Mode (Specific for some brands like Vivo/Oppo/Xiaomi)
   */
  async removeDemoMode(): Promise<{ success: boolean; message: string }> {
    try {
      // Common partitions where demo/config is stored
      await this.fb.sendCommand("erase:persist"); 
      const resp = await this.fb.sendCommand("erase:special_config");
      if (resp.startsWith("OKAY")) {
        return { success: true, message: "Demo mode config cleared." };
      }
      return { success: false, message: "Device not supported or command failed." };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  /**
   * Clean Cache & Dalvik
   */
  async cleanCache(): Promise<{ success: boolean; message: string }> {
    try {
      await this.fb.sendCommand("erase:cache");
      return { success: true, message: "Cache partitions cleaned." };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }
}
