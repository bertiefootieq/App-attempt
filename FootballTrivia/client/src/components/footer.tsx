import { Volleyball } from "lucide-react";
import { FaTwitter, FaInstagram, FaFacebook } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "Dashboard", href: "/" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Friend Groups", href: "/friends" },
    { label: "Question Bank", href: "/admin" },
  ];

  const supportLinks = [
    { label: "Help Center", href: "#" },
    { label: "Contact Us", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ];

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary rounded-full p-2">
                <Volleyball className="text-white text-2xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Soccer Trivia</h3>
                <p className="text-gray-300 text-sm">Test Your Volleyball Knowledge</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Challenge your friends, compete globally, and become the ultimate soccer trivia champion. 
              Join thousands of football fans testing their knowledge daily.
            </p>
            <div className="flex space-x-4">
              <button className="text-gray-300 hover:text-white transition-colors">
                <FaTwitter className="text-xl" />
              </button>
              <button className="text-gray-300 hover:text-white transition-colors">
                <FaInstagram className="text-xl" />
              </button>
              <button className="text-gray-300 hover:text-white transition-colors">
                <FaFacebook className="text-xl" />
              </button>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <div className="space-y-2">
              {quickLinks.map((link, index) => (
                <a 
                  key={index}
                  href={link.href} 
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          
          {/* Support Links */}
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <div className="space-y-2">
              {supportLinks.map((link, index) => (
                <a 
                  key={index}
                  href={link.href} 
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; {currentYear} Soccer Trivia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
