import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "Your Microsoft account isn't registered in this app, or your account has been deactivated. Contact your admin to be added.",
};

export default async function SignInPage(props: PageProps<"/signin">) {
  const searchParams = await props.searchParams;
  const errorParam = searchParams.error;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>🕌 Jumuah Duty Scheduler</CardTitle>
          <CardDescription>
            Sign in with your Microsoft work account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Sign-in failed</AlertTitle>
              <AlertDescription>
                {ERROR_MESSAGES[error] ?? "Something went wrong signing you in."}
              </AlertDescription>
            </Alert>
          )}
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: "/" });
            }}
          >
            <Button type="submit" className="w-full">
              Sign in with Microsoft
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
