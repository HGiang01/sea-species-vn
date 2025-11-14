import { useRef, forwardRef, useImperativeHandle } from "react";
import { TriangleAlert, LoaderCircle } from "lucide-react";

import useAuthStore from "../store/useAuthStore";

export interface ConfirmHandle {
    show: () => void;
}

interface Props {
    message: string;
    api: () => unknown;
}

const ConfirmModal = forwardRef<ConfirmHandle, Props>(({ message, api }, ref) => {
    const { isLoading } = useAuthStore();
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    useImperativeHandle(ref, () => ({
        show: () => dialogRef.current?.showModal(),
    }));

    return (
        <>
            <dialog ref={dialogRef} id="my_modal_1" className="modal">
                <div className="modal-box flex flex-col justify-center items-center max-w-94">
                    <div className={`flex justify-center items-center size-16 rounded-2xl text-red-500 bg-red-200/50`}>
                        <TriangleAlert />
                    </div>
                    <p className="mt-2 p-4 text-[20px] font-semibold text-center">{message}</p>
                    <div className="flex justify-between w-full mt-4 px-4">
                        <button onClick={() => dialogRef.current?.close()} className="btn w-[45%]">
                            Hủy bỏ
                        </button>
                        <button
                            disabled={isLoading}
                            onClick={async () => {
                                await api();
                                dialogRef.current?.close();
                            }}
                            className={`btn btn-soft btn-error w-[45%]`}
                        >
                            {isLoading ? <LoaderCircle className="animate-spin" /> : "Tiếp tục"}
                        </button>
                    </div>
                </div>
            </dialog>
        </>
    );
});

export default ConfirmModal;
