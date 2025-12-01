import React from 'react';
import { Shield, Github, Linkedin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="relative z-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-auto overflow-hidden">
            {/* Decorative gradient blobs */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-red-500/5 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">

                    {/* Brand Section */}
                    <div className="flex flex-col items-center md:items-start space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-2.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <Shield className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                                DomainScope
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left max-w-xs">
                            Advanced domain intelligence and threat detection platform for modern security teams.
                        </p>

                        {/* Organization Name - Prominent Placement */}
                        <div className="flex flex-col items-center md:items-start pt-2">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1">
                                In Association With
                            </span>
                            <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                Kerala Police Cyberdome Kozhikode
                            </span>
                        </div>
                    </div>

                    {/* Links & Socials */}
                    <div className="flex flex-col items-center md:items-end space-y-6">
                        <div className="flex items-center gap-4">
                            <a
                                href="https://github.com/vaishnav4281"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                                <Github className="h-5 w-5" />
                            </a>
                            <a
                                href="https://www.linkedin.com/in/va1shnav"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="my-8 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

                {/* Bottom Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                    <div className="text-slate-500 dark:text-slate-400 text-center md:text-left">
                        <span>© {new Date().getFullYear()} DomainScope. All rights reserved.</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-800/50 backdrop-blur-sm">
                        <span className="text-xs">Developed by</span>
                        <a
                            href="https://www.linkedin.com/in/va1shnav"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 hover:underline"
                        >
                            Vaishnav K
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
