"use client";

import { useState } from "react";

export default function RegisterForm() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Có lỗi xảy ra");
        return;
      }

      setStatus("success");
      setMessage("Đăng ký thành công!");
      setForm({ username: "", email: "", password: "" });
    } catch {
      setStatus("error");
      setMessage("Không thể kết nối server");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm p-6 border rounded-lg">
      <h2 className="font-bold text-lg">Đăng ký tài khoản</h2>
      <input
        type="text"
        required
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        className="border rounded px-3 py-2 text-black"
      />
      <input
        type="email"
        required
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="border rounded px-3 py-2 text-black"
      />
      <input
        type="password"
        required
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="border rounded px-3 py-2 text-black"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {status === "loading" ? "Đang đăng ký..." : "Đăng ký"}
      </button>
      {message && (
        <p className={status === "success" ? "text-green-600" : "text-red-600"}>{message}</p>
      )}
    </form>
  );
}