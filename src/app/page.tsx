import { auth, signOut } from "../auth";
import { Button } from "../components/ui/button";
import { Logo } from "../components/logo";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-surface-page text-text-primary font-sans">
      <div className="w-full max-w-[400px] bg-surface-white border border-border rounded-xl p-6 shadow-sm text-center">
        {/* Orvyn Labs brand lockup */}
        <div className="flex justify-center mb-4">
          <Logo size="lg" />
        </div>

        <h1 className="text-xl font-bold tracking-tight">
          Welcome to Orvynos CRM!
        </h1>
        <p className="text-sm text-text-secondary mt-1 mb-6">
          You have successfully logged in.
        </p>

        <div className="bg-surface-page border border-border rounded-lg p-4 text-left mb-6 space-y-2">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              User Name
            </span>
            <span className="text-sm font-semibold text-text-primary">
              {session?.user?.name}
            </span>
          </div>
          <div className="border-t border-border/60 pt-2">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Email Address
            </span>
            <span className="text-sm font-semibold text-text-primary">
              {session?.user?.email}
            </span>
          </div>
          {session?.user && (session.user as any).role && (
            <div className="border-t border-border/60 pt-2">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                User Role
              </span>
              <span className="text-xs font-bold bg-brand-orange-tint text-brand-orange px-2 py-0.5 rounded-full inline-block mt-1">
                {(session.user as any).role}
              </span>
            </div>
          )}
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button 
            type="submit"
            className="w-full bg-brand-orange text-white hover:bg-brand-orange-hover font-medium py-2 rounded-lg transition-colors shadow-sm"
          >
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
