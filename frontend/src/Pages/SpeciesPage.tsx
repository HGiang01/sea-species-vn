import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Fingerprint, MapPinHouse, Leaf, ScrollText, BookOpenText, Globe, Star } from "lucide-react";

import Navbar from "../components/Navbar";
import Map from "../components/Map.tsx";
import useUserSpeciesStore from "../store/useUserSpecieStore";
import taxonParser from "../libs/taxonParser.ts";

function SpeciesPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const { species, taxonomy, isLoading, fetchSpeciesById, fetchTaxonomy } = useUserSpeciesStore();
    const parsedScientificName = taxonParser(species?.scientific_name || "");

    const taxonomyMapping = {
        phylum: "Ngành",
        class: "Lớp",
        order_species: "Bộ",
        family: "Họ",
        genus: "Giống",
    };
    const threatenedSymbolColors: Record<string, string> = {
        "Chưa được đánh giá (NE)": "bg-[#dfe0e2]",
        "Thiếu dẫn liệu (DD)": "bg-[#949596]",
        "Ít lo ngại (LC)": "bg-[#66bd4d]",
        "Gần bị đe dọa (NT)": "bg-[#d7df21]",
        "Sẽ nguy cấp (VU)": "bg-[#e9b009]",
        "Nguy cấp (EN)": "bg-[#f7941d]",
        "Cực kỳ nguy cấp (CR)": "bg-[#bf1e2e]",
        "Tuyệt chủng ngoài tự nhiên (EW)": "bg-[#7f1b7d]",
        "Tuyệt chủng (EX)": "bg-[#000000]",
    };

    const selectImage = (imageUrl: string) => {
        setSelectedImageUrl(imageUrl);
    };

    const handleTaxonomyClick = (level: string, value: string) => {
        const filterPayload = {
            group_species: [],
            phylum: [],
            class: [],
            order_species: [],
            family: [],
            genus: [],
            threatened_symbol: [],
            [level]: [value],
        };

        navigate("/home", { state: { filters: filterPayload } });
    };

    useEffect(() => {
        fetchSpeciesById(id as string);
        fetchTaxonomy(id as string);
    }, [id, fetchSpeciesById, fetchTaxonomy]);

    useEffect(() => {
        if (species?.images) {
            const coverImage = species.images.find((image) => image.is_cover);
            if (coverImage) {
                setSelectedImageUrl(coverImage.image_url);
            } else if (species.images.length > 0) {
                setSelectedImageUrl(species.images[0].image_url);
            }
        }
    }, [species?.images]);

    if (isLoading || !species) {
        return (
            <>
                <Navbar />
                <div className="flex flex-col w-full h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] p-4 gap-4 items-center justify-center">
                    <span className="loading loading-spinner loading-lg text-blue-500"></span>
                    <p className="text-lg text-gray-500">Đang tải dữ liệu...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="flex flex-col w-full h-[calc(100vh-64px)] p-4 pt-0 pb-2">
                {/* Breadcrumbs of taxonomy */}
                <div className="breadcrumbs min-h-fit text-sm p-2">
                    <ul>
                        <li>
                            <Link to="/home">Trang chủ</Link>
                        </li>
                        {taxonomy &&
                            taxonomy.map((i) => (
                                <li key={i.level} className="relative">
                                    <button
                                        onClick={() => handleTaxonomyClick(i.level as string, i.value as string)}
                                        className="flex items-center gap-1 hover:underline cursor-pointer"
                                    >
                                        <span>{`${i.value} (${taxonomyMapping[i.level as keyof typeof taxonomyMapping]})`}</span>
                                        <span className="px-1 rounded-sm bg-black/50 text-white">{i.count}</span>
                                    </button>
                                </li>
                            ))}
                        <li>{species?.scientific_name}</li>
                    </ul>
                </div>

                <div className="flex flex-1 h-[calc(100%-36px)]">
                    {/* Information */}
                    <div className="flex flex-[70%] h-full">
                        <div className="flex flex-col">
                            {/* Images */}
                            <div>
                                <div className="relative select-none">
                                    <img
                                        src={selectedImageUrl!}
                                        alt={species?.scientific_name}
                                        className="size-[500px] rounded-lg overflow-hidden border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4),0_0_40px_rgba(59,130,246,0.2)] select-none pointer-events-none"
                                        draggable={false}
                                    />
                                    <div className="absolute top-2 left-2 px-4 py-1 text-lg rounded-full bg-blue-500 text-white select-none pointer-events-none">
                                        {species?.images.length}
                                    </div>
                                </div>
                                <div className="flex justify-start items-center w-[500px] h-26 mt-1 gap-1 overflow-x-auto scrollbar-hide select-none">
                                    {species?.images &&
                                        species.images.map((image) => (
                                            <img
                                                key={image.public_id}
                                                src={image.image_url}
                                                alt={species?.scientific_name}
                                                className={`inline-block size-22 rounded-lg border-4 ${
                                                    selectedImageUrl === image.image_url
                                                        ? "border-blue-500"
                                                        : "border-transparent opacity-80 brightness-60 hover:opacity-100 hover:brightness-100"
                                                } cursor-pointer select-none`}
                                                onClick={() => selectImage(image.image_url)}
                                                draggable={false}
                                            />
                                        ))}
                                </div>
                            </div>

                            {/* identification information */}
                            <div className="flex-1 flex flex-col px-4 py-2 rounded-lg overflow-hidden border-2 border-slate-300 shadow-lg">
                                <div className="flex gap-4">
                                    <div>
                                        <h1 className="text-lg font-semibold">Tình trạng bảo tồn</h1>
                                        <div
                                            className={`${
                                                threatenedSymbolColors[species?.threatened_symbol || ""]
                                            } rounded-lg py-1 px-4 text-white `}
                                        >
                                            {species?.threatened_symbol}
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-semibold">Nhóm</h1>
                                        <div className="bg-blue-500 rounded-lg py-1 px-4 text-white">
                                            {species?.group_species || "Đang cập nhật..."}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <h1 className="text-lg font-semibold">Mã định danh</h1>
                                    <div className="select-text">{species?.id}</div>
                                </div>
                                <div className="col-span-2">
                                    <h1 className="text-lg font-semibold">Ngày cập nhật gần nhất</h1>
                                    <div>{species?.updated_at}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center px-4">
                            {/* Name */}
                            <div className="w-full">
                                <h1 className="text-[28px] font-extrabold tracking-tight">
                                    <span className="italic text-slate-800">{parsedScientificName.name}</span>
                                    <span className="ml-2 text-slate-500">{parsedScientificName.author}</span>
                                </h1>
                                <p className="text-lg tracking-tight text-gray-500 font-semibold">
                                    Tên tiếng Việt: {species?.vietnamese_name || "Chưa có"}
                                </p>
                            </div>
                            <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2 h-full mt-2">
                                <div className="px-4 py-2 rounded-lg overflow-hidden border-2 border-slate-300 shadow-lg">
                                    <div className="flex items-center gap-2">
                                        <ScrollText className="size-6" />
                                        <h1 className="text-xl font-extrabold">Mô tả</h1>
                                    </div>
                                    <div className="max-h-60 p-2 overflow-y-auto whitespace-pre-line text-justify wrap-break-word overflow-x-hidden">
                                        {species?.description || "Đang cập nhật..."}
                                    </div>
                                </div>

                                <div className="px-4 py-2 rounded-lg overflow-hidden border-2 border-slate-300 shadow-lg">
                                    <div className="flex items-center gap-2">
                                        <Fingerprint className="size-6" />
                                        <h1 className="text-xl font-extrabold">Đặc điểm</h1>
                                    </div>
                                    <div className="max-h-60 p-2 overflow-y-auto whitespace-pre-line text-justify wrap-break-word overflow-x-hidden">
                                        {species?.characteristic || "Đang cập nhật..."}
                                    </div>
                                </div>

                                <div className="px-4 py-2 rounded-lg overflow-hidden border-2 border-slate-300 shadow-lg">
                                    <div className="flex items-center gap-2">
                                        <MapPinHouse className="size-6" />
                                        <h1 className="text-xl font-extrabold">Nơi sống</h1>
                                    </div>
                                    <div className="max-h-60 p-2 overflow-y-auto whitespace-pre-line text-justify wrap-break-word overflow-x-hidden">
                                        {species?.habitas || "Đang cập nhật..."}
                                    </div>
                                </div>

                                <div className="px-4 py-2 rounded-lg overflow-hidden border-2 border-slate-300 shadow-lg">
                                    <div className="flex items-center gap-2">
                                        <Leaf className="size-6" />
                                        <h1 className="text-xl font-extrabold">Vai trò</h1>
                                    </div>
                                    <div className="max-h-60 p-2 overflow-y-auto whitespace-pre-line text-justify wrap-break-word overflow-x-hidden">
                                        {species?.impact || "Đang cập nhật..."}
                                    </div>
                                </div>
                            </div>

                            {/* References */}
                            <div className="w-full mt-2 px-4 py-2 rounded-lg overflow-hidden border-2 border-slate-300 shadow-lg">
                                <div className="flex items-center gap-2">
                                    <BookOpenText className="size-6" />
                                    <h1 className="text-xl font-extrabold">Tài liệu tham khảo</h1>
                                </div>
                                <div className="max-h-23 overflow-y-auto whitespace-pre-line text-justify wrap-break-word overflow-x-hidden">
                                    {species?.references_text || "Đang cập nhật..."}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Distribution */}
                    <div className="flex-[30%] relative max-h-full rounded-lg overflow-hidden border-2 border-slate-300 shadow-lg">
                        <Map data={species?.points || []} />

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 collapse collapse-arrow w-[calc(100%-2rem)] bg-base-100 border-base-300 border z-1000">
                            <input type="checkbox" />
                            <div className="collapse-title font-semibold">Xem chi tiết phân bố</div>
                            <div className="collapse-content space-y-2 text-sm">
                                <div>
                                    <div className="flex justify-start items-center gap-2">
                                        <Star className="size-5.5 p-1 bg-red-500 fill-amber-300 text-yellow-300 rounded-full" />
                                        <h1 className="font-bold">Việt Nam</h1>
                                    </div>
                                    <p className="pl-7.5">{species?.vn_distribution || "đang cập nhật..."}</p>
                                </div>
                                <div>
                                    <div className="flex justify-start items-center gap-2">
                                        <Globe className="size-5.5 p-1 bg-blue-500 text-white rounded-full" />
                                        <h1 className="font-bold">Thế giới</h1>
                                    </div>
                                    <p className="pl-7.5">{species?.global_distribution || "Đang cập nhật..."}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SpeciesPage;
