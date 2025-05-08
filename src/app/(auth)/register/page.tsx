import { RegisterForm } from "@/components/auth/register-form";
import { CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <>
      <CardTitle className="text-2xl font-semibold tracking-tight">
        Create an Account
      </CardTitle>
      <CardDescription className="text-sm text-muted-foreground">
        Enter your details to get started with UniTask Pro.
      </CardDescription>
      <CardContent className="grid gap-4 pt-6">
        <RegisterForm />
      </CardContent>
    </>
  );
}