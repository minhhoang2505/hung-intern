import { cookies } from "next/headers";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default async function Header() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  return (
    <header className="flex justify-between items-center p-4 border-b">
      <Link href="/" className="font-bold">Seoulive</Link>
      <div className="flex gap-3 items-center">
        {token ? (
          <>
            <Link href="/profile">Chào mừng!</Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login">Đăng nhập</Link>
            <Link href="/register">Đăng ký</Link>
          </>
        )}
      </div>
    </header>
  );
}