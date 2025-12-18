import { useRef, forwardRef, useImperativeHandle, useState, type ChangeEvent } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { FileUp, LoaderCircle } from "lucide-react";

import useSpeciesStore from "../store/useAdminSpeciesStore";

export interface ImportSpeciesFormHandle {
    show: () => void;
}

interface ImportFormInput {
    speciesInfo: FileList;
}

const ImportSpeciesForm = forwardRef<ImportSpeciesFormHandle>((_, ref) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ImportFormInput>();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const { isLoadingAddAndUpdate, message, speciesImportLogs, importSpecies, clearMessagesAndLogs } = useSpeciesStore();

    useImperativeHandle(ref, () => ({
        show: () => dialogRef.current?.showModal(),
    }));

    const handleClose = () => {
        reset();
        setSelectedFile(null);
        clearMessagesAndLogs();
        dialogRef.current?.close();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        clearMessagesAndLogs();
        setSelectedFile(e.target.files ? e.target.files[0] : null);
    };

    const handleImport: SubmitHandler<ImportFormInput> = async (data) => {
        const file = data.speciesInfo[0];
        const res = await importSpecies(file);
        if (res) {
            handleClose();
        }
    };

    return (
        <>
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box relative min-h-[650px] min-w-[580px]">
                    {/* Close button */}
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={handleClose}>
                            ✕
                        </button>
                    </form>

                    {/* Form input */}
                    <form onSubmit={handleSubmit(handleImport)}>
                        <h3 className="font-bold text-lg">Tải sinh vật biển hàng loạt</h3>
                        <input
                            id="file-input"
                            className="hidden"
                            type="file"
                            accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            {...register("speciesInfo", {
                                required: "Vui lòng chọn tệp để tải lên",
                                validate: (file: FileList) => {
                                    if (
                                        file.length > 0 &&
                                        file[0].type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    ) {
                                        return "Chỉ chấp nhận định dạng xlsx";
                                    }
                                    return true;
                                },
                                onChange: handleFileChange,
                            })}
                        />

                        <label
                            className="flex flex-col justify-center items-center my-2 p-4 bg-blue-50 bg-opacity-50 border border-blue-200 border-dashed rounded-md cursor-pointer"
                            htmlFor="file-input"
                        >
                            <FileUp className="size-10 text-[#53baf8]" />
                            <p className="mt-2">Nhấp vào đây để chọn tệp</p>
                            <p className="text-sm italic text-gray-500">Hỗ trợ định dạng tệp .xlsx</p>
                        </label>

                        {/* Action button */}
                        <div className="flex justify-end absolute bottom-4 right-4 space-x-2 [&>button]:min-w-28">
                            <button
                                type="button"
                                className="btn btn-error btn-soft mt-4 border-red-100"
                                disabled={isLoadingAddAndUpdate}
                                onClick={handleClose}
                            >
                                Hủy bỏ
                            </button>
                            <button type="submit" disabled={isLoadingAddAndUpdate} className="btn btn-info btn-soft mt-4 border-blue-100">
                                {isLoadingAddAndUpdate ? <LoaderCircle className="animate-spin" /> : "Thêm hàng loạt"}
                            </button>
                        </div>
                    </form>

                    {/* Selected file info */}
                    <div className="relative my-2 px-4 py-2 bg-gray-50 bg-opacity-50 border border-gray-200 border-dashed rounded-md">
                        {selectedFile ? (
                            <>
                                <div>{selectedFile.name}</div>
                                <div>{(selectedFile.size / 1000000).toFixed(2)} MB</div>
                                <button
                                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-1/2 -translate-y-1/2"
                                    onClick={() => {
                                        reset();
                                        clearMessagesAndLogs();
                                        setSelectedFile(null);
                                    }}
                                >
                                    ✕
                                </button>
                            </>
                        ) : (
                            "Chưa chọn tệp"
                        )}
                    </div>

                    {/* Upload status */}
                    <div className="flex flex-col h-80">
                        <h3 className="mb-1 font-bold text-lg">Trạng thái tải lên</h3>
                        <div className="flex-1 flex justify-center items-center min-h-0 max-w-full">
                            {errors.speciesInfo && <span className="text-red-500 italic">{errors.speciesInfo.message}</span>}
                            {message && speciesImportLogs.length === 0 && <span className="text-red-500 italic">{message}</span>}
                            {speciesImportLogs.length > 0 && (
                                <div className="h-full overflow-y-auto rounded-box border border-base-content/5 bg-base-100">
                                    <table className="table table-zebra">
                                        <thead>
                                            <tr className="[&>th]:whitespace-normal">
                                                <th>Hàng</th>
                                                <th>Đã có trên hệ thống</th>
                                                <th>Thiếu tên sinh vật</th>
                                                <th>Thiếu tình trạng bảo tồn</th>
                                                <th>Tọa độ không hợp lệ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {speciesImportLogs.map((log) => (
                                                <tr key={log.rowNumber} className="text-center">
                                                    <th>{log.rowNumber}</th>
                                                    <td>{log.messages.includes("Species name already exists") && "✕"}</td>
                                                    <td>{log.messages.includes("Missing species name") && "✕"}</td>
                                                    <td>{log.messages.includes("Missing threatened symbol") && "✕"}</td>
                                                    <td>{log.messages.includes("Invalid lat/long") && "✕"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </dialog>
        </>
    );
});

export default ImportSpeciesForm;
