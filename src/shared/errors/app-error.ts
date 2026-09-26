export type ErrorDetails = Record<string, unknown> | null;

// Only pass explicitly public messages/details to this error.
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400,
    public readonly details: ErrorDetails = null,
  ) {
    super(message);
    this.name = "AppError";
  }
}
