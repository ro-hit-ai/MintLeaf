// src/pages/admin/roles/new.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import { useUser } from "../../../store/session";

// Mock PERMISSIONS_CONFIG (replace with actual import if available)
const PERMISSIONS_CONFIG = [
  {
    category: "Admin",
    permissions: ["manage_users", "manage_roles", "manage_settings"],
  },
  {
    category: "Content",
    permissions: ["create_content", "edit_content", "delete_content"],
  },
];

const NewRole = () => {
  const [step, setStep] = useState(1);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [roleName, setRoleName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { fetchWithAuth } = useUser();

  const handleAddRole = async () => {
    if (!roleName) {
      toast.error("Role name is missing", {
        toastId: "add-role-error",
        autoClose: 5000,
      });
      return;
    }

    try {
      const response = await fetchWithAuth("/v1/role/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roleName,
          permissions: selectedPermissions,
          users: selectedUsers,
        }),
      });
      if (!response.ok) throw new Error(`Failed to create role: ${response.statusText}`);
      const data = await response.json();
      if (data.success) {
        toast.success("Role created successfully");
        navigate("/admin/roles");
      } else {
        throw new Error(data.error || "Failed to create role");
      }
    } catch (error) {
      toast.error(`Error creating role: ${error.message}`, {
        toastId: "add-role-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
  };

  const handleSelectCategory = (category, isSelected) => {
    const categoryPermissions =
      PERMISSIONS_CONFIG.find((group) => group.category === category)?.permissions || [];
    if (isSelected) {
      const newPermissions = [
        ...selectedPermissions,
        ...categoryPermissions.filter((p) => !selectedPermissions.includes(p)),
      ];
      setSelectedPermissions(newPermissions);
    } else {
      setSelectedPermissions(
        selectedPermissions.filter((p) => !categoryPermissions.includes(p))
      );
    }
  };

  const isCategoryFullySelected = (category) => {
    const categoryPermissions =
      PERMISSIONS_CONFIG.find((group) => group.category === category)?.permissions || [];
    return categoryPermissions.every((p) => selectedPermissions.includes(p));
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth("/v1/users/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        throw new Error(data.error || "Failed to fetch users");
      }
    } catch (error) {
      toast.error(`Error fetching users: ${error.message}`, {
        toastId: "fetch-users-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (step === 2) {
      fetchUsers();
    }
  }, [step, fetchWithAuth]);

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center">
          <div className={`flex items-center ${step === 1 ? "text-blue-600" : "text-gray-500"}`}>
            <div
              className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                step === 1 ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300"
              }`}
            >
              1
            </div>
            <span className="ml-2">Configure Role</span>
          </div>
          <div className={`flex-1 h-0.5 mx-4 ${step === 2 ? "bg-blue-600" : "bg-gray-300"}`} />
          <div className={`flex items-center ${step === 2 ? "text-blue-600" : "text-gray-500"}`}>
            <div
              className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                step === 2 ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300"
              }`}
            >
              2
            </div>
            <span className="ml-2">Select Users</span>
          </div>
        </div>
      </div>
      {step === 1 ? (
        <div className="w-full rounded-lg border bg-white shadow-sm">
          <div className="p-6">
            <div className="flex flex-row justify-between items-center">
              <input
                placeholder="Role Name"
                value={roleName}
                className="w-1/4 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setRoleName(e.target.value)}
              />
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                onClick={() => setStep(2)}
                disabled={!roleName}
              >
                Next
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Select Permissions</h3>
              {PERMISSIONS_CONFIG.map((group) => (
                <div key={group.category} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{group.category}</h4>
                    <label className="flex items-center space-x-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={isCategoryFullySelected(group.category)}
                        onChange={(e) => handleSelectCategory(group.category, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span>Select All</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.permissions.map((permission) => (
                      <label key={permission} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions([...selectedPermissions, permission]);
                            } else {
                              setSelectedPermissions(
                                selectedPermissions.filter((p) => p !== permission)
                              );
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full rounded-lg border bg-white shadow-sm">
          <div className="p-6">
            <div className="flex flex-row justify-between items-center">
              <h2 className="text-lg font-semibold">Select Users</h2>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  onClick={handleAddRole}
                  disabled={isLoading}
                >
                  Create Role
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  placeholder="Search users..."
                  className="pl-8 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {isLoading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="flex-1">{user.email}</span>
                    </label>
                  ))}
                </div>
              )}
              {!isLoading && filteredUsers.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  {searchTerm ? "No users found" : "No users available"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewRole;