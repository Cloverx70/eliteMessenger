"use client";

import {
  ArrowRight,
  AtSign,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Spinner from "@/app/components/spinner";
import toaster from "@/app/components/toaster";

import { AuthField } from "../../_components/AuthField";
import { register } from "../../actions";

const RegisterSchema = z
  .object({
    firstname: z.string().trim().min(1, "First name cannot be empty"),
    lastname: z.string().trim().min(1, "Last name cannot be empty"),
    username: z.string().trim().min(8, "Username must be at least 8 characters"),
    email: z.string().trim().min(1, "Email cannot be empty").email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterInputs = z.infer<typeof RegisterSchema>;

export default function RegisterForm() {
  const router = useRouter();

  const form = useForm<RegisterInputs>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ["REGISTER"],
    mutationFn: (data: RegisterInputs) =>
      register(
        data.firstname,
        data.lastname,
        data.email,
        data.password,
        data.username,
      ),
    onSuccess: () => {
      toaster("Success", "Your account is ready. Please sign in.");
      router.push("/auth/login");
    },
    onError: (error: unknown) => {
      toaster(
        "Could not register",
        error instanceof Error ? error.message : "Could not create the account.",
      );
    },
  });

  return (
    <form
      className="w-full space-y-4"
      noValidate
      onSubmit={form.handleSubmit((data) => mutate(data))}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AuthField
          id="register-firstname"
          label="First name"
          icon={UserRound}
          autoComplete="given-name"
          placeholder="First name"
          error={form.formState.errors.firstname?.message}
          {...form.register("firstname")}
        />
        <AuthField
          id="register-lastname"
          label="Last name"
          icon={UserRound}
          autoComplete="family-name"
          placeholder="Last name"
          error={form.formState.errors.lastname?.message}
          {...form.register("lastname")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AuthField
          id="register-username"
          label="Username"
          icon={AtSign}
          autoComplete="username"
          placeholder="eliteusername"
          error={form.formState.errors.username?.message}
          {...form.register("username")}
        />
        <AuthField
          id="register-email"
          label="Email address"
          icon={Mail}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />
      </div>

      <AuthField
        id="register-password"
        label="Password"
        icon={LockKeyhole}
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />

      <AuthField
        id="register-confirm-password"
        label="Confirm password"
        icon={LockKeyhole}
        type="password"
        autoComplete="new-password"
        placeholder="Repeat your password"
        error={form.formState.errors.confirmPassword?.message}
        {...form.register("confirmPassword")}
      />

      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-elitePurple px-4 text-sm font-black text-white shadow-lg shadow-elitePurple/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <Spinner />
        ) : (
          <>
            Create my account
            <ArrowRight size={17} />
          </>
        )}
      </button>
    </form>
  );
}
