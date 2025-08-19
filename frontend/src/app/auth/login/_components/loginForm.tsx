"use client";
import Input from "@/app/components/input";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../actions";
import Spinner from "@/app/components/spinner";
import toaster from "@/app/components/toaster";

const LoginSchema = z.object({
  email: z
    .string()
    .email("value must be type of email")
    .nonempty("Email cannot be empty"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const LoginForm = () => {
  const router = useRouter();

  type LoginInputs = z.infer<typeof LoginSchema>;

  const LoginForm = useForm<LoginInputs>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: LoginMutate, isPending } = useMutation({
    mutationKey: ["LOGIN"],
    mutationFn: (data: LoginInputs) => login(data.email, data.password),
    onSuccess: () => {
      router.push("/");
      toaster("Success", "Logged in successfully..");
    },
    onError: (e) => {
      toaster("Error Logging in", e.message);
      LoginForm.reset();
    },
  });

  return (
    <Form {...LoginForm}>
      <form
        className="flex flex-col gap-5 w-full"
        onSubmit={LoginForm.handleSubmit((data) => LoginMutate(data))}
      >
        <FormField
          name="email"
          control={LoginForm.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input label="Email" type="email" {...field} />
              </FormControl>
              <FormMessage>
                {LoginForm.formState.errors.email?.message}
              </FormMessage>
            </FormItem>
          )}
        />
        <FormField
          name="password"
          control={LoginForm.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input label="Password" type="password" {...field} />
              </FormControl>
              <FormMessage>
                {LoginForm.formState.errors.password?.message}
              </FormMessage>
            </FormItem>
          )}
        />
        <div className=" w-full flex items-center justify-between">
          <p className=" text-xs text-customBlack">
            Forgot your password?{" "}
            <span
              className=" text-gray-500 cursor-pointer"
              onClick={() => router.push("/auth/reset-password")}
            >
              Reset it here
            </span>
          </p>
          <p className="text-xs text-customBlack">
            Don’t have an account?{" "}
            <span
              className="text-gray-500 cursor-pointer"
              onClick={() => router.push("/auth/register")}
            >
              Register here
            </span>
          </p>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-8 flex items-center justify-center bg-customOlive hover:bg-customDarkOlive delay-100 ease-linear transition-all text-white rounded"
        >
          {isPending ? <Spinner /> : "Login"}
        </button>
      </form>
    </Form>
  );
};
