import { LoginForm } from "./_components/loginForm";

export default function LoginPage() {
  return (
    <section className=" w-full h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full rounded-none md:w-[40%] lg:w-[40%] xl:w-[40%] 2xl:w-[40%] h-auto  bg-white shadow-xl flex flex-col justify-between items-start gap-10 p-5">
        <h1 className="text-sm md:text-2xl lg:text-2xl xl:text-2xl 2xl:text-2xl  text-customBlack">
          <span className="text-customOlive font-bold text-3xl">
            Welcome back!
          </span>
          <br /> Your next great chat is just a login away.
        </h1>
        <LoginForm />
      </div>
    </section>
  );
}
