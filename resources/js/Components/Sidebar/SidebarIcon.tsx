import {
    Home, ClipboardList, Inbox, Zap, Users, Package,
    Archive, Wrench, TrendingUp, CreditCard, Tag,
    Layers, FileText, BarChart2, PieChart, Settings,
    Briefcase, MapPin, Shield, UserCircle, DollarSign,
} from 'lucide-react';

interface Props { name: string; size?: number; }

const icons: Record<string, React.ElementType> = {
    'home'         : Home,
    'clipboard'    : ClipboardList,
    'inbox'        : Inbox,
    'activity'     : Zap,
    'users'        : Users,
    'package'      : Package,
    'archive'      : Archive,
    'tool'         : Wrench,
    'trending-up'  : TrendingUp,
    'credit-card'  : CreditCard,
    'tag'          : Tag,
    'layers'       : Layers,
    'file-text'    : FileText,
    'bar-chart'    : BarChart2,
    'pie-chart'    : PieChart,
    'settings'     : Settings,
    'briefcase'    : Briefcase,
    'map-pin'      : MapPin,
    'shield'       : Shield,
    'user-circle'  : UserCircle,
    'dollar-sign'  : DollarSign,
};

export default function SidebarIcon({ name, size = 18 }: Props) {
    const Icon = icons[name] ?? Home;
    return <Icon size={size} strokeWidth={1.8} />;
}