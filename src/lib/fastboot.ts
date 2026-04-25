/**
 * Basic Fastboot Protocol Implementation over WebUSB
 * Ref: https://android.googlesource.com/platform/system/core/+/master/fastboot/README.md
 */

export class FastbootDevice {
  private device: USBDevice;
  private endpointIn: number = 0;
  private endpointOut: number = 0;

  constructor(device: USBDevice) {
    this.device = device;
  }

  async init() {
    if (!this.device.opened) {
      await this.device.open();
    }

    const configuration = this.device.configuration;
    if (!configuration) throw new Error("No USB configuration found");

    // Find Fastboot interface (Class: 0xff, Subclass: 0x42, Protocol: 0x03)
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

    // Find endpoints
    for (const endpoint of fbAlternate.endpoints) {
      if (endpoint.direction === "in") this.endpointIn = endpoint.endpointNumber;
      if (endpoint.direction === "out") this.endpointOut = endpoint.endpointNumber;
    }

    if (this.endpointIn === 0 || this.endpointOut === 0) {
      throw new Error("Endpoints not found");
    }
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
    
    // Fastboot responses: OKAY, FAIL, DATA, INFO
    if (response.startsWith("INFO")) {
      console.log("Fastboot INFO:", response.substring(4));
      return await this.readResponse(); // Read next packet
    }
    
    return response;
  }

  async getVariable(variable: string): Promise<string> {
    const resp = await this.sendCommand(`getvar:${variable}`);
    if (resp.startsWith("OKAY")) {
      return resp.substring(4);
    }
    return "Unknown";
  }

  async reboot() {
    return await this.sendCommand("reboot");
  }

  async close() {
    await this.device.close();
  }
}
