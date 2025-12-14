import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
    Wallet,
    Shield,
    FileText,
    CheckCircle,
    Code,
    Globe,
    Briefcase,
    Users,
    Award,
    DollarSign,
    Fingerprint,
    Sun,
    Moon,
} from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import React, { useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import iconLogo from '../../icon.png';

interface LandingProps {
    onGetStarted: () => void;
    onLearnMore: () => void;
    onShowProfile: () => void;
}

const selectorContent = [
    {
        id: 'escrow',
        icon: Briefcase,
        title: "Trustless P2P Escrow",
        tagline: "Smart contracts secure your payments until work is approved.",
        description: "The core mechanism utilizes **Cardano's Extended UTXO (EUTXO) model** and Plutus/Aiken contracts to hold funds. This means no single party controls the funds, guaranteeing fairness. Funds are only released upon mutual agreement or through an independent, on-chain dispute resolution process. This eliminates the risk of chargebacks and non-payment.",
        techTags: ["Aiken", "EUTXO", "Security", "Plutus"],
    },
    {
        id: 'identity',
        icon: Fingerprint,
        title: "Verified Identity (Atala PRISM)",
        tagline: "Optional, decentralized identity verification for high-trust jobs.",
        description: "Integration with **Atala PRISM** allows users to attach Verifiable Credentials (VCs) to their profile, proving their skills or identity without revealing underlying personal data. This provides clients with cryptographically verifiable proof of a freelancer's qualifications (e.g., 'Certified Plutus Developer') directly on the Cardano blockchain.",
        techTags: ["DID", "Atala PRISM", "KYC", "Privacy"],
    },
    {
        id: 'Worldwide',
        icon: Globe,
        title: "Cross Boarder No limit Worldwide",
        tagline: "Post and Get Notified from jobs around the world.",
        description: "We provide open-source DApp templates, client libraries (using **Mesh SDK** and **Lucid-Cardano**), and comprehensive documentation. Developers can fork our escrow contract to build specialized, industry-specific marketplaces or integrate our job posting and bidding functionality directly into their own applications.",
        techTags: ["Design", "Developer", "Remote First"],
    },
];

const ThemeToggle = ({ isDarkMode, toggleTheme }: { isDarkMode: boolean, toggleTheme: () => void }) => (
    <button
        onClick={toggleTheme}
        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-white hover:bg-zinc-800/50' : 'text-black hover:bg-gray-100'}`}
        aria-label="Toggle theme"
    >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
);

const FlowStepCard = ({ icon: Icon, title, description, delay = 0, isDarkMode }: {
    icon: any;
    title: string;
    description: string;
    delay?: number;
    isDarkMode: boolean;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, delay }}
    >
        <Card className={`p-6 h-full flex flex-col justify-start backdrop-blur-sm transition-all shadow-lg hover:shadow-primary/30 ${
            isDarkMode 
                ? 'bg-black/30 border-zinc-700 hover:border-primary/50 text-white' 
                : 'bg-white border-gray-200 hover:border-primary/50 text-black'
        }`}>
            <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center border border-primary/50 bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {title}
                </h3>
            </div>
            <p className={isDarkMode ? "text-white/70 text-sm" : "text-black font-medium text-sm"}>
                {description}
            </p>
        </Card>
    </motion.div>
);

const FeatureCard = ({ icon: Icon, title, description, delay = 0, isDarkMode }: {
    icon: any;
    title: string;
    description: string;
    delay?: number;
    isDarkMode: boolean;
}) => (
    <motion.div 
        variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.5, delay }}
    >
        <Card className={`p-6 h-56 flex flex-col justify-start transition-all ${
            isDarkMode 
                ? 'bg-black/40 border border-white/10 hover:border-primary/50 text-white' 
                : 'bg-white border border-gray-200 hover:border-primary/50 text-black shadow-lg'
        }`}>
            <div className="w-full h-32 flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center border border-primary/30 bg-primary/10">
                    <Icon className="w-7 h-7 text-primary/80" />
                </div>
            </div>
            <h3 className="font-semibold text-base">
                {title}
            </h3>
            <p className={isDarkMode ? "text-white/70 text-sm" : "text-black font-medium text-sm"}>
                {description}
            </p>
        </Card>
    </motion.div>
);

