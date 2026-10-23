import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

export async function GET() {
  return new Response(
    await readFile(
      path.join(process.cwd(), "public/prep-ui/index.html"),
      "utf8",
    ),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );
}
