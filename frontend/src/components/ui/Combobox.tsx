import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function Combobox({
    options,
    value,
    onChange,
    placeholder = "Select...",
    className,
}: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    // Position state for the portal
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const triggerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);
    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase()),
    );

    useEffect(() => {
        setHighlightedIndex(0);
    }, [search]);

    // Handle outside click
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () =>
            document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    // Update position when opening
    const handleOpen = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 4, // 4px gap
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "Enter") {
                handleOpen();
                e.preventDefault();
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex(
                (prev) =>
                    (prev - 1 + filteredOptions.length) %
                    filteredOptions.length,
            );
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filteredOptions[highlightedIndex]) {
                onChange(filteredOptions[highlightedIndex].value);
                setIsOpen(false);
                setSearch("");
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
            setSearch("");
        }
    };

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div className={cn("relative w-full", className)}>
            {/* Trigger Button */}
            <div
                ref={triggerRef}
                onClick={handleOpen}
                className="flex h-9 w-full cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 text-sm transition hover:bg-white/10 focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/20"
            >
                <span
                    className={cn(
                        "truncate",
                        !selectedOption && "text-muted-foreground",
                    )}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>

            {/* Dropdown (Rendered via Portal) */}
            {isOpen &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        style={{
                            position: "absolute",
                            top: coords.top,
                            left: coords.left,
                            width: coords.width,
                        }}
                        className="z-[100] rounded-xl border border-white/10 bg-neutral-900 shadow-2xl"
                    >
                        <div className="border-b border-white/10 p-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search..."
                                    className="h-8 w-full rounded-md border border-white/10 bg-white/5 pl-8 pr-2 text-xs text-foreground outline-none focus:border-violet-500/40"
                                />
                            </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                            {filteredOptions.length === 0 ? (
                                <div className="py-4 text-center text-xs text-muted-foreground">
                                    No results found.
                                </div>
                            ) : (
                                filteredOptions.map((opt, index) => (
                                    <div
                                        key={opt.value}
                                        onClick={() => handleSelect(opt.value)}
                                        onMouseEnter={() =>
                                            setHighlightedIndex(index)
                                        }
                                        className={cn(
                                            "flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm",
                                            index === highlightedIndex
                                                ? "bg-violet-600/20 text-foreground"
                                                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                                        )}
                                    >
                                        <span className="truncate">
                                            {opt.label}
                                        </span>
                                        {value === opt.value && (
                                            <Check className="h-4 w-4 text-violet-400" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
