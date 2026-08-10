
"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { AlertCircle, Loader2 } from "lucide-react";

interface HlsPlayerProps {
    src: string;
    autoPlay?: boolean;
    muted?: boolean;
    label?: string;
    fit?: "fill" | "contain";
    onClick?: () => void;
}

// Watchdog: jika stream stuck (kuning) lebih dari ini, reload HLS instance.
const STUCK_TIMEOUT_MS = 12000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export default function HlsPlayer({ src, autoPlay = true, muted = true, label, fit = "fill", onClick }: HlsPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Refs supaya watchdog bisa akses state terbaru tanpa re-create effect.
    const hlsRef = useRef<Hls | null>(null);
    const retryCountRef = useRef(0);
    const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearWatchdog = () => {
        if (watchdogRef.current) {
            clearTimeout(watchdogRef.current);
            watchdogRef.current = null;
        }
    };

    const clearRetryTimer = () => {
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Reset states on src change
        setError(null);
        setIsLoading(true);
        setIsPlaying(false);
        retryCountRef.current = 0;
        clearWatchdog();
        clearRetryTimer();

        const handleSuccess = () => {
            setIsLoading(false);
            setIsPlaying(true);
            retryCountRef.current = 0; // reset retry counter on real success
            clearWatchdog();
        };

        // Watchdog: kalau setelah manifest ter-parse masih belum playing dalam STUCK_TIMEOUT_MS,
        // anggap stream stuck (kuning terlalu lama) → reload HLS instance.
        const startWatchdog = () => {
            clearWatchdog();
            watchdogRef.current = setTimeout(() => {
                if (!video) return;
                if (video.paused || video.ended || video.currentTime === 0) {
                    // Masih belum play → reload
                    if (retryCountRef.current < MAX_RETRIES) {
                        retryCountRef.current += 1;
                        const attempt = retryCountRef.current;
                        const oldHls = hlsRef.current;
                        if (oldHls) {
                            oldHls.destroy();
                            hlsRef.current = null;
                        }
                        setIsLoading(true);
                        retryTimerRef.current = setTimeout(() => {
                            startHls(attempt);
                        }, RETRY_DELAY_MS);
                    }
                }
            }, STUCK_TIMEOUT_MS);
        };

        const startHls = (attempt: number) => {
            if (!Hls.isSupported()) {
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = src;
                    const onLoaded = () => {
                        video.play()
                            .then(handleSuccess)
                            .catch(() => setIsLoading(false));
                    };
                    video.addEventListener("loadedmetadata", onLoaded, { once: true });
                    startWatchdog();
                } else {
                    setError("HLS Not Supported");
                }
                return;
            }

            const hls = new Hls({
                enableWorker: true,
                // lowLatencyMode false: stream Ezviz bukan LL-HLS; mode true terlalu agresif
                // untuk stream yang segmennya lambat, sering bikin stall di channel 7.
                lowLatencyMode: false,
                backBufferLength: 90,
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
            });
            hlsRef.current = hls;

            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play()
                    .then(handleSuccess)
                    .catch((e) => {
                        console.warn("Autoplay blocked:", e);
                        setIsLoading(false);
                        startWatchdog();
                    });
            });

            // Video event: kalau mulai play, sukses.
            const onPlaying = () => {
                handleSuccess();
            };
            video.addEventListener("playing", onPlaying, { once: true });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.error("HLS Fatal Error:", data);
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad(); // Try to recover
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            setError("Stream Error (Fatal)");
                            clearWatchdog();
                            hls.destroy();
                            hlsRef.current = null;
                            break;
                    }
                }
            });

            // Mulai watchdog setelah attach. Kalau play() tidak resolve dalam timeout, reload.
            startWatchdog();
        };

        startHls(0);

        return () => {
            clearWatchdog();
            clearRetryTimer();
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [src]);

    return (
        <div
            className={`w-full aspect-video bg-black relative rounded-xl overflow-hidden group shadow-2xl border border-slate-800 ${onClick ? "cursor-pointer" : ""}`}
            onClick={onClick}
        >
            <video
                ref={videoRef}
                className={`absolute top-0 left-0 w-full h-full ${fit === "contain" ? "object-contain" : "object-fill"}`}
                width={1920}
                height={1080}
                muted={muted}
                controls={!onClick}
                playsInline
            />

            {/* Overlay: Label */}
            {label && (
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/60 text-white text-xs font-bold rounded-lg backdrop-blur-md z-10 pointer-events-none flex items-center gap-2 border border-white/10">
                    <span>{label}</span>
                    {error ? (
                        <span className="text-red-500 bg-white px-1.5 py-0.5 rounded text-[10px]">ERR</span>
                    ) : isPlaying ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
                    ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    )}
                </div>
            )}

            {/* Overlay: Loading */}
            {isLoading && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm pointer-events-none text-white/80 z-20">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
                        <span className="text-xs font-medium tracking-wider uppercase">Memuat Stream...</span>
                    </div>
                </div>
            )}

            {/* Overlay: Error */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 z-20 text-red-400 p-6 text-center">
                    <AlertCircle className="w-10 h-10 mb-3 opacity-90" />
                    <p className="font-semibold text-sm mb-1">Gagal Memutar Video</p>
                    <p className="text-xs opacity-70 max-w-[200px]">{error}</p>
                </div>
            )}
        </div>
    );
}
