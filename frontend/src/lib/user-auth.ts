import { IUser } from "@/app/auth/actions";
import { cookies } from "next/headers";
import { sessionOptions } from "./session-options";
import { unsealData } from "iron-session";

export async function getUserFromCookie() {
  const sealed = (await cookies()).get("auth_session")?.value;
  if (!sealed) return null;
  try {
    return (await unsealData(sealed, sessionOptions)) as IUser;
  } catch {
    return null;
  }
}
