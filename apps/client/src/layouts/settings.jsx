import { Bell, Flag, KeyRound, SearchSlash } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Settings({ children }) {
  const location = useLocation();

  // Mock translation function (replace with react-i18next in production)
  const translations = {
    notifications: "Notifications",
    reset_password: "Reset Password",
    feature_flags: "Feature Flags",
    sessions: "Sessions",
  };
  const t = (key) => translations[key] || key;

  const navItems = [
    { name: t("notifications"), to: "/settings/notifications", icon: Bell },
    { name: t("reset_password"), to: "/settings/password", icon: KeyRound },
    { name: t("feature_flags"), to: "/settings/flags", icon: Flag },
    { name: t("sessions"), to: "/settings/sessions", icon: SearchSlash },
  ];

  return (
    <div>
      <main className="relative pt-8 w-full">
        <div className="max-w-screen-xl mx-auto pb-6 px-4 sm:px-6 lg:pb-16 lg:px-8">
          <div className="bg-background rounded-lg shadow overflow-hidden">
            <div className="divide-y lg:grid lg:grid-cols-12 lg:divide-y-0 lg:divide-x">
              {/* Sidebar */}
              <aside className="py-6 px-2 lg:col-span-3">
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={classNames(
                        location.pathname === item.to
                          ? "bg-secondary dark:bg-primary text-white"
                          : "hover:bg-[#F0F3F9] dark:hover:bg-white dark:hover:text-gray-900",
                        "group flex items-center gap-x-3 py-2 px-3 rounded-md text-sm font-semibold leading-6"
                      )}
                    >
                      <item.icon className="flex-shrink-0 h-5 w-5 text-foreground" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </aside>

              {/* Main content */}
              <div className="lg:col-span-9">{children}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;
