import { useState, useRef, forwardRef, useImperativeHandle, type ChangeEvent, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { BookOpenText, CircleAlert, Upload, Compass, Fingerprint, Gauge, Images, MapPinned, LoaderCircle } from "lucide-react";

import useSpeciesStore, { type Species } from "../store/useAdminSpeciesStore";

export interface SpeciesFormHandle {
    show: () => void;
}

interface Props {
    species?: Omit<Species, "images" | "points">;
}

export interface SpeciesFormInputs extends Omit<Species, "images" | "points"> {
    images: FileList;
    location: FileList;
}

const SpeciesForm = forwardRef<SpeciesFormHandle, Props>(({ species }, ref) => {
    const [images, setImages] = useState<string[] | null>(null);
    const [isCoverImage, setCoverImage] = useState<number>(0);
    const [chosenLocationFile, setLocationFile] = useState<File | null>(null);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SpeciesFormInputs>(species ? { defaultValues: species } : {});
    const { isLoadingAddAndUpdate, addSpecies, updateSpecies } = useSpeciesStore();
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    useImperativeHandle(ref, () => ({
        show: () => dialogRef.current?.showModal(),
    }));

    const handleClose = () => {
        reset({});
        images?.forEach((image) => URL.revokeObjectURL(image));
        setImages(null);
        setCoverImage(0);
        setLocationFile(null);
        dialogRef.current?.close();
    };

    const handleImages = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const imageUrls = Array.from(files).map((file) => URL.createObjectURL(file));

            if (imageUrls.length === 0) {
                setImages(null);
            } else {
                setImages(imageUrls);
            }
        }
    };

    const handleLocation = (e: ChangeEvent<HTMLInputElement>) => {
        setLocationFile(e.target.files ? e.target.files[0] : null);
    };

    const selectCoverImage = (index: number) => {
        setCoverImage(index);
    };

    const handleFormSubmit: SubmitHandler<SpeciesFormInputs> = async (data) => {
        const formData = new FormData();

        for (const [key, value] of Object.entries(data)) {
            if (!value) continue;

            if (value instanceof FileList) {
                for (let i = 0; i < value.length; i++) {
                    formData.append(key, value[i]);
                }
            } else {
                if (key === "scientific_name") {
                    formData.append("species", value);
                } else if (key === "vietnamese_name") {
                    formData.append("name", value);
                } else {
                    formData.append(key, String(value));
                }
            }
        }

        formData.append("coverImageIndex", isCoverImage.toString());

        if (!species) {
            await addSpecies(formData);
        } else {
            await updateSpecies(species.id, formData);
        }

        handleClose();
    };

    // Reset form values when `species` prop changes (react-hook-form uses defaultValues only on mount)
    useEffect(() => {
        if (species) {
            // Set form values to species data
            reset(species);
        } else {
            reset();
        }
    }, [species, reset]);

    return (
        <>
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box min-w-fit h-[850px]">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={handleClose}>
                            ✕
                        </button>
                    </form>
                    <form onSubmit={handleSubmit(handleFormSubmit)} className="w-fit px-4">
                        <div className="flex space-x-6">
                            <div className="flex flex-col">
                                {/* Basic information */}
                                <fieldset className="fieldset min-w-80 p-0 text-base">
                                    <div className="flex items-center">
                                        <CircleAlert className="size-5 mr-2" />
                                        <legend className="fieldset-legend text-md font-extrabold">Thông tin cơ bản</legend>
                                    </div>
                                    {/* species (name) */}
                                    <label className="label">Tên khoa học (species)</label>
                                    <input
                                        className={errors.scientific_name ? "input border-red-500" : "input"}
                                        type="text"
                                        {...register("scientific_name", {
                                            required: "Vui lòng nhập trường này",
                                        })}
                                    />
                                    {errors.scientific_name && (
                                        <span className="text-red-500 italic">{errors.scientific_name.message}</span>
                                    )}
                                    {/* name (in Vietnamese) */}
                                    <label className="label">Tên tiếng Việt (Vietnamese name)</label>
                                    <input className="input" type="text" {...register("vietnamese_name")} />
                                    {/* species_group */}
                                    <label className="label">Nhóm (group)</label>
                                    <input className="input" type="text" {...register("group_species")} />
                                    {/* Phylum */}
                                    <label className="label">Ngành (phylum)</label>
                                    <input className="input" type="text" {...register("phylum")} />
                                    {/* Class */}
                                    <label className="label">Lớp (class)</label>
                                    <input className="input" type="text" {...register("class")} />
                                    {/* Order_species */}
                                    <label className="label">Bộ (order)</label>
                                    <input className="input" type="text" {...register("order_species")} />
                                    {/* Family */}
                                    <label className="label">Họ (family)</label>
                                    <input className="input" type="text" {...register("family")} />
                                    {/* Genus */}
                                    <label className="label">Giống (genus)</label>
                                    <input className="input" type="text" {...register("genus")} />
                                </fieldset>

                                {/* Threatened */}
                                <fieldset className="fieldset min-w-80 mt-4 p-0 text-base">
                                    <div className="flex items-center">
                                        <Gauge className="size-5 mr-2" />
                                        <legend className="fieldset-legend text-md font-extrabold">Tình trạng bảo tồn</legend>
                                    </div>
                                    <select
                                        {...register("threatened_symbol")}
                                        className="select text-base"
                                        defaultValue="Chưa được đánh giá (NE)"
                                    >
                                        <option className="text-[#dfe0e2] font-bold">Chưa được đánh giá (NE)</option>
                                        <option className="text-[#949596] font-bold">Thiếu dẫn liệu (DD)</option>
                                        <option className="text-[#66bd4d] font-bold">Ít lo ngại (LC)</option>
                                        <option className="text-[#d7df21] font-bold">Gần bị đe dọa (NT)</option>
                                        <option className="text-[#e9b009] font-bold">Sẽ nguy cấp (VU)</option>
                                        <option className="text-[#f7941d] font-bold">Nguy cấp (EN)</option>
                                        <option className="text-[#bf1e2e] font-bold">Cực kỳ nguy cấp (CR)</option>
                                        <option className="text-[#7f1b7d] font-bold">Tuyệt chủng ngoài tự nhiên (EW)</option>
                                        <option className="text-[#000000] font-bold">Tuyệt chủng (EX)</option>
                                    </select>
                                </fieldset>
                            </div>

                            <div className="flex flex-col">
                                {/* Distribution */}
                                <fieldset className="fieldset flex-1 flex flex-col min-w-80 p-0 text-base">
                                    <div className="flex items-center">
                                        <MapPinned className="size-5 mr-2" />
                                        <legend className="fieldset-legend text-md font-extrabold">Phân bố</legend>
                                    </div>
                                    {/* Habitas */}
                                    <div className="flex-1 flex flex-col">
                                        <label className="label">Nơi sống (habitas)</label>
                                        <textarea {...register("habitas")} className="textarea flex-1"></textarea>
                                    </div>
                                    {/* VN distribution */}
                                    <div className="flex-1 flex flex-col">
                                        <label className="label">Phân bố Việt Name (vn_distribution)</label>
                                        <textarea {...register("vn_distribution")} className="textarea flex-1"></textarea>
                                    </div>
                                    {/* Global distribution */}
                                    <div className="flex-1 flex flex-col">
                                        <label className="label">Phân bố thế giới (global_distribution)</label>
                                        <textarea {...register("global_distribution")} className="textarea flex-1"></textarea>
                                    </div>
                                </fieldset>
                            </div>

                            {/* Characteristic */}
                            <fieldset className="fieldset flex flex-col min-w-80 p-0 text-base">
                                <div className="flex items-center">
                                    <Fingerprint className="size-5 mr-2" />
                                    <legend className="fieldset-legend text-md font-extrabold">Đặc điểm</legend>
                                </div>
                                {/* Description */}
                                <div className="flex-1 flex flex-col">
                                    <label className="label">Mô tả (description)</label>
                                    <textarea {...register("description")} className="textarea flex-1"></textarea>
                                </div>
                                {/* Characteristic */}
                                <div className="flex-1 flex flex-col">
                                    <label className="label">Đặc điểm (characteristic)</label>
                                    <textarea {...register("characteristic")} className="textarea flex-1"></textarea>
                                </div>
                                {/* Impact */}
                                <div className="flex-1 flex flex-col">
                                    <label className="label">Vai trò (impact)</label>
                                    <textarea {...register("impact")} className="textarea flex-1"></textarea>
                                </div>
                            </fieldset>

                            <div className="flex flex-col">
                                {/* Image */}
                                <fieldset className="fieldset min-w-80 p-0 text-base">
                                    <div className="flex items-center">
                                        <Images className="size-5 mr-2" />
                                        <legend className="fieldset-legend text-md font-extrabold">Hình ảnh</legend>
                                    </div>
                                    <input
                                        id="image-files-input"
                                        className="hidden"
                                        multiple
                                        type="file"
                                        accept="image/*"
                                        {...register("images", {
                                            validate: (imageList: FileList) => {
                                                if (!imageList || imageList.length === 0 || Array.isArray(imageList)) {
                                                    return true;
                                                }

                                                return (
                                                    Array.from(imageList).every((file) => file.type.startsWith("image/")) ||
                                                    "Chỉ chấp nhận file ảnh"
                                                );
                                            },
                                            onChange: (e: ChangeEvent<HTMLInputElement>) => handleImages(e),
                                        })}
                                    />
                                    <label className="btn btn-info btn-soft hover:text-white" htmlFor="image-files-input">
                                        <Upload className="size-4" />
                                        Chọn tệp ảnh
                                    </label>
                                    {errors.images && <span className="text-red-500 italic">{errors.images.message}</span>}

                                    {/* Image preview */}
                                    {images && (
                                        <>
                                            <div className="flex justify-center items-center max-w-[320px] space-x-1 overflow-x-auto">
                                                {images?.map((image, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative shrink-0 cursor-pointer"
                                                        onClick={() => {
                                                            selectCoverImage(index);
                                                        }}
                                                    >
                                                        <img className="size-64 rounded-lg border border-base-300" src={image}></img>
                                                        {index === isCoverImage && (
                                                            <div className="absolute right-3 top-3 px-3 font-bold text-white bg-blue-400 rounded-lg select-none">
                                                                Ảnh bìa
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="label italic">Chọn vào ảnh để chọn ảnh bìa</p>
                                        </>
                                    )}
                                </fieldset>

                                {/* Coordinate */}
                                <fieldset className="fieldset min-w-80 mt-4 p-0 text-base">
                                    <div className="flex items-center">
                                        <Compass className="size-5 mr-2" />
                                        <legend className="fieldset-legend text-md font-extrabold">Tọa độ</legend>
                                    </div>

                                    <input
                                        id="location-file-input"
                                        className="hidden"
                                        type="file"
                                        accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                        {...register("location", {
                                            validate: (location: FileList) => {
                                                if (
                                                    location.length > 0 &&
                                                    location[0].type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                                ) {
                                                    return "Chỉ chấp nhận định dạng xlsx";
                                                }
                                                return true;
                                            },
                                            onChange: handleLocation,
                                        })}
                                    />
                                    <label className="btn btn-info btn-soft hover:text-white" htmlFor="location-file-input">
                                        <Upload className="size-4" /> Chọn tệp vị trí
                                    </label>
                                    {errors.location && <span className="text-red-500 italic">{errors.location.message}</span>}

                                    {/* Selected location file info */}
                                    {chosenLocationFile && (
                                        <div className="relative my-2 px-4 py-2 bg-gray-50 bg-opacity-50 border border-gray-200 border-dashed rounded-md">
                                            <div>{chosenLocationFile.name}</div>
                                            <div>{(chosenLocationFile.size / 1000000).toFixed(2)} MB</div>
                                            <button
                                                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-1/2 -translate-y-1/2"
                                                onClick={() => {
                                                    setLocationFile(null);
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </fieldset>

                                {/* References */}
                                <fieldset className="fieldset flex-1 flex flex-col min-w-80 mt-4 p-0 text-base">
                                    <div className="flex items-center">
                                        <BookOpenText className="size-5 mr-2" />
                                        <legend className="fieldset-legend text-md font-extrabold">Tài liệu tham khảo</legend>
                                    </div>
                                    <label className="label">Tài liệu tham khảo (references_text)</label>
                                    <textarea {...register("references_text")} className="textarea flex-1"></textarea>
                                    <p className="label italic">Enter để xuống dòng tài liệu</p>
                                </fieldset>
                            </div>
                        </div>

                        {/* Action button */}
                        <div className="flex justify-end space-x-2 [&>button]:min-w-28">
                            <button
                                type="button"
                                className="btn btn-error btn-soft mt-4 border-red-100"
                                disabled={isLoadingAddAndUpdate}
                                onClick={handleClose}
                            >
                                Hủy bỏ
                            </button>
                            <button type="submit" disabled={isLoadingAddAndUpdate} className="btn btn-info btn-soft mt-4 border-blue-100">
                                {isLoadingAddAndUpdate ? <LoaderCircle className="animate-spin" /> : species ? "Cập nhật" : "Thêm"}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>
        </>
    );
});

export default SpeciesForm;
