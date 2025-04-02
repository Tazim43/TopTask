export default class ApiError extends Error {
  status: number;
  message: string;
  errors: Error[];
  success: boolean;

  constructor(
    status: number,
    message: string = "something went wrong",
    errors: Error[] = [],
    success: boolean = false
  ) {
    super(message);
    this.status = status;
    this.message = message;
    this.errors = errors;
    this.success = success;
  }
}
