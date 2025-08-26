import SearchInput from "@/app/(root)/friends/_components/SearchInput";
import PeopleYouMayKnow from "./_components/peopleYouMayKnow";
import SuggestedUsers from "@/app/components/root-components/SuggestedUsers";
import UserNavigation from "./_components/userNavigation";

export default function FriendsPage() {
  return (
    <section className="w-full h-screen flex">
      <div className="w-full h-screen flex flex-col items-start justify-start">
        <h1 className=" font-bold text-3xl py-3 pl-5 text-customBlack dark:text-white">
          Friends
        </h1>
        <div className="w-full p-5 flex flex-col gap-5">
          <SearchInput />

          <UserNavigation />

          <h1 className="font-semibold text-2xl text-customBlack dark:text-white">
            People you may know
          </h1>
        </div>
        <div className="w-full flex-1 overflow-y-auto">
          <PeopleYouMayKnow />
        </div>
      </div>
      <SuggestedUsers />
    </section>
  );
}
