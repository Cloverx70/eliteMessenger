"use client";
import Spinner from "@/app/components/spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Input from "@/app/components/input";
import { useMutation } from "@tanstack/react-query";
import { register } from "../../actions";
import { useRouter } from "next/navigation";
import toaster from "@/app/components/toaster";

const RegisterSchema = z
  .object({
    firstname: z.string().nonempty("firstname cannot be empty"),
    lastname: z.string().nonempty("lastname cannot be empty"),
    username: z
      .string()
      .nonempty()
      .min(8, "username entry should at least be 8 characters long"),
    email: z
      .string()
      .email("value must be type of email")
      .nonempty("email cannot be empty"),
    password: z
      .string()
      .nonempty()
      .min(9, "password should at least be 8 characters long.."),
    confirmPassword: z.string().nonempty(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password's value does not match confirm password's value",
    path: ["confirmPassword"],
  });

export default function RegisterForm() {
  const router = useRouter();

  type RegisterInputs = z.infer<typeof RegisterSchema>;

  const RegisterForm = useForm<RegisterInputs>({
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

  const { mutate: RegisterMutate, isPending } = useMutation({
    mutationKey: ["REGISTER"],
    mutationFn: (data: RegisterInputs) =>
      register(
        data.firstname,
        data.lastname,
        data.email,
        data.password,
        data.username
      ),
    onSuccess: () => {
      router.push("/auth/login");
      toaster("Success", "Your registration succeeded, please login now..");
    },
    onError: (e) => {
      toaster("Error", e.message);
      RegisterForm.reset();
    },
  });

  return (
    <Form {...RegisterForm}>
      <form
        className="flex flex-col gap-5 w-full"
        onSubmit={RegisterForm.handleSubmit((data) => RegisterMutate(data))}
      >
        <div className="w-full flex items-center justify-center gap-2">
          <FormField
            name="firstname"
            control={RegisterForm.control}
            render={({ field }) => (
              <FormItem className=" w-full">
                <FormControl>
                  <Input label="Firstname" type="text" {...field} />
                </FormControl>
                <FormMessage>
                  {RegisterForm.formState.errors.firstname?.message}
                </FormMessage>
              </FormItem>
            )}
          />
          <FormField
            name="lastname"
            control={RegisterForm.control}
            render={({ field }) => (
              <FormItem className=" w-full">
                <FormControl>
                  <Input label="Lastname" type="text" {...field} />
                </FormControl>
                <FormMessage>
                  {RegisterForm.formState.errors.lastname?.message}
                </FormMessage>
              </FormItem>
            )}
          />
        </div>

        <div className="w-full flex items-center justify-center gap-2">
          <FormField
            name="username"
            control={RegisterForm.control}
            render={({ field }) => (
              <FormItem className=" w-full">
                <FormControl>
                  <Input label="Username" type="text" {...field} />
                </FormControl>
                <FormMessage>
                  {RegisterForm.formState.errors.username?.message}
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            name="email"
            control={RegisterForm.control}
            render={({ field }) => (
              <FormItem className=" w-full">
                <FormControl>
                  <Input label="Email" type="email" {...field} />
                </FormControl>
                <FormMessage>
                  {RegisterForm.formState.errors.email?.message}
                </FormMessage>
              </FormItem>
            )}
          />
        </div>

        <FormField
          name="password"
          control={RegisterForm.control}
          render={({ field }) => (
            <FormItem className=" w-full">
              <FormControl>
                <Input label="Password" type="password" {...field} />
              </FormControl>
              <FormMessage>
                {RegisterForm.formState.errors.password?.message}
              </FormMessage>
            </FormItem>
          )}
        />

        <FormField
          name="confirmPassword"
          control={RegisterForm.control}
          render={({ field }) => (
            <FormItem className=" w-full">
              <FormControl>
                <Input label="Confirm Password" type="password" {...field} />
              </FormControl>
              <FormMessage>
                {RegisterForm.formState.errors.confirmPassword?.message}
              </FormMessage>
            </FormItem>
          )}
        />

        <div className=" w-full flex items-center justify-end">
          <p className="text-xs text-customBlack">
            Already have an account?{" "}
            <span
              className="text-gray-500 cursor-pointer"
              onClick={() => router.push("/auth/login")}
            >
              Sign in
            </span>
          </p>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-8 flex items-center justify-center bg-customOlive hover:bg-customDarkOlive delay-100 ease-linear transition-all text-white"
        >
          {isPending ? <Spinner /> : "Sign up "}
        </button>
      </form>
    </Form>
  );
}
