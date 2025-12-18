import { useRef, useState, useEffect, type MouseEvent, type KeyboardEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { RefreshCcw, SlidersHorizontal, ArrowUp, ChevronDown, Search, X, Info } from "lucide-react";

import Navbar from "../components/Navbar";
import { type SpeciesGallery } from "../store/useAdminSpeciesStore";
import useUserSpeciesStore from "../store/useUserSpecieStore";
import speciesNotFound from "../assets/species-not-found.png";

type AllowedTargets = "search" | "filterTags" | "filterDialog" | "query";

function HomePage() {
    const location = useLocation();

    // Refs
    const inputRef = useRef<HTMLInputElement>(null);

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
    const [speciesSearchPreview, setSpeciesSearchPreview] = useState<SpeciesGallery[]>([]);
    const [query, setQuery] = useState<{ [key: string]: string | boolean | string[] } | null>(null);
    const { speciesList, tagList, isLoading, cursor, fetchSpecies, fetchFilterTags } = useUserSpeciesStore();

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

    // Search handlers
    const clearSearchInput = () => {
        setInputValue("");
        inputRef.current?.focus();
    };

    const handleSearchSubmit = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && inputValue.trim()) {
            setQuery({ species: inputValue.trim(), name: inputValue.trim() });

            reset(["search", "filterTags", "filterDialog"]);
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

        reset(["filterDialog"]);
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

    // Load more
    const handleLoadMore = () => {
        fetchSpecies(query, "add");
    };

    // Utility handlers
    const handleRefresh = () => {
        fetchSpecies({}, "reset");
        fetchFilterTags();

        reset(["search", "filterTags", "filterDialog", "query"]);
    };

    const reset = (targets: AllowedTargets[]) => {
        for (let i = 0; i < targets.length; i++) {
            if (targets[i] === "search") {
                clearSearchInput();
            } else if (targets[i] === "filterTags") {
                clearFilters();
            } else if (targets[i] === "filterDialog") {
                setIsFilterOpen(false);
            } else if (targets[i] === "query") {
                setQuery(null);
            }
        }
    };

    useEffect(() => {
        if (location.state?.filters) {
            const filters = location.state.filters;

            setSelectedFilterTags(filters);
            setQuery(filters);

            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Debounce input
    useEffect(() => {
        if (!inputValue.trim()) return;

        const timer = setTimeout(() => {
            fetchSpecies({ name: inputValue.trim(), species: inputValue.trim() }, "search").then((species) =>
                setSpeciesSearchPreview(species)
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [inputValue, fetchSpecies]);

    // Fetch on query change
    useEffect(() => {
        if (!query) return;
        fetchSpecies(query, "change");
    }, [query, fetchSpecies]);

    // Initial fetch
    useEffect(() => {
        if (location.state?.filters) return;

        fetchSpecies(null, "reset");
        fetchFilterTags();
    }, [location.state?.filters, fetchSpecies, fetchFilterTags]);

    return (
        <>
            <ToastContainer />
            <Navbar />
            <div className="p-4">
                {/* Functions bar */}
                <div className="flex justify-start items-center px-2 pb-4 mb-4 border-b border-base-300 z-20">
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
                                                <Link to={`/species/${species.id}`} key={species.id}>
                                                    <li className="list-row flex justify-center items-center hover:bg-base-300">
                                                        <div>
                                                            <img
                                                                className="size-10 rounded-box object-cover"
                                                                src={species.cover_image_url}
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
                                                </Link>
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
                    <div className="relative ml-4">
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
                                className="absolute top-full flex flex-col left-0 w-3xl min-w-0 h-[380px] mt-2 p-4 bg-base-100 rounded-md border border-base-300 shadow-md cursor-default z-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex-1 flex min-h-0">
                                    <div className="flex flex-col justify-evenly items-center space-y-1 [&>button]:hover:bg-base-300">
                                        {Object.keys(filterGroups).map((group) => (
                                            <button
                                                className={
                                                    "flex justify-between items-center w-48 px-4 py-2 rounded-md cursor-pointer " +
                                                    (selectedFilterTags[filterGroups[group]].length > 0 && "bg-blue-100/40 text-blue-500")
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
                                    <button type="submit" className="btn bg-blue-500 text-white hover:bg-blue-600" onClick={applyFilters}>
                                        Lọc
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Refresh */}
                    <button
                        className="btn btn-ghost rounded-md ml-4 px-4 py-2 text-base hover:text-white hover:bg-blue-500"
                        onClick={handleRefresh}
                    >
                        <RefreshCcw />
                        <p>Đặt lại</p>
                    </button>

                    {query?.species && (
                        <div className="flex-1 mr-4 text-base text-end text-gray-600">
                            Tìm kiếm: <span className="font-semibold text-blue-600">"{query.species || query.name}"</span>
                        </div>
                    )}
                </div>

                {/* Species gallery */}
                <div className="flex justify-center items-center flex-wrap mt-3 gap-4.5">
                    {speciesList.map((species, index) => (
                        <Link to={`/species/${species.id}`} key={index}>
                            <div
                                className="relative size-74 rounded-lg overflow-hidden group transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(59,130,246,0.7),0_0_30px_rgba(59,130,246,0.4)]"
                                key={species.id}
                            >
                                <img src={species.cover_image_url} alt={species.scientific_name} className="w-full h-full" />
                                <div
                                    className="absolute bottom-0 w-full h-fit p-2 text-center text-2xl text-white font-semibold
                                    bg-linear-to-t from-black/80 via-black/70 to-transparent
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                >
                                    {species.scientific_name}
                                </div>
                                <div className="absolute top-2 right-2 flex justify-center items-center px-4 py-1 rounded-full text-white text-sm bg-black/40 backdrop-blur-sm border border-white/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="mr-1 tooltip tooltip-bottom" data-tip="Tình trạng bảo tồn">
                                        <Info className="size-3.5" />
                                    </div>
                                    <div>{species.threatened_symbol}</div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {cursor && (
                    <div className="flex justify-center items-center w-full mt-2">
                        <button
                            className="btn border-none bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            disabled={cursor === null}
                            onClick={handleLoadMore}
                        >
                            <ChevronDown />
                            <p>Tải thêm</p>
                        </button>
                    </div>
                )}

                <div className="fab">
                    <button
                        className="btn btn-xl btn-square btn-ghost bg-blue-500 rounded-md border-3 border-white text-white hover:bg-blue-600"
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    >
                        <ArrowUp />
                    </button>
                </div>

                {speciesList.length === 0 && !isLoading && (
                    <div className="flex flex-col justify-center items-center w-full h-[calc(100vh-180px)]">
                        <img src={speciesNotFound} alt="Không tìm thấy kết quả" className="w-48 h-48 mb-4" />
                        <p className="text-lg text-gray-600">Không tìm thấy kết quả phù hợp</p>
                    </div>
                )}

                {isLoading && (
                    <div className="absolute flex flex-col w-full h-[calc(100vh-148px)] p-4 gap-4 items-center justify-center">
                        <span className="loading loading-spinner loading-lg text-blue-500"></span>
                        <p className="text-lg text-gray-500">Đang tải dữ liệu...</p>
                    </div>
                )}
            </div>
        </>
    );
}

export default HomePage;
