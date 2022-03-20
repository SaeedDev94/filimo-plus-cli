import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { absolutePath } from '../FilimoPlusCli';

export class AuthService {

  constructor() {
    this.tokenFilePath = join(absolutePath, 'token');
  }

  private readonly tokenFilePath: string;

  saveToken(value: string): void {
    writeFileSync(this.tokenFilePath, value);
  }

  deleteToken(): void {
    if (existsSync(this.tokenFilePath)) rmSync(this.tokenFilePath);
  }

  getToken(): string | null {
    if (existsSync(this.tokenFilePath)) return readFileSync(this.tokenFilePath).toString().trim();
    return null;
  }

  getUserAgent(): string {
    switch (process.platform) {
      case 'linux':
        return 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36';
      case 'win32':
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36';
      default:
        return 'filimo-plus-cli';
    }
  }

}
