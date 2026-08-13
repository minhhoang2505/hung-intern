// app/product/[slug]/QuickOrderForm.tsx
'use client';

import { useState } from 'react';

interface QuickOrderFormProps {
  productId: number;
}

export default function QuickOrderForm({ productId }: QuickOrderFormProps) {
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [honeypot, setHoneypot] = useState(''); // bẫy bot, người dùng thật không thấy field này
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Nếu honeypot bị điền -> chắc chắn là bot, âm thầm bỏ qua
    if (honeypot) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      // Gọi qua Route Handler nội bộ (app/api/quick-order/route.ts),
      // KHÔNG gọi thẳng WordPress từ client để không lộ secret key.
      const res = await fetch('/api/quick-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, product_id: productId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        setStatus('error');
        return;
      }

      setStatus('success');
      setForm({ name: '', phone: '', address: '' });
    } catch {
      setErrorMsg('Không thể kết nối tới máy chủ.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return <p className="text-green-600 font-medium">Đặt hàng thành công! Chúng tôi sẽ liên hệ sớm.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Honeypot field: ẩn với người dùng thật bằng CSS, bot tự động điền vào */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <input
        name="name"
        placeholder="Họ và tên"
        value={form.name}
        onChange={handleChange}
        required
        className="w-full border rounded px-3 py-2"
      />
      <input
        name="phone"
        placeholder="Số điện thoại"
        value={form.phone}
        onChange={handleChange}
        required
        pattern="[0-9+ ]{9,15}"
        className="w-full border rounded px-3 py-2"
      />
      <textarea
        name="address"
        placeholder="Địa chỉ nhận hàng"
        value={form.address}
        onChange={handleChange}
        required
        className="w-full border rounded px-3 py-2"
      />

      {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-black text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {status === 'loading' ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
      </button>
    </form>
  );
}