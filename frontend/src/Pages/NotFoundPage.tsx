function NotFoundPage() {
    return (
        <>
            <div className="hero bg-base-200 min-h-screen">
                <div className="hero-content text-center">
                    <div className="max-w-3xl">
                        <h1 className="text-5xl font-bold">Rất tiếc! Không tìm thấy trang</h1>
                        <p className="py-6">Địa chỉ nhập truy cập có thể bị gỡ bỏ hoặc không tồn tại.</p>
                        <a href="/home" className="btn btn-info text-white">
                            Quay lại trang chủ
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}

export default NotFoundPage;
