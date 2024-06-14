import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ClientService } from '../Client/ClientService';

export class AuthService {

  constructor(absolutePath: string, file?: string) {
    this.tokenFilePath = file ? file : join(absolutePath, 'token');
  }

  private readonly tokenFilePath: string;

  async getUserName(): Promise<string | undefined> {
    const clientService = new ClientService(this);
    const data = await clientService.sendRequest(`https://api.filimo.com/api/fa/v1/web/config/uxEvent`);
    const res = JSON.parse(data.responseBody.toString());
    const user = res.data.user ?? {};
    const profile = user['selectedProfile'];
    return profile?.name;
  }

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
        return 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
      case 'win32':
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
      default:
        return 'filimo-plus-cli';
    }
  }

}
