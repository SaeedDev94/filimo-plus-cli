import { Interface, createInterface } from 'readline';

export class ReadlineService {

  static question(question: string, options?: string[]): Promise<string> {
    const resolver = (resolve: (value: string) => void) => {
      let label = `${question}\n`;
      if (options?.length) {
        options.forEach((option: string, index: number) => label += `${index + 1}) ${option}\n`);
      }

      const readline: Interface = createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question(label, (answer: string) => {
        readline.close();
        resolve(answer.trim());
      });
    };

    return new Promise<string>(resolver);
  }

}
