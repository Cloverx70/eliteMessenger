import { AxiosResponse } from "axios";
import { handleError } from "../constants";
import ServerEndpoint from "@/lib/server-endpoint";

export interface IUser {
  email: string;
  failLoginAttempts: number;
  firstname: string;
  id: string;
  isAccountLocked: boolean;
  isActive: boolean;
  isAdmin: boolean;
  lastname: string;
  userPfpUrl: string;
  username: string;
}

export interface UserResponse {
  message: string;
  data: IUser[];
}

export interface Response {
  message: string;
  data?: string;
}

export async function login(email: string, password: string) {
  try {
    const res: AxiosResponse<Response> = await ServerEndpoint.post(
      "auth/login",
      {
        email,
        password,
      },
      { withCredentials: true }
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message || "Something went wrong while loggin in"
      );
  } catch (error) {
    handleError(error);
  }
}

export async function logout() {
  try {
    const res: AxiosResponse<Response> = await ServerEndpoint.post(
      "auth/logout",
      {},
      { withCredentials: true }
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message || "Something went wrong while logging out"
      );
  } catch (error) {
    handleError(error);
  }
}

export async function register(
  firstname: string,
  lastname: string,
  email: string,
  password: string,
  username: string,
  AccountRegisterType?: "google"
) {
  try {
    const res = await ServerEndpoint.post("auth/register", {
      firstname,
      lastname,
      email,
      password,
      username,
      AccountRegisterType:
        AccountRegisterType !== "google" ? "local" : AccountRegisterType,
    });

    if (res.status !== 201)
      throw new Error(
        res.data.message || "Something went wrong while registering"
      );
  } catch (error) {
    handleError(error);
  }
}

export async function requestResetPassword(Email: string) {
  try {
    const res: AxiosResponse<Response> = await ServerEndpoint.put(
      `auth/req-reset-password?email=${Email}`
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message || "Something went wrong while sending the request"
      );

    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function verifyResetPassword(
  token: string,
  newPassword: string,
  confirmNewPassword: string
) {
  try {
    const res: AxiosResponse<Response> = await ServerEndpoint.put(
      "auth/verify-reset-password",
      {
        token,
        newPassword,
        confirmNewPassword,
      }
    );

    if (res.status !== 200)
      throw new Error(
        res.data.message || "Something went wrong while verifying the request"
      );

    return res.data;
  } catch (error) {
    handleError(error);
  }
}
