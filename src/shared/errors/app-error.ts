export type ErrorDetails = { fields: Record<string, string[]> } | null;

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
