import RegisterForm from "./_components/registerForm";

export default function RegisterPage() {
  return (
    <section className=" w-full h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full rounded-none md:w-[40%] lg:w-[40%] xl:w-[40%] 2xl:w-[40%] h-auto bg-white shadow-xl flex flex-col justify-between items-start gap-10  p-5">
        <h1 className="text-sm md:text-2xl lg:text-2xl xl:text-2xl 2xl:text-2xl text-customBlack">
          <span className="text-customOlive font-bold text-3xl">Welcome!</span>
          <br /> Sign up to start your journey.
        </h1>

        <RegisterForm />
      </div>
    </section>
  );
}
