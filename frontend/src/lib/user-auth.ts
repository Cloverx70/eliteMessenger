import { cookies } from "next/headers";
import { unsealData } from "iron-session";
import { sessionOptions } from "./session-options";

export async function getUserFromCookie() {
  const sealed = (await cookies()).get("restaurant_session")?.value;
  if (!sealed) return null;
  try {
    return await unsealData(sealed, sessionOptions);
  } catch {
    return null;
  }
}
