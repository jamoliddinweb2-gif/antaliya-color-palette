import { useState } from "react";
import { useLocation } from "wouter";
import { useLoginCustomer, useSearchCustomer } from "@workspace/api-client-react";
import { setCustomerSession } from "@/lib/auth";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag } from "lucide-react";
import logo from "@/assets/como-logo.jpg.asset.json";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const searchCustomer = useSearchCustomer();
  const loginCustomer = useLoginCustomer();

  const [step, setStep] = useState<"phone" | "name">("phone");
  const [phone, setPhone] = useState("+998");
  const [name, setName] = useState("");

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 13) {
      toast({ title: "Xato", description: "Telefon raqamni to'g'ri kiriting", variant: "destructive" });
      return;
    }

    searchCustomer.mutate(
      { data: { phone } },
      {
        onSuccess: (data) => {
          if (data.exists && data.customer) {
            setCustomerSession(data.customer);
            setLocation("/");
          } else {
            setStep("name");
          }
        },
        onError: () => {
          toast({ title: "Xato", description: "Xatolik yuz berdi", variant: "destructive" });
        }
      }
    );
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 2) {
      toast({ title: "Xato", description: "Ismni kiriting", variant: "destructive" });
      return;
    }

    loginCustomer.mutate(
      { data: { phone, name } },
      {
        onSuccess: (customer) => {
          setCustomerSession(customer);
          setLocation("/");
        },
        onError: () => {
          toast({ title: "Xato", description: "Ro'yxatdan o'tishda xatolik", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary via-background to-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm glass-panel p-8 rounded-[2rem] text-center"
      >
        <img
          src={logo.url}
          alt="Como Pizza logotipi"
          className="mx-auto w-24 h-24 rounded-full object-cover shadow-lg mb-5 ring-4 ring-primary/15"
        />
        <div className="mx-auto mb-5 h-1 w-24 rounded-full flag-stripe" />
        <h1 className="font-display text-3xl tracking-wide text-primary mb-1">Como Pizza</h1>
        <p className="text-muted-foreground mb-8 text-sm">The spirit of Italy — buyurtma berish uchun kiring</p>


        {step === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon raqam</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="h-12 rounded-xl bg-white/50 dark:bg-black/50 backdrop-blur-md border-white/20 text-lg"
                data-testid="input-phone"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-lg font-medium"
              disabled={searchCustomer.isPending}
              data-testid="button-continue-phone"
            >
              {searchCustomer.isPending ? "Kuting..." : "Davom etish"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleNameSubmit} className="space-y-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="name">Ismingiz</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ali"
                className="h-12 rounded-xl bg-white/50 dark:bg-black/50 backdrop-blur-md border-white/20 text-lg"
                data-testid="input-name"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-lg font-medium"
              disabled={loginCustomer.isPending}
              data-testid="button-register"
            >
              {loginCustomer.isPending ? "Kuting..." : "Boshlash"}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
