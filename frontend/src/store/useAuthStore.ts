import { create } from "zustand";
import axios from "axios";

import axiosIns from "../libs/axios";
import toast from "../libs/toast";

export interface LoginForm {
    username: string;
    password: string;
}

export interface PasswordChangeForm extends LoginForm {
    newPassword: string;
    confirmPassword: string;
}

interface AuthState {
    isAuthenticated: boolean;
    isLoadingAuth: boolean;
    errorMessage: string;
    resetErrorMessage: () => void;
    login: (data: LoginForm) => Promise<boolean>;
    logout: () => Promise<boolean>;
    changePassword: (data: PasswordChangeForm) => Promise<boolean>;
}

const handleError = (error: unknown) => {
    let errorMessage = "Something went wrong";

    if (axios.isAxiosError(error)) {
        const resMessage = error.response?.data.message;
        errorMessage = resMessage || error.message;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === "string") {
        errorMessage = error;
    }

    return errorMessage;
};

const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    isLoadingAuth: false,
    errorMessage: "",
    resetErrorMessage: () => set({ errorMessage: "" }),
    login: async (data) => {
        try {
            set({ isLoadingAuth: true });

            const res = await axiosIns.post("/auth/login", data);
            set({ errorMessage: "", isAuthenticated: true, isLoadingAuth: false });

            localStorage.setItem("jwt", res.data.token);
            toast.success(res.data.message);

            return true;
        } catch (error) {
            set({ isLoadingAuth: false, errorMessage: handleError(error) });
        }

        return false;
    },
    logout: async () => {
        try {
            set({ isLoadingAuth: true });

            const jwt = localStorage.getItem("jwt");
            const res = await axiosIns.post(
                "/auth/logout",
                {},
                {
                    headers: { Authorization: `Bearer ${jwt}` },
                }
            );

            set({ isAuthenticated: false, isLoadingAuth: false });

            localStorage.removeItem("jwt");
            toast.info(res.data.message);
            return true;
        } catch (error) {
            set({ isLoadingAuth: false });
            toast.error(handleError(error));
        }
        return false;
    },
    changePassword: async (data) => {
        try {
            set({ isLoadingAuth: true });

            const res = await axiosIns.post("/auth/change-password", data);

            set({ errorMessage: "", isAuthenticated: false, isLoadingAuth: false });

            localStorage.removeItem("jwt");
            toast.success(res.data.message);

            return true;
        } catch (error) {
            set({ isLoadingAuth: false, errorMessage: handleError(error) });
        }

        return false;
    },
}));

export default useAuthStore;
