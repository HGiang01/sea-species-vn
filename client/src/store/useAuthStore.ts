import { create } from "zustand";
import axios from "axios";
import axiosIns from "../lib/axios";

import toast from "../lib/toast";

interface FormLogin {
    username: string;
    password: string;
}

interface FormChangePassword extends FormLogin {
    newPassword: string;
    confirmPassword: string;
}

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    errorMessage: string;
    login: (data: FormLogin) => Promise<boolean>;
    logout: () => Promise<boolean>;
    changePassword: (data: FormChangePassword) => Promise<boolean>;
}

const handleError = (error: unknown) => {
    console.log(error);
    let errorMessage = "Something went wrong";

    if (axios.isAxiosError(error)) {
        const resMessage = error.response?.data.message;
        const resRemainingAttempts = error.response?.data.remainingAttempts;

        if (resMessage) {
            errorMessage = resMessage;

            if (resRemainingAttempts) {
                errorMessage = `${errorMessage} \nCòn ${resRemainingAttempts} lần nhập`;
            }
        } else {
            errorMessage = error.message;
        }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === "string") {
        errorMessage = error;
    }

    return errorMessage;
};

const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    isLoading: false,
    errorMessage: "",
    login: async (data) => {
        try {
            set({ isLoading: true });

            const res = await axiosIns.post("/auth/login", data);

            set({ errorMessage: "", isAuthenticated: true, isLoading: false });

            localStorage.setItem("jwt", res.data.token);
            toast.success(res.data.message);

            return true;
        } catch (error) {
            set({ isLoading: false, errorMessage: handleError(error) });
        }

        return false;
    },
    logout: async () => {
        try {
            set({ isLoading: true });

            const jwt = localStorage.getItem("jwt");
            const res = await axiosIns.post(
                "/auth/logout",
                {},
                {
                    headers: { Authorization: `Bearer ${jwt}` },
                }
            );

            set({ isAuthenticated: false, isLoading: false });

            localStorage.removeItem("jwt");
            toast.info(res.data.message);
            return true;
        } catch (error) {
            set({ isLoading: false });
            toast.error(handleError(error));
        }
        return false;
    },
    changePassword: async (data) => {
        try {
            set({ isLoading: true });

            const res = await axiosIns.post("/auth/change-password", data);

            set({ errorMessage: "", isAuthenticated: false, isLoading: false });

            localStorage.removeItem("jwt");
            toast.success(res.data.message);

            return true;
        } catch (error) {
            set({ isLoading: false, errorMessage: handleError(error) });
        }

        return false;
    },
}));

export default useAuthStore;
