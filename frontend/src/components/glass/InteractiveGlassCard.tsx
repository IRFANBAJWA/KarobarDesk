import { forwardRef, useRef } from "react";
import type { HTMLAttributes, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface InteractiveGlassCardProps extends HTMLAttributes<HTMLDivElement> {
    tilt?: boolean;
    spotlight?: boolean;
    clickable?: boolean;
    tiltStrength?: number;
    spotlightColor?: string;
}

const InteractiveGlassCard = forwardRef<
    HTMLDivElement,
    InteractiveGlassCardProps
>(
    (
        {
            children,
            className,
            style,
            tilt = true,
            spotlight = true,
            clickable = false,
            tiltStrength = 5,
            spotlightColor = "rgba(139, 92, 246, 0.14)",
            onMouseMove,
            onMouseLeave,
            ...props
        },
        forwardedRef,
    ) => {
        const cardRef = useRef<HTMLDivElement | null>(null);

        const setRefs = (node: HTMLDivElement | null) => {
            cardRef.current = node;

            if (typeof forwardedRef === "function") {
                forwardedRef(node);
            } else if (forwardedRef) {
                forwardedRef.current = node;
            }
        };

        const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
            const card = cardRef.current;

            if (
                card &&
                !window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ) {
                const rect = card.getBoundingClientRect();

                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const percentX = (x / rect.width) * 100;
                const percentY = (y / rect.height) * 100;

                const rotateX = ((centerY - y) / centerY) * tiltStrength;

                const rotateY = ((x - centerX) / centerX) * tiltStrength;

                card.style.setProperty("--mouse-x", `${percentX}%`);

                card.style.setProperty("--mouse-y", `${percentY}%`);

                card.style.setProperty(
                    "--tilt-x",
                    tilt ? `${rotateX}deg` : "0deg",
                );

                card.style.setProperty(
                    "--tilt-y",
                    tilt ? `${rotateY}deg` : "0deg",
                );
            }

            onMouseMove?.(event);
        };

        const handleMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
            const card = cardRef.current;

            if (card) {
                card.style.setProperty("--mouse-x", "50%");
                card.style.setProperty("--mouse-y", "50%");
                card.style.setProperty("--tilt-x", "0deg");
                card.style.setProperty("--tilt-y", "0deg");
            }

            onMouseLeave?.(event);
        };

        return (
            <div
                ref={setRefs}
                {...props}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className={cn(
                    "interactive-glass-card",
                    spotlight && "interactive-glass-spotlight",
                    clickable && "interactive-glass-clickable",
                    className,
                )}
                style={
                    {
                        ...style,
                        "--spotlight-color": spotlightColor,
                        "--mouse-x": "50%",
                        "--mouse-y": "50%",
                        "--tilt-x": "0deg",
                        "--tilt-y": "0deg",
                    } as React.CSSProperties
                }
            >
                {children}
            </div>
        );
    },
);

InteractiveGlassCard.displayName = "InteractiveGlassCard";

export default InteractiveGlassCard;
