import { ResetPasswordForm } from "./_components/resetPaswordForm";

export default function ResetPasswordPage() {
  return (
    <section className=" w-full h-screen bg-gray-100 flex items-center justify-center">
      <div className=" w-full h-auto 2xl:w-[45%] xl:w-[45%] lg:w-[55%] md:w-[65%] sm:w-full sm:rounded-none bg-white rounded-lg shadow-lg p-6 flex flex-col gap-5 justify-between ">
        <h1 className=" text-xl 2xl:text-2xl xl:text-2xl lg:text-2xl md:text-2xl sm:text-2xl">
          <span className="text-black font-semibold">
            Forgot your <span className=" text-customOlive">password?</span>
          </span>
          <br />
          <span className=" text-sm 2xl:text-base xl:text-base lg:text-base md:text-base sm:text-base">
            {" Enter your email address and we'll send you a link to reset it."}{" "}
          </span>
        </h1>
        <ResetPasswordForm />
      </div>
    </section>
  );
}
