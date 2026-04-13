import Link from 'next/link';
import { 
    ShieldCheck, 
    LayoutDashboard, 
    TicketCheck, 
    Activity, 
    Settings, 
    ChevronRight,
    Globe
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Policy Hub', href: '/policies', icon: ShieldCheck },
    { name: 'Resolution Center', href: '/tickets', icon: TicketCheck },
    { name: 'Suite Monitoring', href: '/monitoring', icon: Activity },
];

export function Sidebar() {
    return (
        <aside className="w-64 border-r border-white/5 flex flex-col h-full bg-black/20 backdrop-blur-xl">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                        <Globe className="text-primary w-5 h-5" />
                    </div>
                    <span className="font-bold tracking-tight text-lg">
                        Accredit<span className="text-primary">.</span>
                    </span>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-between group px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 text-secondary hover:text-white"
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={18} className="opacity-70 group-hover:opacity-100 group-hover:text-primary transition-all" />
                                <span className="text-sm font-medium">{item.name}</span>
                            </div>
                            <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all" />
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-6 space-y-4">
                <div className="glass-card p-4 bg-primary/5 border-primary/10">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Current Tier</p>
                    <p className="text-sm font-semibold mb-2">Active Controller</p>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="bg-primary w-full h-full" />
                    </div>
                </div>

                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-secondary hover:text-white hover:bg-white/5 transition-all"
                >
                    <Settings size={18} />
                    <span className="text-sm font-medium">Settings</span>
                </Link>
            </div>
        </aside>
    );
}
