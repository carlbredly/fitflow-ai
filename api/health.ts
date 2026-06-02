import { sendSuccess } from "./_lib/errors";

export default function handler(_req: any, res: any) {
  sendSuccess(res, { status: "ok" });
}
