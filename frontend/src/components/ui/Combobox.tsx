import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
    value: string;
    label: string;
    sublabel?: string; // optional second line (e.g. item code)
}

interface Props {
    value: string;
    options: ComboboxOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
}

export default function Combobox({
    value,
    options,
    onChange,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyText = "No matches",
    className,
}: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [coords, setCoords] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = options.find((o) => o.value === value);

    // Position panel
    useEffect(() => {
        if (!open || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }, [open]);

    // Reposition on scroll/resize
    useEffect(() => {
        if (!open) return;
        const update = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 6,
                left: rect.left,
                width: rect.width,
            });
        };
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [open]);

    // Focus search on open
    useEffect(() => {
        if (open) {
            setQuery("");
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);

    // Outside click + Escape
    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            const target = e.target as Node;
            if (panelRef.current?.contains(target)) return;
            if (triggerRef.current?.contains(target)) return;
            setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => {
            const hay = `${o.label} ${o.sublabel ?? ""}`.toLowerCase();
            return hay.includes(q);
        });
    }, [options, query]);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-foreground outline-none transition hover:bg-white/10 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20",
                    className,
                )}
            >
                <span
                    className={cn(
                        "truncate text-left",
                        !selected && "text-muted-foreground",
                    )}
                >
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        "h-3.5 w-3.5 shrink-0 text-muted-foreground transition",
                        open && "rotate-180",
                    )}
                />
            </button>

            {open &&
                coords &&
                createPortal(
                    <div
                        ref={panelRef}
                        style={{
                            position: "fixed",
                            top: coords.top,
                            left: coords.left,
                            minWidth: coords.width,
                        }}
                        className="z-[100] flex max-h-[320px] w-[320px] flex-col overflow-hidden rounded-xl border border-white/10 bg-neutral-900/95 shadow-2xl backdrop-blur-xl"
                    >
                        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2">
                            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="h-6 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery("")}
                                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                                    aria-label="Clear"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
                            {filtered.length === 0 ? (
                                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                                    {emptyText}
                                </div>
                            ) : (
                                filtered.map((opt) => {
                                    const isActive = opt.value === value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                onChange(opt.value);
                                                setOpen(false);
                                            }}
                                            className={cn(
                                                "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs transition",
                                                isActive
                                                    ? "bg-violet-500/10 text-violet-200"
                                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                                            )}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate">
                                                    {opt.label}
                                                </div>
                                                {opt.sublabel && (
                                                    <div className="truncate text-[10px] text-muted-foreground">
                                                        {opt.sublabel}
                                                    </div>
                                                )}
                                            </div>
                                            {isActive && (
                                                <Check className="h-3.5 w-3.5 shrink-0" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}
