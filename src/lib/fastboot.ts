/**
 * Advanced Fastboot Protocol Implementation over WebUSB
 * Ref: https://android.googlesource.com/platform/system/core/+/master/fastboot/README.md
 */

export interface FlashProgress {
  phase: string;
  bytesSent: number;
  totalBytes: number;
  speed: number; // Bytes per second
}

export class FastbootDevice {
  private device: USBDevice;
  private endpointIn: number = 0;
  private endpointOut: number = 0;
  private maxDownloadSize: number = 0;

  constructor(device: USBDevice) {
    this.device = device;
  }

  async init() {
    if (!this.device.opened) {
      await this.device.open();
    }

    const configuration = this.device.configuration;
    if (!configuration) throw new Error("No USB configuration found");

    let fbInterface: USBInterface | null = null;
    let fbAlternate: USBAlternateInterface | null = null;

    for (const iface of configuration.interfaces) {
      for (const alt of iface.alternates) {
        if (alt.interfaceClass === 0xff && alt.interfaceSubclass === 0x42 && alt.interfaceProtocol === 0x03) {
          fbInterface = iface;
          fbAlternate = alt;
          break;
        }
      }
      if (fbInterface) break;
    }

    if (!fbInterface || !fbAlternate) {
      throw new Error("Fastboot interface not found on this device");
    }

    await this.device.claimInterface(fbInterface.interfaceNumber);

    for (const endpoint of fbAlternate.endpoints) {
      if (endpoint.direction === "in") this.endpointIn = endpoint.endpointNumber;
      if (endpoint.direction === "out") this.endpointOut = endpoint.endpointNumber;
    }

    if (this.endpointIn === 0 || this.endpointOut === 0) {
      throw new Error("Endpoints not found");
    }

    // Get max download size for chunking
    const maxStr = await this.getVariable("max-download-size");
    this.maxDownloadSize = parseInt(maxStr, 16) || 64 * 1024 * 1024; // Default 64MB
  }

  async sendCommand(command: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(command);
    await this.device.transferOut(this.endpointOut, data);
    return await this.readResponse();
  }

  private async readResponse(): Promise<string> {
    const result = await this.device.transferIn(this.endpointIn, 64);
    if (!result.data) return "ERROR: No data";
    
    const decoder = new TextDecoder();
    const response = decoder.decode(result.data);
    
    if (response.startsWith("INFO")) {
      // In real scenario, we might want to pass this info to a callback
      return await this.readResponse(); 
    }
    
    return response;
  }

  async getVariable(variable: string): Promise<string> {
    const resp = await this.sendCommand(`getvar:${variable}`);
    if (resp.startsWith("OKAY")) {
      return resp.substring(4);
    }
    return "";
  }

  /**
   * Upload data to the device's RAM
   */
  async download(data: ArrayBuffer, onProgress?: (p: FlashProgress) => void): Promise<void> {
    const size = data.byteLength;
    const sizeHex = size.toString(16).padStart(8, '0');
    
    const resp = await this.sendCommand(`download:${sizeHex}`);
    if (!resp.startsWith("DATA")) {
      throw new Error(`Failed to initiate download: ${resp}`);
    }

    const startTime = Date.now();
    const chunkSize = 1024 * 1024; // 1MB chunks for transfer
    let bytesSent = 0;

    while (bytesSent < size) {
      const currentChunkSize = Math.min(chunkSize, size - bytesSent);
      const chunk = data.slice(bytesSent, bytesSent + currentChunkSize);
      
      await this.device.transferOut(this.endpointOut, chunk);
      bytesSent += currentChunkSize;

      if (onProgress) {
        const elapsed = (Date.now() - startTime) / 1000;
        onProgress({
          phase: "Downloading",
          bytesSent,
          totalBytes: size,
          speed: bytesSent / (elapsed || 0.1)
        });
      }
    }

    const finalResp = await this.readResponse();
    if (!finalResp.startsWith("OKAY")) {
      throw new Error(`Download failed in final response: ${finalResp}`);
    }
  }

  /**
   * Flash the downloaded data to a partition
   */
  async flash(partition: string): Promise<void> {
    const resp = await this.sendCommand(`flash:${partition}`);
    if (!resp.startsWith("OKAY")) {
      throw new Error(`Flash failed: ${resp}`);
    }
  }

  /**
   * Erase a partition
   */
  async erase(partition: string): Promise<void> {
    const resp = await this.sendCommand(`erase:${partition}`);
    if (!resp.startsWith("OKAY")) {
      throw new Error(`Erase failed: ${resp}`);
    }
  }

  async reboot() {
    return await this.sendCommand("reboot");
  }

  async close() {
    await this.device.close();
  }
}
