import React from 'react';

interface FooterProps {
    isDarkMode: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isDarkMode }) => {
    // Retaining existing background/border styles
    const footerClass = isDarkMode ? 'bg-black border-white/10 text-white/70' : 'bg-gray-50 border-gray-200 text-black';
    // Text color classes
    const linkClass = isDarkMode ? 'hover:text-white' : 'hover:text-black'; 
    const textMutedClass = isDarkMode ? 'text-white/70' : 'text-black';
    
    return (
        <footer className={`border-t py-8 transition-colors ${footerClass}`}>
            <div className="max-w-7xl mx-auto px-4 text-sm">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <p className={textMutedClass}>&copy; {new Date().getFullYear()} DecentGigs. All rights reserved. Built on Cardano.</p>
                    <div className="flex space-x-6">
                        <a href="#" className={`transition-colors ${linkClass}`}>Terms</a>
                        <a href="#" className={`transition-colors ${linkClass}`}>Privacy</a>
                        <a href="#" className={`transition-colors ${linkClass}`}>Contact</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

