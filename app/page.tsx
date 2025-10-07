import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  const hasSession = cookies().has("app_session");
  redirect(hasSession ? "/dashboard/shopee" : "/login");
}
