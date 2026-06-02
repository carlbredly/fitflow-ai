export function sendError(res: any, status: number, code: string, message: string, details?: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ success: false, error: code, message, ...(details ? { details } : {}) }));
}

export function sendSuccess(res: any, data: unknown, status = 200) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ success: true, data }));
}
