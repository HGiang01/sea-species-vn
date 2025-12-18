import { useRef, useState, useEffect, type MouseEvent, type KeyboardEvent } from "react";
import { ToastContainer } from "react-toastify";
import {
    Plus,
    Upload,
    RefreshCcw,
    SlidersHorizontal,
    ArrowDownUp,
    Image,
    Compass,
    SquarePen,
    Trash2,
    ArrowUp,
    ChevronDown,
    Search,
    X,
} from "lucide-react";

import noImageAvatar from "../assets/no-photo.jpg";
import Navbar from "../components/Navbar";
import SpeciesForm, { type SpeciesFormHandle } from "../components/SpeciesForm";
import ImportSpeciesForm, { type ImportSpeciesFormHandle } from "../components/ImportSpeciesForm";
import SpeciesViewer, { type SpeciesViewerHandle, type SpeciesViewerProps } from "../components/SpeciesViewer";
import ConfirmModal, { type ConfirmHandle } from "../components/ConfirmDialog";
import useSpeciesStore, { type Species, type SpeciesGallery } from "../store/useAdminSpeciesStore";
import speciesNotFound from "../assets/species-not-found.png";

type AllowedTargets = "search" | "filterTags" | "sort" | "allCheckbox" | "filterDialog" | "query";

function Dashboard() {
    // Refs
    const tableRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const addFunctionRef = useRef<SpeciesFormHandle | null>(null);
    const importFunctionRef = useRef<ImportSpeciesFormHandle | null>(null);
    const selectAllCheckboxRef = useRef<HTMLInputElement | null>(null);
    const selectedIdRef = useRef<string | null>(null);
    const viewerRef = useRef<SpeciesViewerHandle | null>(null);
    const confirmDeleteRef = useRef<ConfirmHandle | null>(null);
    const confirmMultiDeleteRef = useRef<ConfirmHandle | null>(null);

    // States
    const [inputValue, setInputValue] = useState<string>("");
    const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
    const [currentFilterGroup, setCurrentFilterGroup] = useState<string>("group_species");
    const [selectedFilterTags, setSelectedFilterTags] = useState<Record<string, string[]>>({
        group_species: [],
        phylum: [],
        class: [],
        order_species: [],
        family: [],
        genus: [],
        threatened_symbol: [],
    });
    const [sortValue, setSortValue] = useState<string>("");
    const [speciesSearchPreview, setSpeciesSearchPreview] = useState<SpeciesGallery[]>([]);
    const [checkedIds, setCheckedIds] = useState<string[]>([]);
    const [hiddenIds, setHiddenIds] = useState<string[]>([]);
    const [viewerProps, setViewerProps] = useState<SpeciesViewerProps | undefined>(undefined);
    const [editingSpecies, setEditingSpecies] = useState<Omit<Species, "images" | "points"> | undefined>(undefined);
    const [query, setQuery] = useState<{ [key: string]: string | boolean | string[] } | null>(null);
    const { speciesList, tagList, isLoadingRec, cursor, searchSpecies, fetchSpecies, fetchSpeciesById, deleteSpecies, fetchFilterTags } =
        useSpeciesStore();

    // Mappings
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
    const filterGroups: Record<string, string> = {
        Nhóm: "group_species",
        Ngành: "phylum",
        Lớp: "class",
        Bộ: "order_species",
        Họ: "family",
        Giống: "genus",
        "Tình trạng bảo tồn": "threatened_symbol",
    };
    const sortOptions: Record<string, string> = {
        "Mặc định": "",
        "Ngày tạo (Mới đến cũ)": "created_at:desc",
        "Ngày tạo (Cũ đến mới)": "created_at:asc",
        "Ngày cập nhật (Mới đến cũ)": "updated_at:desc",
        "Ngày cập nhật (Cũ đến mới)": "updated_at:asc",
        "Tên khoa học (A đến Z)": "species:asc",
        "Tên khoa học (Z đến A)": "species:desc",
        "Tên tiếng Việt (A đến Z)": "name:asc",
        "Tên tiếng Việt (Z đến A)": "name:desc",
    };

    // Search handlers
    const clearSearchInput = () => {
        setInputValue("");
        inputRef.current?.focus();
    };

    const handleSearchSubmit = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && inputValue.trim()) {
            setQuery({ species: inputValue.trim(), name: inputValue.trim() });

            reset(["search", "filterTags", "sort", "filterDialog", "allCheckbox"]);
        }
    };

    // Filter handlers
    const switchFilterGroup = (e: MouseEvent<HTMLButtonElement>) => {
        if (!tagList) return;
        setCurrentFilterGroup(e.currentTarget.value);
    };

    const toggleFilterTag = (e: MouseEvent<HTMLButtonElement>) => {
        const [group, value] = e.currentTarget.value.split(":");
        if (selectedFilterTags[group].includes(value)) {
            setSelectedFilterTags((prev) => ({ ...prev, [group]: prev[group].filter((tag) => tag !== value) }));
        } else {
            setSelectedFilterTags((prev) => ({ ...prev, [group]: [...prev[group], value] }));
        }
    };

    const applyFilters = () => {
        setQuery((prev) => ({ ...prev, ...selectedFilterTags }));

        reset(["filterDialog", "allCheckbox"]);
    };

    const clearFilters = () => {
        setSelectedFilterTags({
            group_species: [],
            phylum: [],
            class: [],
            order_species: [],
            family: [],
            genus: [],
            threatened_symbol: [],
        });
        setQuery((prev) => {
            if (!prev) return null;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { group_species, phylum, class: classFilter, order_species, family, genus, threatened_symbol, ...rest } = prev;
            return rest;
        });
    };

    // Sort handlers
    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value) {
            setSortValue(value);
            const [order, dir] = value.split(":");
            setQuery((prev) => ({ ...prev, order, dir }));
        } else {
            setSortValue("");
            setQuery((prev) => {
                if (!prev) return null;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { order, dir, ...rest } = prev;
                return rest;
            });
        }
    };

    const closeFilterOnSort = () => {
        reset(["filterDialog"]);
    };

    // Add handlers
    const handleAdd = () => {
        setEditingSpecies(undefined);
        addFunctionRef.current?.show();
    };

    // Delete handlers
    const toggleSelectAll = () => {
        if (checkedIds.length === 0) {
            setCheckedIds(speciesList.map((species) => species.id));
        } else {
            setCheckedIds([]);
        }
    };

    const toggleItemId = (id: string) => {
        if (checkedIds.includes(id)) {
            setCheckedIds((prev) => prev.filter((checkedId) => checkedId !== id));
        } else {
            setCheckedIds((prev) => [...prev, id]);
        }
    };

    const handleSingleDelete = async () => {
        if (!selectedIdRef.current) return;
        const res = await deleteSpecies([selectedIdRef.current]);
        setHiddenIds((prev) => [...prev, ...res]);
    };

    const handleMultiDelete = async () => {
        const res = await deleteSpecies(checkedIds);
        setHiddenIds((prev) => [...prev, ...res]);

        reset(["allCheckbox"]);
    };

    // Edit handlers
    const handleEdit = async () => {
        if (!selectedIdRef.current) return;

        const species = await fetchSpeciesById(selectedIdRef.current);
        if (species) {
            setEditingSpecies(species);
            addFunctionRef.current?.show();
        }

        reset(["search", "filterDialog"]);
    };

    // Load more
    const handleLoadMore = () => {
        fetchSpecies(query, "add");
    };

    // Utility handlers
    const handleRefresh = () => {
        fetchSpecies({}, "reset");
        fetchFilterTags();

        reset(["search", "filterTags", "sort", "allCheckbox", "filterDialog", "query"]);
    };

    const reset = (targets: AllowedTargets[]) => {
        for (let i = 0; i < targets.length; i++) {
            if (targets[i] === "search") {
                clearSearchInput();
            } else if (targets[i] === "filterTags") {
                clearFilters();
            } else if (targets[i] === "sort") {
                setSortValue("");
            } else if (targets[i] === "allCheckbox") {
                setCheckedIds([]);
                if (selectAllCheckboxRef.current) selectAllCheckboxRef.current.checked = false;
            } else if (targets[i] === "filterDialog") {
                setIsFilterOpen(false);
            } else if (targets[i] === "query") {
                setQuery(null);
            }
        }
    };

    // Debounce input
    useEffect(() => {
        if (!inputValue.trim()) return;
        const timer = setTimeout(() => {
            searchSpecies({ species: inputValue.trim(), name: inputValue.trim() }).then((species) => setSpeciesSearchPreview(species));
        }, 500);

        return () => clearTimeout(timer);
    }, [inputValue, searchSpecies]);

    // Fetch on query change
    useEffect(() => {
        if (!query) return;
        fetchSpecies(query, "change");
    }, [query, fetchSpecies]);

    // Initial fetch
    useEffect(() => {
        fetchSpecies(null, "reset");
        fetchFilterTags();
    }, [fetchSpecies, fetchFilterTags]);

    return (
        <>
            <ToastContainer />
            <Navbar />
            <div className="p-4">
                {/* Functions */}
                <div className="flex justify-between items-center">
                    <div className="flex justify-center items-center space-x-4 z-2">
                        {/* Search */}
                        <div className="relative w-lg">
                            {/* Input */}
                            {!inputValue && <Search className="absolute top-1/2 -translate-y-1/2 left-3 z-2" />}
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                placeholder="Tìm kiếm..."
                                className="input w-full px-11 border-black"
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleSearchSubmit}
                            />
                            {inputValue && (
                                <X className="absolute top-1/2 -translate-y-1/2 left-3 z-2 cursor-pointer" onClick={clearSearchInput} />
                            )}

                            {/* Search preview */}
                            {inputValue && (
                                <div className="absolute top-full left-0 w-full mt-2 p-2 bg-base-100 text-base text-left rounded-box shadow-md z-3">
                                    <ul className="list">
                                        {speciesSearchPreview.length > 0 ? (
                                            speciesSearchPreview.map((species, index) => {
                                                // Limit to 10 items
                                                if (index >= 10) return null;

                                                return (
                                                    <li
                                                        className="list-row flex justify-center items-center cursor-pointer hover:bg-base-300"
                                                        onClick={() => {
                                                            selectedIdRef.current = species.id;
                                                            handleEdit();
                                                        }}
                                                        key={index}
                                                    >
                                                        <div>
                                                            <img
                                                                className="size-10 rounded-box object-cover"
                                                                src={
                                                                    species.images?.find((img) => img.is_cover)?.image_url || noImageAvatar
                                                                }
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div>{species.scientific_name}</div>
                                                            <div className="text-xs uppercase font-semibold opacity-60">
                                                                {species.vietnamese_name}
                                                            </div>
                                                        </div>
                                                        <div
                                                            className={`size-4 rounded-full ${
                                                                threatenedSymbolColors[species.threatened_symbol]
                                                            }`}
                                                        ></div>
                                                    </li>
                                                );
                                            })
                                        ) : (
                                            <li className="p-2">Không tìm thấy kết quả nào phù hợp</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Filter */}
                        <div className="relative">
                            <div
                                className={
                                    "flex justify-center items-center px-4 py-2 font-semibold rounded-md cursor-pointer " +
                                    ((Array.isArray(query?.group_species) && query.group_species.length > 0) ||
                                    (Array.isArray(query?.phylum) && query.phylum.length > 0) ||
                                    (Array.isArray(query?.class) && query.class.length > 0) ||
                                    (Array.isArray(query?.order_species) && query.order_species.length > 0) ||
                                    (Array.isArray(query?.family) && query.family.length > 0) ||
                                    (Array.isArray(query?.genus) && query.genus.length > 0) ||
                                    (Array.isArray(query?.threatened_symbol) && query.threatened_symbol.length > 0)
                                        ? "bg-blue-500 text-white"
                                        : "hover:bg-base-300")
                                }
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                            >
                                <SlidersHorizontal className="size-5.5 mr-2" />
                                <p>Bộ lọc</p>
                            </div>

                            {isFilterOpen && (
                                <div
                                    className="absolute top-full flex flex-col left-0 w-3xl min-w-0 h-[380px] mt-2 p-4 bg-base-100 rounded-md border border-base-300 shadow-md cursor-default"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex-1 flex min-h-0">
                                        <div className="flex flex-col justify-evenly items-center space-y-1 [&>button]:hover:bg-base-300">
                                            {Object.keys(filterGroups).map((group) => (
                                                <button
                                                    className={
                                                        "flex justify-between items-center w-48 px-4 py-2 rounded-md cursor-pointer " +
                                                        (selectedFilterTags[filterGroups[group]].length > 0 &&
                                                            "bg-blue-100/40 text-blue-500")
                                                    }
                                                    key={group}
                                                    value={filterGroups[group]}
                                                    onClick={switchFilterGroup}
                                                >
                                                    <span>{group}</span>
                                                    {selectedFilterTags[filterGroups[group]].length > 0 && (
                                                        <div>{selectedFilterTags[filterGroups[group]].length}</div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="divider divider-horizontal"></div>
                                        <div className="flex-1 space-x-2 space-y-2 overflow-y-auto *:inline-block *:max-h-fit *:px-4 *:py-2 *:font-normal *:text-left *:bg-base-200 *:cursor-pointer *:hover:bg-base-300 *:rounded-md">
                                            {tagList &&
                                                tagList[currentFilterGroup as keyof typeof tagList].map((item) => (
                                                    <button
                                                        className={
                                                            selectedFilterTags[currentFilterGroup].includes(item)
                                                                ? "bg-blue-100/40 text-blue-500"
                                                                : ""
                                                        }
                                                        key={item}
                                                        value={`${currentFilterGroup}:${item}`}
                                                        onClick={toggleFilterTag}
                                                    >
                                                        {item}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                    <div className="self-end space-x-2 mt-4 [&>button]:w-20">
                                        <button type="button" className="btn" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                                            Đóng
                                        </button>
                                        <button type="button" className="btn" onClick={clearFilters}>
                                            Đặt lại
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn bg-blue-500 text-white hover:bg-blue-600"
                                            onClick={applyFilters}
                                        >
                                            Lọc
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sort */}
                        <div className="flex justify-center items-center space-x-2">
                            <ArrowDownUp />
                            <p className="min-w-fit font-semibold">Sắp xếp theo:</p>
                            <select
                                className="select select-bordered min-w-66 text-md cursor-pointer"
                                value={sortValue}
                                onChange={handleSortChange}
                                onClick={closeFilterOnSort}
                            >
                                {sortOptions &&
                                    Object.entries(sortOptions).map(([label, value]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {query?.species && (
                        <div className="flex-1 mr-4 text-base text-end text-gray-600">
                            Tìm kiếm: <span className="font-semibold text-blue-600">"{query.species || query.name}"</span>
                        </div>
                    )}

                    <div className="flex items-center *:px-4">
                        <button className="btn btn-ghost rounded-md hover:text-white hover:bg-green-500" onClick={handleAdd}>
                            <Plus />
                        </button>
                        <button
                            className="btn btn-ghost rounded-md hover:text-white hover:bg-green-500"
                            onClick={() => importFunctionRef.current?.show()}
                        >
                            <Upload />
                        </button>
                        <button
                            className="btn btn-ghost rounded-md hover:text-white hover:bg-red-500"
                            onClick={() => confirmMultiDeleteRef.current?.show()}
                        >
                            <Trash2 />
                        </button>
                        <button className="btn btn-ghost rounded-md hover:text-white hover:bg-blue-500" onClick={handleRefresh}>
                            <RefreshCcw />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div
                    ref={tableRef}
                    className="relative flex flex-col w-full max-w-[100vw] overflow-x-hidden overflow-y-auto max-h-[calc(100vh-148px)] mt-3 shadow-md rounded-box border border-base-content/5 bg-base-100"
                >
                    <table className="table table-sm table-zebra table-pin-cols table-pin-rows w-full table-fixed whitespace-normal wrap-break-word">
                        <thead>
                            <tr className="bg-base-300 [&>td]:text-center [&>td]:whitespace-normal [&>td]:wrap-break-word">
                                <th className="w-8 bg-base-300">
                                    <label>
                                        <input ref={selectAllCheckboxRef} type="checkbox" className="checkbox" onClick={toggleSelectAll} />
                                    </label>
                                </th>
                                <td className="w-14">ID</td>
                                <td>Tên khoa học</td>
                                <td>Tên tiếng Việt</td>
                                <td>Nhóm</td>
                                <td className="w-36">Mô tả</td>
                                <td className="w-36">Đặc điểm</td>
                                <td className="w-36">Vai trò</td>
                                <td className="w-16">Tình trạng bảo tồn</td>
                                <td>Nơi sống</td>
                                <td>Phân bố Việt Nam</td>
                                <td>Phân bố Thế giới</td>
                                <td>Ngành</td>
                                <td>Lớp</td>
                                <td>Bộ</td>
                                <td>Họ</td>
                                <td>Giống</td>
                                <td className="w-36">Tài liệu tham khảo</td>
                                <td className="w-14">Hình ảnh</td>
                                <td className="w-14">Tọa độ</td>
                                <td className="w-20">Ngày tạo</td>
                                <td className="w-20">Ngày cập nhật</td>
                                <th className="w-8 bg-base-300"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {speciesList
                                .filter((species) => !hiddenIds.includes(species.id))
                                .map((species) => (
                                    <tr key={species.id}>
                                        <th>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox"
                                                    onChange={() => toggleItemId(species.id)}
                                                    checked={checkedIds.includes(species.id)}
                                                />
                                            </label>
                                        </th>
                                        <td>{species.id}</td>
                                        <td>{species.scientific_name}</td>
                                        <td>{species.vietnamese_name}</td>
                                        <td>{species.group_species}</td>
                                        <td>{species.description}</td>
                                        <td>{species.characteristic}</td>
                                        <td>{species.impact}</td>
                                        <td>{species.threatened_symbol}</td>
                                        <td>{species.habitas}</td>
                                        <td>{species.vn_distribution}</td>
                                        <td>{species.global_distribution}</td>
                                        <td>{species.phylum}</td>
                                        <td>{species.class}</td>
                                        <td>{species.order_species}</td>
                                        <td>{species.family}</td>
                                        <td>{species.genus}</td>
                                        <td>{species.references_text}</td>
                                        <td>
                                            <div className="flex justify-center items-center">
                                                <button
                                                    className="btn btn-outline btn-ghost btn-circle border-none"
                                                    disabled={!species.images}
                                                    onClick={() => {
                                                        setViewerProps({ type: "image", data: species.images });
                                                        viewerRef.current?.show();
                                                    }}
                                                >
                                                    <Image className="size-5" />
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex justify-center items-center">
                                                <button
                                                    className="btn btn-outline btn-ghost btn-circle border-none"
                                                    disabled={!species.points}
                                                    onClick={() => {
                                                        setViewerProps({ type: "location", data: species.points });
                                                        viewerRef.current?.show();
                                                    }}
                                                >
                                                    <Compass className="size-5" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="text-center">{new Date(species.created_at).toLocaleString()}</td>
                                        <td className="text-center">{new Date(species.updated_at).toLocaleString()}</td>
                                        <th>
                                            <div className="flex flex-col justify-center items-center space-y-1">
                                                <button
                                                    className="cursor-pointer hover:text-blue-500"
                                                    onClick={() => {
                                                        selectedIdRef.current = species.id;
                                                        handleEdit();
                                                    }}
                                                >
                                                    <SquarePen className="size-5" />
                                                </button>
                                                <button
                                                    className="cursor-pointer hover:text-red-500"
                                                    onClick={() => {
                                                        selectedIdRef.current = species.id;
                                                        confirmDeleteRef.current?.show();
                                                    }}
                                                >
                                                    <Trash2 className="size-5" />
                                                </button>
                                            </div>
                                        </th>
                                    </tr>
                                ))}
                        </tbody>
                    </table>

                    {cursor && (
                        <div className="flex justify-center items-center">
                            <button
                                className="btn btn-block border-none bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                disabled={cursor === null}
                                onClick={handleLoadMore}
                            >
                                <ChevronDown />
                                <p>Tải thêm</p>
                            </button>
                        </div>
                    )}
                </div>

                <div className="fab">
                    <button
                        className="btn btn-xl btn-square btn-ghost bg-blue-500 rounded-md border-3 border-white text-white hover:bg-blue-600"
                        onClick={() => tableRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                    >
                        <ArrowUp />
                    </button>
                </div>

                {speciesList.length === 0 && !isLoadingRec && (
                    <div className="flex flex-col justify-center items-center w-full h-[calc(100vh-260px)]">
                        <img src={speciesNotFound} alt="Không tìm thấy kết quả" className="w-48 h-48 mb-4" />
                        <p className="text-lg text-gray-600">Không tìm thấy kết quả phù hợp</p>
                    </div>
                )}

                {isLoadingRec && (
                    <div className="absolute flex flex-col w-full h-[calc(100vh-148px)] p-4 gap-4 items-center justify-center">
                        <span className="loading loading-spinner loading-lg text-blue-500"></span>
                        <p className="text-lg text-gray-500">Đang tải dữ liệu...</p>
                    </div>
                )}

                {/* Dialogs */}
                <SpeciesForm ref={addFunctionRef} species={editingSpecies} />
                <ImportSpeciesForm ref={importFunctionRef} />
                <SpeciesViewer ref={viewerRef} type={viewerProps?.type} data={viewerProps?.data} />
                <ConfirmModal ref={confirmDeleteRef} message="Bạn chắc muốn xóa loài này không?" api={handleSingleDelete} />
                <ConfirmModal ref={confirmMultiDeleteRef} message="Bạn chắc muốn xóa tất cả loài đã chọn không?" api={handleMultiDelete} />
            </div>
        </>
    );
}

export default Dashboard;
