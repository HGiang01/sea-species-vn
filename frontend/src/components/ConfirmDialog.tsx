import { useRef, forwardRef, useImperativeHandle } from "react";
import { TriangleAlert, LoaderCircle } from "lucide-react";

import useAuthStore from "../store/useAuthStore";
import useSpeciesStore from "../store/useAdminSpeciesStore";

export interface ConfirmHandle {
    show: () => void;
}

interface Props {
    message: string;
    api: () => unknown;
}

const ConfirmModal = forwardRef<ConfirmHandle, Props>(({ message, api }, ref) => {
    const { isLoadingAuth } = useAuthStore();
    const { isLoadingDel } = useSpeciesStore();
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    useImperativeHandle(ref, () => ({
        show: () => dialogRef.current?.showModal(),
    }));

    return (
        <>
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box flex flex-col justify-center items-center max-w-94">
                    <div className={`flex justify-center items-center size-16 rounded-2xl text-red-500 bg-red-200/50`}>
                        <TriangleAlert />
                    </div>
                    <p className="mt-2 p-4 text-[20px] font-semibold text-center">{message}</p>
                    <div className="flex justify-between w-full mt-4 px-4">
                        <button disabled={isLoadingAuth || isLoadingDel} className="btn w-[45%]" onClick={() => dialogRef.current?.close()}>
                            Hủy bỏ
                        </button>
                        <button
                            disabled={isLoadingAuth || isLoadingDel}
                            onClick={async () => {
                                await api();
                                dialogRef.current?.close();
                            }}
                            className={`btn btn-soft btn-error w-[45%]`}
                        >
                            {isLoadingAuth || isLoadingDel ? <LoaderCircle className="animate-spin" /> : "Tiếp tục"}
                        </button>
                    </div>
                </div>
            </dialog>
        </>
    );
});

export default ConfirmModal;
