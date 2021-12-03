import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

export class AuthService {

  constructor() {
    this.tokenFilePath = join(process.cwd(), 'token');
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
    return 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36';
  }

}
