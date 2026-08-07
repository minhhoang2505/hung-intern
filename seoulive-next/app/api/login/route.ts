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

    // Tạo response trả về Client
    const response = NextResponse.json({ success: true, user: data.user_display_name });

    // Set HttpOnly Cookie chứa JWT
    response.cookies.set("token", data.token, {
      httpOnly: true,       
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}