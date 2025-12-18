import { useRef, forwardRef, useImperativeHandle, useEffect } from "react";

import { type images, type points } from "../store/useAdminSpeciesStore";

export interface SpeciesViewerHandle {
    show: () => void;
}

export interface SpeciesViewerProps {
    type?: "image" | "location";
    data?: unknown;
}

const SpeciesViewer = forwardRef<SpeciesViewerHandle, SpeciesViewerProps>(({ type, data }, ref) => {
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    useImperativeHandle(ref, () => ({
        show: () => dialogRef.current?.showModal(),
    }));

    useEffect(() => {}, [type, data]);
    return (
        <>
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box flex flex-col space-y-3 min-w-[650px]">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>

                    {/* Image */}
                    {type === "image" && Array.isArray(data) && (
                        <div className="flex justify-center-safe items-center space-x-1 overflow-auto">
                            {(data as images[]).map((image: images, index: number) => (
                                <div className="relative min-w-fit">
                                    <img
                                        key={index}
                                        src={image.image_url}
                                        alt={`Species Preview ${index + 1}`}
                                        className="size-64 rounded-lg border border-base-300"
                                    />
                                    {image.is_cover && (
                                        <div className="absolute right-3 top-3 px-3 font-bold text-white bg-blue-400 rounded-lg select-none">
                                            Ảnh bìa
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Location */}
                    {type === "location" && Array.isArray(data) && (
                        <div>
                            <table className="table table-zebra">
                                <thead>
                                    <tr className="[&>th]:text-center">
                                        <th>Id</th>
                                        <th>Latitude</th>
                                        <th>Longitude</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data as points[]).map((location: points, index: number) => (
                                        <tr key={index} className="text-center">
                                            <th>{location.id}</th>
                                            <td>{location.lat}</td>
                                            <td>{location.lng}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </dialog>
        </>
    );
});

export default SpeciesViewer;
