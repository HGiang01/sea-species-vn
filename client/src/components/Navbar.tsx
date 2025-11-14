import { Link } from "react-router-dom";
import { useRef } from "react";
import { Search, Menu, LogIn, Database, RotateCcwKey, LogOut, Headset } from "lucide-react";

import logo from "../assets/logo.png";
import useAuthStore from "../store/useAuthStore";
import ConfirmModal, { type ConfirmHandle } from "./ConfirmDialog";

function Navbar() {
    const informRef = useRef<HTMLDialogElement | null>(null);
    const logoutRef = useRef<ConfirmHandle | null>(null);
    const { isAuthenticated, logout } = useAuthStore();

    return (
        <>
            <div className="navbar px-4 bg-base-100 shadow-sm">
                {/* Logo */}
                <div className="navbar-start">
                    <Link to="/home" className="flex items-center text-xl font-bold">
                        <img src={logo} alt="Logo Sinh vật Việt Nam" className="size-10" />
                        <p className="ml-2">SINH VẬT BIỂN VIỆT NAM</p>
                    </Link>
                </div>

                {/* Search box */}
                <div className="navbar-center w-1/3">
                    <div className="relative w-full">
                        <Search className="absolute top-1/2 -translate-y-1/2 left-3 z-2" />
                        <input type="text" placeholder="Tìm kiếm..." className="input w-full pl-11 border-black" />
                    </div>
                </div>

                {/* Menu */}
                <div className="navbar-end">
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-square m-1">
                            <Menu />
                        </div>
                        <ul tabIndex={-1} className="dropdown-content menu bg-base-100 rounded-box z-1 w-44 mt-2 p-2 shadow-sm">
                            {!isAuthenticated && (
                                <li>
                                    <Link to="/login">
                                        <LogIn />
                                        <p>Đăng nhập</p>
                                    </Link>
                                </li>
                            )}

                            {isAuthenticated && (
                                <>
                                    <li>
                                        <Link to="/dashboard">
                                            <Database />
                                            <p>Quản lý dữ liệu</p>
                                        </Link>
                                    </li>

                                    <li>
                                        <Link to="/change-password">
                                            <RotateCcwKey />
                                            <p>Đổi mật khẩu</p>
                                        </Link>
                                    </li>

                                    <li>
                                        <a onClick={() => logoutRef.current?.show()}>
                                            <LogOut />
                                            <p>Đăng xuất</p>
                                        </a>
                                    </li>
                                </>
                            )}

                            <li>
                                <a onClick={() => informRef.current?.showModal()}>
                                    <Headset />
                                    <p>Liên hệ hỗ trợ</p>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Contact modal */}
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
