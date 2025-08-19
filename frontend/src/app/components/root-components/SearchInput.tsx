"use client";
import { GetUserSearch } from "@/app/(root)/friends/action";
import { useDebounce } from "@/app/constants";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { IoSearch } from "react-icons/io5";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

const SearchInput = () => {
  const [value, setValue] = useState<string>("");

  const debouncedValue = useDebounce(value, 300);

  const { data: UserSearchData, isLoading: UserSearchLoading } = useQuery({
    queryKey: ["USERSEARCH", debouncedValue],
    queryFn: () => GetUserSearch(debouncedValue, 20, 1),
    enabled: debouncedValue.trim().length > 0,
  });

  return (
    <div className="relative w-[40%] h-9 border rounded-xl p-1 flex items-center justify-center px-4">
      <div className="w-full flex justify-start items-center">
        <input
          placeholder="Search here.."
          type="text"
          className="flex-1 h-full text-sm bg-transparent border-none outline-none"
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
        <IoSearch />

        <AnimatePresence>
          {debouncedValue.trim().length > 0 && (
            <motion.div
              key="search-dropdown"
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="w-[180%] max-h-64 overflow-y-auto bg-white dark:bg-customDarkBlack flex flex-col items-center justify-start absolute shadow-md dark:shadow-none dark:border-none top-10 left-0 p-3 border rounded-xl overflow-hidden"
            >
              {UserSearchLoading ? (
                <div className="flex flex-col gap-2">
                  {[1, 2].map((i) => (
                    <motion.div
                      key={i}
                      layout
                      className="h-7 w-full rounded-xl relative overflow-hidden"
                    >
                      <div className="flex gap-2 ">
                        <Skeleton className=" w-[6%] h-7 rounded-full" />
                        <Skeleton className=" w-full h-7" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : UserSearchData && UserSearchData.length > 0 ? (
                UserSearchData.map((user, _index) => (
                  <motion.div
                    layout
                    key={user.id || _index}
                    className={`w-full h-14 flex justify-between items-center p-2 ${
                      UserSearchData.length - 1 !== _index && "border-b"
                    }`}
                  >
                    <div className="w-full h-full flex gap-5 items-center justify-start">
                      <div className="rounded-full ring-2 ring-customOlive items-center justify-start">
                        <Image
                          src={user.userPfpUrl}
                          alt="pfp"
                          className="rounded-full"
                          width={40}
                          height={40}
                        />
                      </div>
                      <div className="flex flex-col items-start justify-center">
                        <h1 className="text-base dark:text-white">
                          {user.username}
                        </h1>
                        <p className="text-xs text-neutral-400 dark:text-gray-300">
                          {user.firstname + " " + user.lastname}
                        </p>
                      </div>
                    </div>
                    <div className="w-[40%] flex items-center justify-end">
                      <button className="text-xs">View Profile</button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="w-full h-10 flex items-center justify-center">
                  <p className="text-xs text-center dark:text-white">
                    Searches for {"'" + debouncedValue + "'"} were not found..
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchInput;
