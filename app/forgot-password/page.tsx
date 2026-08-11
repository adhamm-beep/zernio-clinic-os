type ForgotPasswordPageProps = {
  searchParams: Promise<{ email?: string; sent?: string; error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <section
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Reset your password
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          We will email you a secure link to choose a new password.
        </p>

        <label className="mt-8 block text-sm font-medium text-gray-700">Email</label>
        <input
          form="forgot-password-form"
          name="email"
          type="email"
          defaultValue={email}
          required
          autoComplete="email"
          className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-900 outline-none focus:border-green-600"
          placeholder="name@panthera.sa"
        />

        {params.sent === "1" && (
          <p role="status" className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-center text-sm text-green-700">
            Password reset link sent. Check your inbox and spam folder.
          </p>
        )}
        {params.error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            {params.error}
          </p>
        )}

        <form id="forgot-password-form" action="/api/auth/forgot-password" method="post">
          <button
            type="submit"
            className="mt-6 block w-full rounded-lg bg-green-600 px-5 py-3 text-center font-medium text-white hover:bg-green-700"
          >
            Send reset link
          </button>
        </form>

        <a href="/login" className="mt-3 block text-center text-sm font-medium text-gray-600 hover:text-gray-900">
          Back to sign in
        </a>
      </section>
    </main>
  );
}
