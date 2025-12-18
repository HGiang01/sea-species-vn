import { useNavigate, Link } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { LoaderCircle } from "lucide-react";

import backgroundImage from "../assets/login-background.jpg";
import useAuthStore, { type LoginForm } from "../store/useAuthStore";

function LoginPage() {
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>();

    const { isLoadingAuth: isLoading, errorMessage, resetErrorMessage, login } = useAuthStore();

    const handleLogin: SubmitHandler<LoginForm> = async (data) => {
        const res = await login(data);

        if (res) {
            navigate("/home");
        }
    };
    return (
        <>
            <div
                className="hero bg-base-200 min-h-screen relative"
                style={{
                    backgroundImage: `url(${backgroundImage})`,
                }}
            >
                {/* Overlay behind the text*/}
                <div className="absolute inset-0 bg-black/50"></div>

                <div className="hero-content flex-col lg:flex-row-reverse relative z-10">
                    <div className="text-center lg:text-left text-white">
                        <div className="p-6">
                            <h1 className="text-5xl font-bold drop-shadow-lg">Đăng nhập - Hệ thống cơ sở dữ liệu sinh vật biển</h1>
                            <p className="py-6 text-[18px] drop-shadow-md">
                                Khu vực dành riêng cho quản trị viên được ủy quyền. Vui lòng đăng nhập bằng tài khoản được cung cấp để truy
                                cập công cụ quản lý cơ sở dữ liệu về động vật biển.
                            </p>
                        </div>
                    </div>
                    <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
                        <div className="card-body">
                            <form onSubmit={handleSubmit(handleLogin)} className="w-full">
                                <fieldset className="fieldset w-full p-4">
                                    {/* Error message */}
                                    {errorMessage && (
                                        <div className="p-2.5 text-center italic text-red-600 bg-red-200 border rounded-sm whitespace-pre-line">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <label className="label font-bold">Tên tài khoản</label>
                                    <input
                                        {...register("username", {
                                            required: "Vui lòng nhập trường này",
                                            onChange: resetErrorMessage,
                                        })}
                                        type="text"
                                        className="input w-full"
                                    />
                                    {errors.username && <span className="text-red-500 italic">{errors.username.message}</span>}

                                    <label className="label font-bold">Mật khẩu</label>
                                    <input
                                        {...register("password", {
                                            required: "Vui lòng nhập trường này",
                                            onChange: resetErrorMessage,
                                        })}
                                        type="password"
                                        className="input w-full"
                                    />
                                    {errors.password && <span className="text-red-500 italic">{errors.password.message}</span>}

                                    <button type="submit" disabled={isLoading} className="btn btn-info btn-soft mt-4 border-blue-100">
                                        {isLoading ? <LoaderCircle className="animate-spin" /> : "Đăng nhập"}
                                    </button>

                                    <Link to="/home" className="link link-hover w-fit mt-1">
                                        Quay về trang chủ ?
                                    </Link>
                                </fieldset>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default LoginPage;
