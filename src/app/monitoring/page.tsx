
"use client";

import { useState } from "react";
import { Cast, Radio } from "lucide-react";
import HlsPlayer from "@/components/common/HlsPlayer";

export default function MonitoringPage() {
    // Daftar URL CCTV
    const streams = [
        { id: 1, name: "Channel 1", url: "https://isgpopen.ezvizlife.com/v3/openlive/FY2936828_1_1.m3u8?expire=1832428731&id=939309060430602240&c=4ec4ebb6a7&t=1474676ba6bb4a1edec4118f8e5d141741b36f066f690159e2caac54b62d5258&ev=100" },
        { id: 2, name: "Channel 2", url: "https://isgpopen.ezvizlife.com/v3/openlive/FY2936828_2_1.m3u8?expire=1832428758&id=939309172980412416&c=4ec4ebb6a7&t=61a399452229f124ac94a75064b8a9288b54f0c4867aea9dca87a9a0b978eaaf&ev=100" },
        { id: 3, name: "Channel 3", url: "https://isgpopen.ezvizlife.com/v3/openlive/FY2936828_3_1.m3u8?expire=1832428779&id=939309260596097024&c=4ec4ebb6a7&t=8fc711ddc8fbfdbbcaccaee9e2669fc29ce4e797444b09fc878ea4e68ac5f6c0&ev=100" },
        { id: 4, name: "Channel 4", url: "https://isgpopen.ezvizlife.com/v3/openlive/FY2936828_4_1.m3u8?expire=1832428788&id=939309298402758656&c=4ec4ebb6a7&t=5968a7921324fc198dee96c5fbe46c9d9078567d298a164e023d735d42e495d1&ev=100" },
        { id: 5, name: "Channel 5", url: "https://isgpopen.ezvizlife.com/v3/openlive/FY2936828_5_1.m3u8?expire=1832428796&id=939309334585544704&c=4ec4ebb6a7&t=0c9227e6143f320a0451c9074cebbde387b9f1f3245359b7c68aa2053ca93cfb&ev=100" },
        { id: 6, name: "Channel 6", url: "https://vtmjakarta.ezvizlife.com:8883/v3/openlive/FY2936828_6_1.m3u8?expire=1832428805&id=939309370144555008&c=4ec4ebb6a7&t=8d27535505086aa4568ddf25f1b401f4a55b7d0326b06fb713aa6435f475e099&ev=100&u=2f109a26ea4148ef8e0ea65bcd21fff0" },
        { id: 7, name: "Channel 7", url: "https://vtmucyn.ezvizlife.com:8883/v3/openlive/FY2936828_7_1.m3u8?expire=1848387647&id=1006245606955667456&c=4ec4ebb6a7&t=313028fab2d05b1929b47b1bed4aacc05023a2c3343fb932c4e8317c2296666d&ev=100&u=466ae99988964dc8837e65291bc8ec2f" },
    ];

    const [showTest, setShowTest] = useState(false);
    const [activeChannel, setActiveChannel] = useState<'all' | number>('all');
    const [popupChannel, setPopupChannel] = useState<number | null>(null);

    // Filter logic
    const filteredStreams = activeChannel === 'all'
        ? streams
        : streams.filter(s => s.id === activeChannel);

    const popupStream = streams.find(s => s.id === popupChannel) ?? null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Cast className="text-blue-600" />
                        Monitoring CCTV
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Live stream dari Ezviz Cloud (High Performance HLS).
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full animate-pulse shadow-sm">
                        <Radio size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Live</span>
                    </div>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mr-2">View:</span>
                <button
                    onClick={() => setActiveChannel('all')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeChannel === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                >
                    All Channels
                </button>
                {streams.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveChannel(s.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeChannel === s.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                    >
                        Ch {s.id}
                    </button>
                ))}
            </div>

            {/* Main Grid: Dynamic Layout (Grid vs Single) */}
            <div className={activeChannel === 'all'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "max-w-5xl mx-auto" // Single View Mode (Lebih besar)
            }>
                {filteredStreams.map((stream) => (
                    <div
                        key={stream.id}
                        className={`rounded-xl overflow-hidden shadow-lg border-2 border-slate-200 dark:border-slate-800 relative group transition-all duration-300 ${activeChannel === 'all' ? '' : 'shadow-2xl'}`}
                    >
                        <HlsPlayer
                            src={stream.url}
                            label={stream.name}
                            onClick={() => setPopupChannel(stream.id)}
                        />
                    </div>
                ))}
            </div>

            {/* Popup Modal: Original aspect ratio, no crop */}
            {popupStream && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
                    onClick={() => setPopupChannel(null)}
                >
                    <div
                        className="w-full max-w-4xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-white font-bold text-lg">{popupStream.name}</h3>
                            <button
                                onClick={() => setPopupChannel(null)}
                                className="text-white/80 hover:text-white text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
                            >
                                Tutup ✕
                            </button>
                        </div>
                        <HlsPlayer
                            key={`popup-${popupStream.id}`}
                            src={popupStream.url}
                            label={popupStream.name}
                            fit="contain"
                        />
                    </div>
                </div>
            )}

            {/* Test Stream Control */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={() => setShowTest(!showTest)}
                    className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                    {showTest ? "Hide Test Stream" : "Show Test Stream"}
                </button>
            </div>

            {/* Test Stream Room */}
            {showTest && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold mb-4 text-slate-700 dark:text-slate-300">Public Test Stream (Mux)</h3>
                    <div className="max-w-md bg-black rounded-xl overflow-hidden aspect-video border-2 border-blue-200">
                        <HlsPlayer
                            src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
                            label="Test Stream"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
