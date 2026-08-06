"use client";

import { useState } from "react";

export default function LoginForm() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Đăng nhập thất bại");
        return;
      }

      setStatus("success");
      setMessage("Đăng nhập thành công! Kiểm tra Terminal để xem token.");
    } catch {
      setStatus("error");
      setMessage("Không thể kết nối server");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm p-6 border rounded-lg">
      <h2 className="font-bold text-lg">Đăng nhập</h2>
      <input
        type="text"
        required
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
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
        {status === "loading" ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
      {message && (
        <p className={status === "success" ? "text-green-600" : "text-red-600"}>{message}</p>
      )}
    </form>
  );
}