import { LoginForm } from "@/components/auth/login-form";
import { CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <>
      <CardTitle className="text-2xl font-semibold tracking-tight">
        Welcome Back!
      </CardTitle>
      <CardDescription className="text-sm text-muted-foreground">
        Enter your USN and password to access UniTask Pro.
      </CardDescription>
      <CardContent className="grid gap-4 pt-6">
         <LoginForm />
      </CardContent>
    </>
  );
}
