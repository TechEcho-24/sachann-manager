import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { exportExpensesToCSV } from "@/actions/reports";
import { getMonthName } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const month = parseInt(searchParams.get("month") || "");
  const year = parseInt(searchParams.get("year") || "");

  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
    return new Response("Invalid month or year", { status: 400 });
  }

  try {
    const csv = await exportExpensesToCSV(month, year);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sachann-expenses-${getMonthName(month)}-${year}.csv"`,
      },
    });
  } catch {
    return new Response("Failed to generate CSV", { status: 500 });
  }
}
