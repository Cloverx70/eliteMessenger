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
import Spinner from "@/app/components/spinner";
import toaster from "@/app/components/toaster";
import { requestResetPassword } from "../../actions";

const ResetPasswordSchema = z.object({
  email: z
    .string()
    .email("value must be type of email")
    .nonempty("Email cannot be empty"),
});

export const ResetPasswordForm = () => {
  const router = useRouter();

  type ResetPasswordInputs = z.infer<typeof ResetPasswordSchema>;

  const ResetPasswordForm = useForm<ResetPasswordInputs>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { mutate: ResetPasswordMutate, isPending } = useMutation({
    mutationKey: ["LOGIN"],
    mutationFn: (data: ResetPasswordInputs) => requestResetPassword(data.email),
    onSuccess: () => {
      router.push("/");
      toaster(
        "Success",
        "if the email you entered is associated with an account, please check your email inbox.."
      );
    },
    onError: (e) => {
      toaster("Error", e.message);
    },
  });

  return (
    <Form {...ResetPasswordForm}>
      <form
        className="flex flex-col gap-5 w-full"
        onSubmit={ResetPasswordForm.handleSubmit((data) =>
          ResetPasswordMutate(data)
        )}
      >
        <FormField
          name="email"
          control={ResetPasswordForm.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input label="Email" type="email" {...field} />
              </FormControl>
              <FormMessage>
                {ResetPasswordForm.formState.errors.email?.message}
              </FormMessage>
            </FormItem>
          )}
        />
        <button
          type="submit"
          disabled={isPending}
          className=" bg-customOlive hover:bg-customDarkOlive delay-100 transition-all ease-linear w-full mt-4 py-1.5 text-sm font-normal text-white"
        >
          {isPending ? <Spinner /> : "Reset"}
        </button>
      </form>
    </Form>
  );
};
