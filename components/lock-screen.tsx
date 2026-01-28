"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuthStore } from "@/lib/store/auth-store";
import { getUsers } from "@/lib/actions/users";

interface User {
  id: string;
  name: string;
  pinCode: string;
  createdAt: Date | null;
}

export function LockScreen() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const router = useRouter();
  const { login } = useAuthStore();

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      const { data, error } = await getUsers();

      if (error) {
        console.error("[App] Error fetching users:", error);
        setLoadingUsers(false);
        return;
      }

      setUsers(
        (data || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          pinCode: u.pinCode,
          createdAt: u.createdAt ? new Date(u.createdAt) : null,
        })),
      );
      setLoadingUsers(false);
    }
    fetchUsers();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (pin.length !== 4 || users.length === 0) return;

    setIsLoading(true);
    setError("");

    try {
      // Найти пользователя с совпадающим PIN
      const user = users.find((u) => u.pinCode === pin);

      if (!user) {
        setError("Неверный PIN-код");
        setPin("");
        setIsLoading(false);
        return;
      }

      login({
        id: user.id,
        username: user.name,
        pin_code: user.pinCode,
        role: "user",
        created_at: user.createdAt?.toISOString() || new Date().toISOString(),
      });
      router.push("/dashboard");
    } catch (err) {
      setError("Ошибка авторизации");
      setPin("");
      setIsLoading(false);
    }
  }, [pin, users, login, router]);

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin, handleSubmit]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>

            {loadingUsers ? (
              <div className="text-center text-muted-foreground text-sm">
                Загрузка...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block text-center">
                    Введите PIN-код
                  </label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={4}
                      value={pin}
                      onChange={setPin}
                      disabled={isLoading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-12 h-12 text-xl" />
                        <InputOTPSlot index={1} className="w-12 h-12 text-xl" />
                        <InputOTPSlot index={2} className="w-12 h-12 text-xl" />
                        <InputOTPSlot index={3} className="w-12 h-12 text-xl" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center justify-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
