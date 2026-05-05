import type {CliChat} from './cli-chat';

const DROPDOWN_MAX = 6;

export class CliApp {
  private agent: CliChat;
  private resources: string[] = [];

  constructor(agent: CliChat) {
    this.agent = agent;
  }

  public async initialize(): Promise<void> {
    await this.refreshResources();
  }

  public async run(): Promise<void> {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    while (true) {
      const userInput = await this.readInput('> ');
      if (userInput === null) {
        process.stdout.write('\n');
        break;
      }
      if (!userInput.trim()) {
        continue;
      }
      const response = await this.agent.run(userInput);
      console.log(`\nResponse:\n${response}`);
    }

    process.stdin.setRawMode(false);
    process.stdin.pause();
  }

  private readInput(prompt: string): Promise<string | null> {
    return new Promise((resolve) => {
      let input = '';
      let dropdownActive = false;
      let dropdownIndex = 0;
      let dropdownItems: string[] = [];
      let atIndex = -1;

      const visibleItems = () => dropdownItems.slice(0, DROPDOWN_MAX);

      const render = () => {
        process.stdout.write(`\r\x1b[K${prompt}${input}`);
        const items = visibleItems();
        if (dropdownActive && items.length > 0) {
          for (let i = 0; i < items.length; i++) {
            const row = i === dropdownIndex
              ? `\x1b[44;97m ${items[i]} \x1b[0m`
              : `\x1b[2m ${items[i]} \x1b[0m`;
            process.stdout.write(`\r\n\x1b[K${row}`);
          }
          process.stdout.write(`\x1b[${items.length}A\r\x1b[${(prompt + input).length}C`);
        }
      };

      const clearDropdown = () => {
        const count = visibleItems().length;
        for (let i = 0; i < count; i++) process.stdout.write('\r\n\x1b[K');
        if (count > 0) process.stdout.write(`\x1b[${count}A`);
        dropdownActive = false;
        dropdownItems = [];
        dropdownIndex = 0;
        atIndex = -1;
      };

      const updateDropdown = (prefix: string) => {
        dropdownItems = this.resources.filter(r =>
          r.toLowerCase().startsWith(prefix.toLowerCase())
        );
        dropdownIndex = 0;
        dropdownActive = dropdownItems.length > 0;
      };

      const done = (value: string | null) => {
        process.stdin.removeListener('data', onData);
        resolve(value);
      };

      const onData = (key: string) => {
        // Ctrl+C
        if (key === '') {
          clearDropdown();
          process.stdout.write('\n');
          done(null);
          return;
        }

        // Enter
        if (key === '\r' || key === '\n') {
          if (dropdownActive && dropdownItems.length > 0) {
            const selected = dropdownItems[dropdownIndex]!;
            clearDropdown();
            input = input.slice(0, atIndex + 1) + selected;
            render();
          } else {
            clearDropdown();
            process.stdout.write('\n');
            done(input);
          }
          return;
        }

        // Escape
        if (key === '\x1b') {
          if (dropdownActive) { clearDropdown(); render(); }
          return;
        }

        // Arrow up
        if (key === '\x1b[A') {
          if (dropdownActive) {
            dropdownIndex = Math.max(0, dropdownIndex - 1);
            render();
          }
          return;
        }

        // Arrow down
        if (key === '\x1b[B') {
          if (dropdownActive) {
            dropdownIndex = Math.min(visibleItems().length - 1, dropdownIndex + 1);
            render();
          }
          return;
        }

        // Backspace
        if (key === '\x7f' || key === '\b') {
          if (input.length === 0) {
            return;
          }
          if (dropdownActive) {
            clearDropdown();
          }
          input = input.slice(0, -1);
          const lastAt = input.lastIndexOf('@');
          if (lastAt !== -1) {
            atIndex = lastAt;
            updateDropdown(input.slice(atIndex + 1));
          }
          render();
          return;
        }

        // Regular character
        if (dropdownActive) {
          clearDropdown();
        }
        input += key;

        if (key === '@') {
          atIndex = input.length - 1;
          updateDropdown('');
        } else if (atIndex !== -1 && input.lastIndexOf('@') === atIndex) {
          updateDropdown(input.slice(atIndex + 1));
        }

        render();
      };

      process.stdin.on('data', onData);
      render();
    });
  }

  private async refreshResources(): Promise<void> {
    try {
      this.resources = await this.agent.listDocIds();
    } catch (e) {
      console.error(`Error refreshing resources: ${e}`);
    }
  }
}
