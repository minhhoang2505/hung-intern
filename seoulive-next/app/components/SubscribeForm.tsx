"use client";

import { useState } from "react";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setStatus("error");
    setMessage("Vui lòng nhập đúng định dạng email");
    return;
  }
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Có lỗi xảy ra");
        return;
      }

      setStatus("success");
      setMessage("Đăng ký thành công!");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Không thể kết nối server");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-6 max-w-md">
      <input
        type="email"
        required
        placeholder="Nhập email của bạn"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded px-3 py-2 flex-1 text-black"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {status === "loading" ? "Đang gửi..." : "Đăng ký"}
      </button>
      {message && (
        <p className={status === "success" ? "text-green-600" : "text-red-600"}>
          {message}
        </p>
      )}
    </form>
  );
}