import { Link } from "react-router-dom";

import backgroundImage from "../assets/intro-background.png";

function IntroPage() {
    return (
        <>
            <div
                className="hero min-h-screen"
                style={{
                    backgroundImage: `url(${backgroundImage})`,
                }}
            >
                <div className="hero-overlay"></div>
                <div className="hero-content flex flex-col h-full text-white text-center">
                    <div className="flex-1 flex flex-col justify-center items-center max-w-2xl">
                        <h1 className="mb-5 text-5xl font-bold">SINH VẬT BIỂN VIỆT NAM</h1>
                        <p className="mb-5 text-[18px]">
                            Nơi chia sẻ kiến thức về các sinh vật biển ở Việt Nam: cung cấp dữ liệu, tài liệu về đa dạng sinh học biển, bảo
                            tồn biển và cách ứng xử hài hòa với biển
                        </p>
                        <Link to="/home" className="btn btn-info animate-bounce text-white">
                            Khám phá ngay
                        </Link>
                    </div>
                    <Link to="/login" className="link link-hover text-white">
                        Đăng nhập với quyền quản trị viên
                    </Link>
                </div>
            </div>
        </>
    );
}

export default IntroPage;
