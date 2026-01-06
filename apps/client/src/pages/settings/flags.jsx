import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const defaultFlags = [
  {
    name: "Hide Keyboard Shortcuts",
    enabled: false,
    description: "Hide keyboard shortcuts",
    flagKey: "keyboard_shortcuts_hide",
  },
  {
    name: "Hide Name in Create",
    enabled: false,
    description: "Hide name field in create a new issue",
    flagKey: "name_hide",
  },
  {
    name: "Hide Email in Create",
    enabled: false,
    description: "Hide email field in create a new issue",
    flagKey: "email_hide",
  },
];

export default function FeatureFlags() {
  const [flags, setFlags] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Load flags from localStorage on component mount
    const savedFlags = localStorage.getItem("featureFlags");
    if (savedFlags) {
      const parsedFlags = JSON.parse(savedFlags);
      // Merge saved flags with default flags, adding any new flags
      const mergedFlags = defaultFlags.map(defaultFlag => {
        const savedFlag = parsedFlags.find((f) => f.name === defaultFlag.name);
        return savedFlag || defaultFlag;
      });
      setFlags(mergedFlags);
      localStorage.setItem("featureFlags", JSON.stringify(mergedFlags));
    } else {
      setFlags(defaultFlags);
      localStorage.setItem("featureFlags", JSON.stringify(defaultFlags));
    }
  }, []);

  const toggleFlag = (flagName) => {
    const updatedFlags = flags.map((flag) =>
      flag.name === flagName ? { ...flag, enabled: !flag.enabled } : flag
    );
    setFlags(updatedFlags);
    localStorage.setItem("featureFlags", JSON.stringify(updatedFlags));
    router.reload();
  };

  return React.createElement("div", { className: "p-6" },
    React.createElement("h1", { className: "text-2xl font-bold mb-6" }, "Feature Flags"),
    React.createElement("div", { className: "space-y-4" },
      flags.map((flag) =>
        React.createElement("div", {
          key: flag.name,
          className: "flex flex-row items-center justify-between p-4 border rounded-lg"
        },
          React.createElement("div", null,
            React.createElement("div", { className: "font-bold text-sm" }, flag.name),
            React.createElement("div", { className: "text-xs" }, flag.description)
          ),
          React.createElement("div", null,
            React.createElement("button", {
              onClick: () => toggleFlag(flag.name)
            }, flag.enabled ? "Disable" : "Enable")
          )
        )
      )
    )
  );
}