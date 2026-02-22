"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Youtube, Music, Video, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function Downloader() {
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<'mp4' | 'mp3'>('mp4');
    const [status, setStatus] = useState<'idle' | 'fetching' | 'ready' | 'downloading' | 'success' | 'error'>('idle');
    const [info, setInfo] = useState<any>(null);
    const [progressLog, setProgressLog] = useState<string[]>([]);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setStatus('fetching');
        setErrorMsg('');
        try {
            const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch info');

            setInfo(data);
            setStatus('ready');
        } catch (err: any) {
            setErrorMsg(err.message);
            setStatus('error');
        }
    };

    const startDownload = () => {
        setStatus('downloading');
        setProgressLog([]);
        setErrorMsg('');

        const eventSource = new EventSource(`/api/download?url=${encodeURIComponent(url)}&format=${format}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'stdout' || data.type === 'stderr') {
                setProgressLog(prev => {
                    const newLog = [...prev, data.text.trim()].slice(-10); // keep last 10 lines
                    return newLog;
                });
            } else if (data.type === 'done') {
                setStatus('success');
                eventSource.close();
            } else if (data.type === 'error') {
                setErrorMsg(data.error);
                setStatus('error');
                eventSource.close();
            }
        };

        eventSource.onerror = (err) => {
            if (status !== 'success') {
                setErrorMsg('Connection to download server lost.');
                setStatus('error');
            }
            eventSource.close();
        };
    };

    useEffect(() => {
        if (status !== 'idle' && status !== 'fetching') {
            setStatus('idle');
            setInfo(null);
        }
    }, [url]);

    return (
        <div className="w-full max-w-3xl mx-auto space-y-8 relative z-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
            >
                <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl mb-4 shadow-2xl shadow-brand-500/20">
                    <Youtube className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-100 to-white/70">
                    Vortex Downloader
                </h1>
                <p className="text-lg text-white/50 max-w-xl mx-auto">
                    Ultra-fast downloads for YouTube videos and entire playlists in premium quality.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                <form onSubmit={fetchInfo} className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70 ml-1">YouTube URL</label>
                        <div className="relative flex items-center group/input">
                            <input
                                type="text"
                                placeholder="https://www.youtube.com/watch?v=... or playlist URL"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-5 pr-32 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all duration-300"
                            />
                            <button
                                type="submit"
                                disabled={!url || status === 'fetching'}
                                className="absolute right-2 top-2 bottom-2 bg-white text-black font-semibold rounded-xl px-4 hover:bg-brand-50 focus:ring-2 focus:ring-brand-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {status === 'fetching' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze'}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <label className={cn(
                            "flex-1 relative flex cursor-pointer rounded-2xl border p-4 focus:outline-none transition-all duration-300",
                            format === 'mp4'
                                ? "bg-brand-500/10 border-brand-500 shadow-[0_0_15px_rgba(73,99,244,0.3)]"
                                : "bg-black/40 border-white/10 hover:border-white/20"
                        )}
                            onClick={() => setFormat('mp4')}
                        >
                            <div className="flex items-center gap-4 w-full">
                                <div className={cn("p-3 rounded-full", format === 'mp4' ? "bg-brand-500/20 text-brand-300" : "bg-white/5 text-white/50")}>
                                    <Video className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className={cn("font-medium", format === 'mp4' ? "text-white" : "text-white/70")}>MP4 Video</p>
                                        {format === 'mp4' && <CheckCircle2 className="w-5 h-5 text-brand-400" />}
                                    </div>
                                    <p className="text-sm text-white/40 mt-1">Best quality available</p>
                                </div>
                            </div>
                        </label>

                        <label className={cn(
                            "flex-1 relative flex cursor-pointer rounded-2xl border p-4 focus:outline-none transition-all duration-300",
                            format === 'mp3'
                                ? "bg-neon-purple/10 border-neon-purple shadow-[0_0_15px_rgba(138,43,226,0.3)]"
                                : "bg-black/40 border-white/10 hover:border-white/20"
                        )}
                            onClick={() => setFormat('mp3')}
                        >
                            <div className="flex items-center gap-4 w-full">
                                <div className={cn("p-3 rounded-full", format === 'mp3' ? "bg-neon-purple/20 text-neon-purple" : "bg-white/5 text-white/50")}>
                                    <Music className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className={cn("font-medium", format === 'mp3' ? "text-white" : "text-white/70")}>MP3 Audio</p>
                                        {format === 'mp3' && <CheckCircle2 className="w-5 h-5 text-neon-purple" />}
                                    </div>
                                    <p className="text-sm text-white/40 mt-1">Extract high quality audio</p>
                                </div>
                            </div>
                        </label>
                    </div>
                </form>

                <AnimatePresence mode="wait">
                    {status === 'ready' && info && (
                        <motion.div
                            key="ready-state"
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="border-t border-white/10 pt-6 overflow-hidden"
                        >
                            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                                {info.thumbnail && (
                                    <div className="relative w-48 h-32 rounded-xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0 bg-black/50">
                                        <img src={info.thumbnail} alt="Thumbnail" className="object-cover w-full h-full" />
                                    </div>
                                )}
                                <div className="flex-1 space-y-3">
                                    <h3 className="text-xl font-semibold text-white line-clamp-2">
                                        {info.title || info.playlist_title || 'Unknown Title'}
                                    </h3>
                                    <p className="text-sm text-white/50">
                                        {info._type === 'playlist' ? `${info.entries?.length || 'Multiple'} entries in playlist` : 'Single Video'}
                                    </p>

                                    <button
                                        onClick={startDownload}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium px-8 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(73,99,244,0.4)] transition-all active:scale-95 text-base relative overflow-hidden"
                                    >
                                        <Download className="w-5 h-5" />
                                        Start Download
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {status === 'downloading' && (
                        <motion.div
                            key="download-state"
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="border-t border-white/10 pt-6 space-y-4 overflow-hidden"
                        >
                            <div className="flex items-center gap-3 text-brand-400">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="font-medium animate-pulse-slow">Downloading securely to your device...</span>
                            </div>

                            <div className="bg-black/60 rounded-xl p-4 border border-white/5 h-48 overflow-y-auto font-mono text-xs text-white/40 space-y-1 flex flex-col justify-end">
                                {progressLog.map((log, i) => (
                                    <div key={i} className="break-all !text-white/60 mb-1">{log}</div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div
                            key="success-state"
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-emerald-400 text-center overflow-hidden"
                        >
                            <CheckCircle2 className="w-12 h-12 mb-2" />
                            <h4 className="text-xl font-bold text-white">Download Complete!</h4>
                            <p className="text-emerald-400/80 text-sm">You can find your files in the <b>~/Downloads/YT_Downloads</b> folder on your computer.</p>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div
                            key="error-state"
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 text-red-400 overflow-hidden"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{errorMsg}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Footer text */}
            <div className="text-center text-xs text-white/30 pt-8">
                Designed for speed, built for local execution. Files are delivered directly to your device.
            </div>
        </div>
    );
}
