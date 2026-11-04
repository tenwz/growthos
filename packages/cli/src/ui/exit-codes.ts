export const EXIT = {
  OK: 0,
  VALIDATION: 1,
  USAGE: 2,
  PROVIDER: 3,
  SCORE: 4,
} as const;

export type ExitCode = (typeof EXIT)[keyof typeof EXIT];

export class CliError extends Error {
  constructor(
    message: string,
    readonly code: ExitCode = EXIT.VALIDATION,
  ) {
    super(message);
    this.name = "CliError";
  }
}
