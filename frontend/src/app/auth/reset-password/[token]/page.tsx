import { ResetPasswordForm } from "./_components/ResetPasswordForm";

export default function VerifyRequestResetPasswordPage() {
  return (
    <section className=" w-full h-screen bg-gray-100 flex items-center justify-center">
      <div className=" w-full h-[40%] 2xl:w-[45%] xl:w-[45%] lg:w-[55%] md:w-[65%] sm:w-full sm:rounded-none bg-white rounded-lg shadow-lg p-6 ">
        <ResetPasswordForm />
      </div>
    </section>
  );
}
