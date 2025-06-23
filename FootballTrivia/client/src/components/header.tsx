import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Volleyball, Bell, LogOut, User as UserIcon, Settings, Zap, Lightbulb } from "lucide-react";
import type { User } from "@shared/schema";

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [location, navigate] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    onLogout();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { label: "Dashboard", path: "/" },
    { label: "Live Competitions", path: "/live-competitions", icon: Zap },
    { label: "Suggest Question", path: "/suggest-question", icon: Lightbulb },
    { label: "Leaderboard", path: "/leaderboard" },
    { label: "Friends", path: "/friends" },
    { label: "Admin", path: "/admin" },
  ];

  return (
    <header className="bg-primary field-pattern shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="bg-white rounded-full p-2">
              <Volleyball className="text-primary text-2xl" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">Soccer Trivia</h1>
              <p className="text-green-100 text-sm">Test Your Volleyball Knowledge</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`font-medium transition-colors flex items-center space-x-1 ${
                  isActive(item.path)
                    ? 'text-green-200'
                    : 'text-white hover:text-green-200'
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-4">
            {/* User Profile */}
            <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg px-3 py-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-yellow-500 text-primary font-bold text-sm">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-medium hidden sm:inline">
                {user.displayName}
              </span>
              <Badge variant="secondary" className="bg-green-200 text-primary text-xs">
                {user.totalScore.toLocaleString()} pts
              </Badge>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-white hover:text-green-200">
              <Bell className="w-5 h-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:text-green-200">
                  <UserIcon className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <UserIcon className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-black bg-opacity-20">
        <div className="px-4 py-2 flex space-x-4 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`text-sm font-medium whitespace-nowrap transition-colors ${
                isActive(item.path)
                  ? 'text-green-200'
                  : 'text-white hover:text-green-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
