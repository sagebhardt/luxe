import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-heading">
          <span>Luxe</span>
          <sup>AI</sup>
        </h1>
        <p className="auth-tag">Sign in to your concierge workspace.</p>
        <SignIn />
      </div>
    </main>
  );
}
