import apiClient from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
  return response.data.data;
}

export interface CurrentUser {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  status: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  try {
    const response = await apiClient.get<ApiSuccess<CurrentUser>>("/users/me");
    return unwrap(response);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "ইউজার তথ্য আনা যায়নি।"));
  }
}

export async function updateCurrentUser(payload: {
  name?: string;
  email?: string;
  profileImageUrl?: string;
}): Promise<CurrentUser> {
  try {
    const response = await apiClient.put<ApiSuccess<CurrentUser>>("/users/me", payload);
    return unwrap(response);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "প্রোফাইল আপডেট করা যায়নি।"));
  }
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  try {
    await apiClient.put("/users/me/password", payload);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "পাসওয়ার্ড পরিবর্তন করা যায়নি।"));
  }
}

export async function requestPhoneChange(newPhone: string): Promise<void> {
  try {
    await apiClient.post("/users/me/phone-change/request", { newPhone });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "ফোন পরিবর্তনের OTP পাঠানো যায়নি।"));
  }
}

export async function verifyPhoneChange(newPhone: string, otp: string): Promise<void> {
  try {
    await apiClient.post("/users/me/phone-change/verify", { newPhone, otp });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "ফোন পরিবর্তন নিশ্চিত করা যায়নি।"));
  }
}
