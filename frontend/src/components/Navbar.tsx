import { Link } from "react-router-dom";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";

import logo from "../assets/logo.png";
import useAuthStore from "../store/useAuthStore";
import ConfirmModal, { type ConfirmHandle } from "./ConfirmDialog";

function Navbar() {
    const informRef = useRef<HTMLDialogElement | null>(null);
    const logoutRef = useRef<ConfirmHandle | null>(null);
    const { isAuthenticated, logout } = useAuthStore();

    return (
        <>
            <div className="navbar px-4 bg-base-100 shadow-sm select-none">
                {/* Logo */}
                <div className="navbar-start">
                    <Link to="/home" className="flex items-center text-xl font-semibold">
                        <img src={logo} alt="Logo Sinh vật Việt Nam" className="size-10" />
                        <p className="ml-2">SINH VẬT BIỂN VIỆT NAM</p>
                    </Link>
                </div>

                {/* Menu */}
                <div className="navbar-end items-center *:py-2 *:px-4 *:text-md *:font-semibold *:hover:bg-base-300 *:rounded-md *:cursor-pointer">
                    <div className="">
                        <Link to="/home">Trang chủ</Link>
                    </div>
                    <div className={!isAuthenticated ? "pointer-events-none opacity-50 cursor-not-allowed" : ""}>
                        <Link to="/dashboard">Quản lý</Link>
                    </div>
                    <div onClick={() => informRef.current?.showModal()}>Liên hệ</div>
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} className="flex justify-center items-center">
                            <p>Tài khoản</p>
                            <ChevronDown />
                        </div>
                        <ul
                            tabIndex={-1}
                            className="dropdown-content menu bg-base-100 border border-base-300 rounded-md z-1500 w-32 mt-5 p-2 shadow-md [&_a]:justify-end [&_a]:text-sm [&_a]:font-normal"
                        >
                            <li>
                                <Link to="/login">Đăng nhập</Link>
                            </li>
                            <li className={!isAuthenticated ? "pointer-events-none opacity-50 cursor-not-allowed" : ""}>
                                <Link to="/change-password">Đổi mật khẩu</Link>
                            </li>
                            <li className={!isAuthenticated ? "pointer-events-none opacity-50 cursor-not-allowed" : ""}>
                                <a onClick={() => logoutRef.current?.show()}>Đăng xuất</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Contact dialog */}
            <dialog ref={informRef} className="modal">
                <div className="modal-box flex flex-col items-center max-w-2xl">
                    <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    <img src={logo} alt="Logo Sinh vật biển Việt Nam" className="size-32" />
                    <h1 className="text-xl font-bold">Sinh vật biển Việt Nam</h1>
                    <div className="p-2 text-center">
                        <p>
                            <span className="font-semibold">Email: </span>
                            <span className="link link-primary">sinhvatbienvietnam@gmail.com</span>
                        </p>
                        <p>
                            <span className="font-semibold">Địa chỉ: </span>
                            91 Hải Thượng Lãn Ông, Phường 10, Quận 5, Tp Hồ Chí Minh
                        </p>
                        <p>
                            <span className="font-semibold">Điện thoại: </span>
                            034.9091.522
                        </p>
                    </div>
                </div>
            </dialog>

            {/* Confirmation message */}
            <ConfirmModal ref={logoutRef} message="Bạn có chắc chắn muốn đăng xuất không?" api={logout} />
        </>
    );
}

export default Navbar;
