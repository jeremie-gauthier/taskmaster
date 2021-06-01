export default abstract class Command {
  protected flags: {
    all: boolean;
  };

  constructor() {
    this.flags = { all: false };
  }

  abstract parseArgs(): void;
  abstract exec(): string;
  abstract usage(): string;
}
