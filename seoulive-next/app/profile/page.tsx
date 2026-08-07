import { cookies } from "next/headers";

interface WPUser {
  id: number;
  name: string;
  email?: string;
}

async function getCurrentUser(token: string): Promise<WPUser | null> {
  const res = await fetch("http://test1.local/wp-json/wp/v2/users/me?context=edit", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return <p className="p-6">Bạn chưa đăng nhập.</p>;
  }

  const user = await getCurrentUser(token);

  if (!user) {
    return <p className="p-6">Không lấy được thông tin, token có thể đã hết hạn.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Trang cá nhân</h1>
      <p><strong>Tên:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
    </div>
  );
}