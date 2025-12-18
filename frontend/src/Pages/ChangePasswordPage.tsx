import { useNavigate, Link } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { LoaderCircle } from "lucide-react";

import backgroundImage from "../assets/change-password-background.jpg";
import useAuthStore, { type PasswordChangeForm } from "../store/useAuthStore";

function ChangePasswordPage() {
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
    } = useForm<PasswordChangeForm>();

    const { isLoadingAuth: isLoading, errorMessage, changePassword } = useAuthStore();

    const handleChangePassword: SubmitHandler<PasswordChangeForm> = async (data) => {
        const res = await changePassword(data);

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
                            <h1 className="text-5xl font-bold drop-shadow-lg">Đổi mật khẩu - Hệ thống cơ sở dữ liệu sinh vật biển</h1>
                            <p className="py-6 text-[18px] drop-shadow-md">
                                Khu vực dành cho quản trị viên đã được phân quyền. Vui lòng nhập tài khoản hiện tại và mật khẩu mới để cập
                                nhật thông tin đăng nhập. Nếu quên mật khẩu, hãy liên hệ với quản trị viên để được hỗ trợ.
                            </p>
                        </div>
                    </div>
                    <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
                        <div className="card-body">
                            <form onSubmit={handleSubmit(handleChangePassword)} className="w-full">
                                <fieldset className="fieldset w-full p-4">
                                    {/* Error message */}
                                    {errorMessage && (
                                        <div className="p-2.5 text-center italic text-red-600 bg-red-200 border rounded-sm">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <label className="label font-bold">Tên tài khoản</label>
                                    <input
                                        {...register("username", {
                                            required: "Vui lòng nhập trường này",
                                        })}
                                        type="text"
                                        className="input w-full"
                                    />
                                    {errors.username && <span className="text-red-500 italic">{errors.username.message}</span>}

                                    <label className="label font-bold">Mật khẩu</label>
                                    <input
                                        {...register("password", {
                                            required: "Vui lòng nhập trường này",
                                        })}
                                        type="password"
                                        className="input w-full"
                                    />
                                    {errors.password && <span className="text-red-500 italic">{errors.password.message}</span>}

                                    <label className="label font-bold">Mật khẩu mới</label>
                                    <input
                                        {...register("newPassword", {
                                            required: "Vui lòng nhập trường này",
                                            minLength: { value: 8, message: "Mật khẩu ít nhất 8 ký tự" },
                                            pattern: {
                                                value: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                                message: "Mật khẩu phải bao gồm chữ in hoa, in thường và số",
                                            },
                                        })}
                                        type="password"
                                        className="input w-full"
                                    />
                                    {errors && <span className="text-red-500 italic">{errors.newPassword?.message}</span>}

                                    <label className="label font-bold">Xác nhận mật khẩu</label>
                                    <input
                                        {...register("confirmPassword", {
                                            validate: (value) => value === getValues("newPassword") || "Mật khẩu xác nhận không khớp",
                                        })}
                                        type="password"
                                        className="input w-full"
                                    />
                                    {errors && <span className="text-red-500 italic">{errors.confirmPassword?.message}</span>}

                                    <button type="submit" disabled={isLoading} className="btn btn-info btn-soft mt-4 border-blue-100">
                                        {isLoading ? <LoaderCircle className="animate-spin" /> : "Cập nhật mật khẩu"}
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

export default ChangePasswordPage;