const ShowcaseProjectCard = ({ title, description, tags, icon: Icon, design = 'default', isDarkMode }: {
    title: string;
    description: string;
    tags: string[];
    icon: any;
    design?: 'default' | 'inverted' | 'border';
    isDarkMode: boolean;
}) => {
    const cardRef = useRef(null);
    const x = useMotionValue(0.5);
    const y = useMotionValue(0.5);

    const rotateX = useTransform(y, [0, 1], [15, -15]);
    const rotateY = useTransform(x, [0, 1], [-15, 15]);

    const lightX = useTransform(x, [0, 1], ["0%", "100%"]);
    const lightY = useTransform(y, [0, 1], ["0%", "100%"]);

    const handleMouseMove = (event: React.MouseEvent) => {
        if (!cardRef.current) return;

        const card = cardRef.current as HTMLElement;
        const rect = card.getBoundingClientRect();

        const newX = (event.clientX - rect.left) / rect.width;
        const newY = (event.clientY - rect.top) / rect.height;

        x.set(newX);
        y.set(newY);
    };

    const handleMouseLeave = () => {
        x.set(0.5);
        y.set(0.5);
    };

    const darkClasses = "bg-black/40 border border-white/10 hover:shadow-primary/30 text-white";
    const lightClasses = "bg-white border border-gray-200 hover:shadow-primary/30 text-black shadow-lg";
    
    let cardClasses = `relative p-6 h-full rounded-xl overflow-hidden shadow-2xl cursor-pointer transition-shadow duration-300 ${isDarkMode ? darkClasses : lightClasses}`;
    let lightClassesEffect = "absolute inset-0 transition-opacity duration-300 pointer-events-none";

    const glowColor = isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(25, 25, 25, 0.1)';

    lightClassesEffect += ` bg-[radial-gradient(circle_at_var(--light-x)_var(--light-y),${glowColor}_0%,transparent_50%)] opacity-10`;

    return (
        <motion.div
            ref={cardRef}
            className={cardClasses + " min-w-[300px] md:min-w-0"}
            style={{ 
                perspective: 1000, 
                rotateX, 
                rotateY,
                '--light-x': lightX, 
                '--light-y': lightY,
            } as React.CSSProperties}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            whileHover={{ scale: 1.05, boxShadow: isDarkMode ? '0 10px 30px rgba(139, 92, 246, 0.2)' : '0 10px 30px rgba(0, 0, 0, 0.1)' }}
        >
            <motion.div
                className={lightClassesEffect}
                style={{ 
                    opacity: useTransform([x, y], (input: number[]) => {
                        const [xVal, yVal] = input;
                        return 0.1 + (0.5 - Math.abs(xVal - 0.5)) * 0.2 + (0.5 - Math.abs(yVal - 0.5)) * 0.2;
                    }),
                }}
            />

            <div className="relative z-10 space-y-4">
                <div className="flex items-center space-x-3">
                    <Icon className={`w-8 h-8 text-primary`} />
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{title}</h3>
                </div>
                <p className={isDarkMode ? 'text-white/70 text-sm' : 'text-black text-sm font-medium'}>{description}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                    {tags.map((tag) => (
                        <span key={tag} className={`px-3 py-1 text-xs font-medium rounded-full ${isDarkMode ? 'bg-zinc-800 text-primary/80 border border-primary/20' : 'bg-gray-200 text-primary border border-primary/10'}`}>
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

const MetricCard = ({ icon: Icon, metric, description, delay = 0, isDarkMode }: {
    icon: any;
    metric: string;
    description: string;
    delay?: number;
    isDarkMode: boolean;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, delay }}
        className={`p-6 border border-primary/20 rounded-xl transition-colors ${
            isDarkMode 
                ? 'bg-black/40 text-white' 
                : 'bg-white text-black shadow-lg'
        }`}
    >
        <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
        <h3 className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{metric}</h3>
        <p className={isDarkMode ? "text-white/70 text-sm" : "text-black text-sm font-medium"}>{description}</p>
    </motion.div>
);

const ContentButton = ({ 
    icon: Icon, 
    title, 
    isSelected, 
    onClick,
    isDarkMode
}: {
    icon: any;
    title: string;
    isSelected: boolean;
    onClick: () => void;
    isDarkMode: boolean;
}) => (
    <button
        onClick={onClick}
        className={`w-full p-4 rounded-xl text-left transition-all duration-300 ${
            isSelected
                ? 'bg-primary/20 border border-primary text-white shadow-lg shadow-primary/20'
                : isDarkMode
                    ? 'bg-black/40 border border-white/10 text-white/70 hover:bg-black/60 hover:border-primary/50'
                    : 'bg-gray-100 border border-gray-200 text-black font-medium hover:bg-gray-200 hover:border-primary/50'
        }`}
    >
        <div className="flex items-center space-x-3">
            <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : isDarkMode ? 'text-white/60' : 'text-black font-medium'}`} />
            <span className={`font-semibold text-base ${isSelected ? 'text-white' : isDarkMode ? 'text-white/80' : 'text-black'}`}>{title}</span>
        </div>
    </button>
);

const DynamicContentCard = ({ content, isDarkMode }: { content: (typeof selectorContent)[0], isDarkMode: boolean }) => {
    const Icon = content.icon;

    return (
        <Card className={`p-8 h-full flex flex-col justify-start backdrop-blur-md border-primary/50 shadow-2xl shadow-primary/30 transition-colors ${
            isDarkMode 
                ? 'bg-black/30 text-white' 
                : 'bg-white text-black'
        }`}>
            <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-primary bg-primary/20">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-white">{content.title}</h2>
            </div>
            <p className="text-primary text-lg mb-4 italic">
                {content.tagline}
            </p>
            <p className={isDarkMode ? "text-white/80 text-base mb-6 flex-grow" : "text-black text-base mb-6 flex-grow font-medium"}>
                {content.description}
            </p>
            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                {content.techTags.map((tag) => (
                    <span key={tag} className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/30">
                        {tag}
                    </span>
                ))}
            </div>
        </Card>
    );
};

const Footer = ({ isDarkMode }: { isDarkMode: boolean }) => (
    <footer className={
        `py-10 border-t transition-colors ${
            isDarkMode 
                ? 'bg-black/70 border-white/10 text-white/70' 
                : 'bg-gray-50 border-gray-200 text-black font-medium'
        }`
    }>
        <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="space-y-2">
                <p className="text-sm">
                    DecentGigs &copy; {new Date().getFullYear()}. All rights reserved.
                </p>
                <div className="flex justify-center space-x-4 text-sm">
                    <a href="#" className={isDarkMode ? 'hover:text-primary' : 'hover:text-primary'}>Privacy Policy</a>
                    <a href="#" className={isDarkMode ? 'hover:text-primary' : 'hover:text-primary'}>Terms of Service</a>
                    <a href="#" className={isDarkMode ? 'hover:text-primary' : 'hover:text-primary'}>Contact</a>
                </div>
            </div>
            <p className="mt-6 text-xs italic">
                Powered by Aiken Smart Contracts and Atala PRISM on Cardano.
            </p>
        </div>
    </footer>
);

export function Landing({ onGetStarted, onLearnMore, onShowProfile }: LandingProps) {
    
    const { theme, toggleTheme } = useTheme();
    const isDarkMode = theme === 'dark';

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            }
        }
    };

    const heroRef = useRef(null);
    const mouseX = useMotionValue(0.5); 
    const mouseY = useMotionValue(0.5); 

    const heroRotateX = useTransform(mouseY, [0, 1], [-3, 3]);
    const heroRotateY = useTransform(mouseX, [0, 1], [3, -3]);

    const heroBgLightX = useTransform(mouseX, [0, 1], ["0%", "100%"]);
    const heroBgLightY = useTransform(mouseY, [0, 1], ["0%", "100%"]);

    const handleHeroMouseMove = (event: React.MouseEvent) => {
        if (!heroRef.current) return;

        const hero = heroRef.current as HTMLElement;
        const rect = hero.getBoundingClientRect();

        const newX = (event.clientX - rect.left) / rect.width;
        const newY = (event.clientY - rect.top) / rect.height;

        mouseX.set(newX);
        mouseY.set(newY);
    };

    const [selectedContentId, setSelectedContentId] = useState(selectorContent[0].id);
    const selectedContent = selectorContent.find(c => c.id === selectedContentId) || selectorContent[0];

    return (
        <div className={`min-h-screen relative overflow-hidden transition-colors ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>

            {isDarkMode && (
                <>
                    <div className="absolute inset-0 bg-[#18181b] z-0" /> 
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMTAwJSI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzE4MTgxYiIvPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCBMIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA2KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXRoPjwvc3Zn>')",
                        zIndex: 1,
                    }} />
                    <div className="absolute inset-0" style={{
                        backgroundImage: "radial-gradient(circle 800px at 50% 10%, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
                        opacity: 0.8,
                        zIndex: 2,
                    }} />
                </>
            )}

            <div className="relative z-10">

                <motion.header
                    className={`border-b backdrop-blur-sm sticky top-0 z-50 transition-colors ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/70 border-gray-200'}`}
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                >
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    className="flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity"
                                    onClick={onShowProfile}
                                    title="View Profile"
                                    type="button"
                                >
                                    <img 
                                        src={iconLogo} 
                                        alt="DecentGigs" 
                                        className="w-10 h-10 object-contain"
                                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}
                                    />
                                    <span className={`font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${isDarkMode ? '' : ''}`}>
                                        DecentGigs
                                    </span>
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
                                <Button 
                                    variant="outline" 
                                    onClick={onGetStarted} 
                                    className={isDarkMode ? "border-zinc-700 hover:bg-zinc-800/50 text-white" : "border-black/20 text-black hover:bg-black/5"}
                                >
                                    Connect Wallet
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.header>

                <motion.section
                    ref={heroRef}
                    className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative overflow-hidden" 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    onMouseMove={handleHeroMouseMove}
                    onMouseLeave={() => { mouseX.set(0.5); mouseY.set(0.5); }}
                    style={{ 
                        perspective: 1000, 
                        '--hero-light-x': heroBgLightX, 
                        '--hero-light-y': heroBgLightY,
                    } as React.CSSProperties}
                >
                    <motion.div
                        className="absolute inset-0 z-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(circle 300px at var(--hero-light-x, 50%) var(--hero-light-y, 50%), rgba(139, 92, 246, 0.2) 0%, transparent 70%)`,
                            opacity: useTransform([mouseX, mouseY], (input: number[]) => {
                                const [xVal, yVal] = input;
                                return isDarkMode ? 0.5 + (0.5 - Math.abs(xVal - 0.5)) * 0.5 + (0.5 - Math.abs(yVal - 0.5)) * 0.5 : 0;
                            }),
                            transition: "opacity 0.1s linear, background-position 0.1s linear"
                        }}
                    />

                    <motion.div
                        className="text-center space-y-6 relative z-10" 
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        style={{ 
                            rotateX: heroRotateX, 
                            rotateY: heroRotateY, 
                            transition: "transform 0.1s ease-out" 
                        }}
                    >
                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-primary/30 bg-primary/10 rounded-full text-sm"
                        >
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <span className="text-primary/90">
                                Decentralized FreeLance Jobs
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            transition={{ duration: 0.6 }}
                            className={`max-w-4xl mx-auto text-4xl md:text-6xl font-extrabold leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`} 
                            style={{ fontFamily: "'Neue Montreal', sans-serif" }}
                        >
                            TRUSTLESS FREELANCING ON
                            <br />
                            <span className="text-primary">CARDANO BLOCKCHAIN</span>
                        </motion.h1>

                        <motion.p
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            transition={{ duration: 0.7 }}
                            className={isDarkMode ? "max-w-3xl mx-auto text-white/70 text-base" : "max-w-3xl mx-auto text-black font-medium text-base"}
                        >
                            CONNECT YOUR WALLET, VERIFY YOUR IDENTITY WITH ATALA PRISM, AND START WORKING WITH SMART CONTRACT ESCROW PROTECTION
                        </motion.p>

                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            transition={{ duration: 0.8 }}
                            className="flex gap-4 justify-center flex-wrap pt-4"
                        >
                            <Button
                                size="lg"
                                onClick={onGetStarted}
                                className="size-lg bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:opacity-90 shadow-lg shadow-primary/20 text-white"
                            >
                                Get Started
                            </Button>
                            <Button 
                                size="lg" 
                                variant="outline" 
                                onClick={onLearnMore} 
                                className={isDarkMode ? "size-lg border-zinc-800 bg-transparent text-white hover:bg-zinc-800/50" : "size-lg border-black/30 bg-transparent text-black hover:bg-black/5"}
                            >
                                Learn More
                            </Button>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10" 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        variants={containerVariants}
                    >
                        <FlowStepCard icon={Wallet} title="1. Connect Wallet" description="Your Wallet As Gateway" delay={0.1} isDarkMode={isDarkMode} />
                        <FlowStepCard icon={Shield} title="2. Get Verified" description="Optional KYC via Atala PRISM DID" delay={0.2} isDarkMode={isDarkMode} />
                        <FlowStepCard icon={FileText} title="3. Post or Bid" description="Create jobs or submit proposals" delay={0.3} isDarkMode={isDarkMode} />
                        <FlowStepCard icon={CheckCircle} title="4. Escrow & Pay" description="Smart contract handles payments" delay={0.4} isDarkMode={isDarkMode} />
                    </motion.div>
                </motion.section>

                <motion.section
                    className={`py-20 border-t relative overflow-hidden transition-colors ${isDarkMode ? 'border-white/10 bg-black/50' : 'border-gray-200 bg-gray-100'}`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.8 }}
                >
                    {isDarkMode && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-green-500/20 rounded-full filter blur-3xl opacity-50 z-0" />}
                    {isDarkMode && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-green-500/20 rounded-full filter blur-3xl opacity-50 z-0" />}

                    <div className="max-w-7xl mx-auto px-4 relative z-10">
                        <h2 className={`text-3xl font-bold mb-10 text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Core Decentralization Pillars
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <motion.div
                                key={selectedContent.id} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                                className="lg:col-span-2 min-h-[450px]"
                            >
                                <DynamicContentCard content={selectedContent} isDarkMode={isDarkMode} />

                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.5 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="lg:col-span-1"
                            >
                                <Card className={`p-4 flex flex-col space-y-3 h-full transition-colors ${
                                    isDarkMode 
                                        ? 'bg-black/50 border border-zinc-700' 
                                        : 'bg-white border border-gray-200 shadow-lg'
                                }`}>
                                    <h3 className={isDarkMode ? "text-white/80 font-semibold mb-2 px-2" : "text-black/80 font-semibold mb-2 px-2"}>Select Core Feature:</h3>
                                    {selectorContent.map(item => (
                                        <ContentButton
                                            key={item.id}
                                            icon={item.icon}
                                            title={item.title}
                                            isSelected={item.id === selectedContentId}
                                            onClick={() => setSelectedContentId(item.id)}
                                            isDarkMode={isDarkMode}
                                        />
                                    ))}
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>
                
                <motion.section
                    className={`py-16 border-t transition-colors ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="max-w-7xl mx-auto px-4">
                        <h2 className={`text-3xl font-bold mb-8 text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Project Showcase
                        </h2>
                        <div className="flex overflow-x-auto gap-6 pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scroll-smooth">
                            <div className="snap-start min-w-[300px] md:min-w-[calc(33.333%-16px)]">
                                <ShowcaseProjectCard
                                    icon={Code}
                                    title="Decentralized Swap Interface"
                                    description="Building a secure, non-custodial token swap interface powered by Cardano smart contracts."
                                    tags={["Plutus", "Haskell", "React", "DEX"]}
                                    design="default" 
                                    isDarkMode={isDarkMode}
                                />
                            </div>
                            <div className="snap-start min-w-[300px] md:min-w-[calc(33.333%-16px)]">
                                <ShowcaseProjectCard
                                    icon={Globe}
                                    title="DID Identity Management"
                                    description="Developing a front-end portal for managing verifiable credentials using Atala PRISM IDs."
                                    tags={["Atala PRISM", "Next.js", "DID"]}
                                    design="inverted" 
                                    isDarkMode={isDarkMode}
                                />
                            </div>
                            <div className="snap-start min-w-[300px] md:min-w-[calc(33.333%-16px)]">
                                <ShowcaseProjectCard
                                    icon={Award}
                                    title="On-Chain Reputation System"
                                    description="Decentralized reputation tracking with verifiable credentials and immutable work history stored on Cardano."
                                    tags={["Reputation", "Atala PRISM", "Smart Contracts"]}
                                    design="border" 
                                    isDarkMode={isDarkMode}
                                />
                            </div>
                            <div className="snap-start min-w-[300px] md:min-w-[calc(33.333%-16px)]">
                                <ShowcaseProjectCard
                                    icon={Wallet}
                                    title="Multi-Sig Treasury"
                                    description="A custom multi-signature smart contract to manage DAO funds transparently."
                                    tags={["Plutus", "DAO", "Security"]}
                                    design="default"
                                    isDarkMode={isDarkMode}
                                />
                            </div>
                            <div className="snap-start min-w-[300px] md:min-w-[calc(33.333%-16px)]">
                                <ShowcaseProjectCard
                                    icon={Briefcase}
                                    title="P2P Escrow DApp"
                                    description="The core dApp logic for trustless, peer-to-peer job escrow services."
                                    tags={["Aiken", "React", "Escrow"]}
                                    design="inverted"
                                    isDarkMode={isDarkMode}
                                />
                            </div>
                        </div>
                        <div className="text-center mt-10">
                            <Button size="lg" variant="default" onClick={onLearnMore} className="bg-primary/90 hover:bg-primary">
                                View All Projects
                            </Button>
                        </div>
                    </div>
                </motion.section>
                
                <motion.section
                    className={`py-16 border-t transition-colors ${isDarkMode ? 'border-white/10 bg-black/50' : 'border-gray-200 bg-gray-100'}`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="max-w-7xl mx-auto px-4">
                        <h2 className={`text-3xl font-bold mb-10 text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Our Impact on the Decentralized Ecosystem
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            <MetricCard icon={Users} metric="15K+" description="Verified Users" delay={0.1} isDarkMode={isDarkMode} />
                            <MetricCard icon={Briefcase} metric="4,200+" description="Jobs Delivered" delay={0.2} isDarkMode={isDarkMode} />
                            <MetricCard icon={DollarSign} metric="$5M+" description="Paid to Freelancers" delay={0.3} isDarkMode={isDarkMode} />
                            <MetricCard icon={Award} metric="100%" description="Escrow Success Rate" delay={0.4} isDarkMode={isDarkMode} />
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    className={`py-16 border-t transition-colors ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
                >
                    <div className="max-w-7xl mx-auto px-4">
                        <h2 className={`text-3xl font-bold mb-10 text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Top Rated Freelancers
                        </h2>
                        <p className={isDarkMode ? 'text-white/70 text-center' : 'text-black font-medium text-center'}>
                            Freelancer showcase coming soon...
                        </p>
                    </div>
                </motion.section>
            </div>
            
            <Footer isDarkMode={isDarkMode} />
        </div>
    );
}
