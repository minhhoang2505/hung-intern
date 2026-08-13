// app/api/quick-order/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Dữ liệu gửi lên không hợp lệ.' },
      { status: 400 }
    );
  }

  // Lấy IP thật của khách hàng từ header do chính hạ tầng hosting gắn vào
  // (Vercel/Nginx reverse proxy...) — KHÔNG lấy trực tiếp từ header client tự
  // gửi lên, vì browser hoàn toàn có thể tự set x-forwarded-for giả để né rate
  // limit. Next.js chạy server-side nên header này do proxy phía trước ghi đè,
  // client không thể can thiệp vào giá trị cuối cùng ở đây.
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  try {
    const res = await fetch(
      `${process.env.WP_BASE_URL}/wp-json/seoulive/v1/quick-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Secret chỉ tồn tại phía server Next.js, không bao giờ lộ ra browser
          'x-seoulive-secret': process.env.SEOULIVE_API_SECRET as string,
          // Forward IP thật của khách để WordPress rate-limit đúng người,
          // thay vì đếm nhầm IP của chính server Next.js cho mọi request.
          'x-seoulive-client-ip': clientIp,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Không thể kết nối tới máy chủ, vui lòng thử lại.' },
      { status: 502 }
    );
  }
}