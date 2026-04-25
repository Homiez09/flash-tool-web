/**
 * Simple TAR Parser for Browser
 * This is used to unpack Samsung .tar and .tar.md5 firmware files.
 */

export interface TarFile {
  name: string;
  size: number;
  data: ArrayBuffer;
}

export class TarParser {
  static async parse(buffer: ArrayBuffer): Promise<TarFile[]> {
    const files: TarFile[] = [];
    let offset = 0;

    while (offset < buffer.byteLength - 512) {
      const header = new Uint8Array(buffer, offset, 512);
      
      // Check if header is empty (end of archive)
      if (header[0] === 0) break;

      // Extract filename (first 100 bytes)
      let name = "";
      for (let i = 0; i < 100; i++) {
        if (header[i] === 0) break;
        name += String.fromCharCode(header[i]);
      }

      // Extract size (octal string at offset 124, 12 bytes)
      let sizeStr = "";
      for (let i = 124; i < 136; i++) {
        if (header[i] === 0 || header[i] === 32) break;
        sizeStr += String.fromCharCode(header[i]);
      }
      const size = parseInt(sizeStr, 8);

      if (isNaN(size)) break;

      // Extract data
      const fileData = buffer.slice(offset + 512, offset + 512 + size);
      files.push({ name, size, data: fileData });

      // Move to next header (padded to 512 bytes blocks)
      offset += 512 + Math.ceil(size / 512) * 512;
    }

    return files;
  }
}
