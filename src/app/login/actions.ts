"use server";

import { signIn } from "../../auth";
import { AuthError } from "next-auth";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    // Collect email and password from form data
    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password) {
      return "Please fill in all fields.";
    }

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid email or password.";
        default:
          return "An authentication error occurred. Please try again.";
      }
    }
    // Re-throw Next.js redirect errors so client-side redirect works
    throw error;
  }
}
