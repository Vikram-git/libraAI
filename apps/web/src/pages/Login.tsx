import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post<{ token: string; user: Parameters<typeof setAuth>[1] }>(
        "/api/auth/login",
        { email, password },
      );
      setAuth(res.token, res.user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold">Welcome back</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--color-muted-foreground)]">
          Demo: member@libraai.com / password123
        </p>
        <p className="mt-2 text-center text-sm">
          No account?{" "}
          <Link to="/register" className="text-indigo-600 hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
