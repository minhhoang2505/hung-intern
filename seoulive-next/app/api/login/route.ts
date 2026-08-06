import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Vui lòng nhập username và password" }, { status: 400 });
    }

    const res = await fetch("http://test1.local/wp-json/jwt-auth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.message || "Đăng nhập thất bại" }, { status: res.status });
    }

    // Đây chính là chỗ in token ra Terminal (Server) để chứng minh đăng nhập thành công
    console.log("=== JWT TOKEN NHẬN ĐƯỢC ===");
    console.log(data.token);
    console.log("============================");

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}