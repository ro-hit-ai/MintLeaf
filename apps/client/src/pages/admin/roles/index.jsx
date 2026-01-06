// src/pages/admin/roles/index.jsx
import React,{ useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../../../store/session";

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [isAllRolesActive, setIsAllRolesActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { fetchWithAuth } = useUser();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("/v1/role/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch roles: ${response.statusText}`);
      const data = await response.json();
      if (data.success) {
        setRoles(data.roles);
        setIsAllRolesActive(data.roles_active?.roles_active || false);
      } else {
        throw new Error(data.error || "Failed to fetch roles");
      }
    } catch (error) {
      toast.error(`Error fetching roles: ${error.message}`, {
        toastId: "fetch-roles-error",
        autoClose: 5000,
      });
      navigate("/auth/login");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, [fetchWithAuth]);

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;

    try {
      const response = await fetchWithAuth(`/v1/role/${roleId}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`Failed to delete role: ${response.statusText}`);
      const data = await response.json();
      if (data.success !== false) {
        toast.success("Role deleted successfully");
        fetchRoles();
      } else {
        throw new Error(data.error || "Failed to delete role");
      }
    } catch (error) {
      toast.error(`Error deleting role: ${error.message}`, {
        toastId: "delete-role-error",
        autoClose: 5000,
      });
    }
  };

  const handleToggleRole = async (roleId, isActive) => {
    try {
      const response = await fetchWithAuth(`/v1/role/${roleId}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!response.ok) throw new Error(`Failed to toggle role: ${response.statusText}`);
      const data = await response.json();
      if (data.success !== false) {
        toast.success("Role status updated successfully");
        fetchRoles();
      } else {
        throw new Error(data.error || "Failed to toggle role");
      }
    } catch (error) {
      toast.error(`Error toggling role: ${error.message}`, {
        toastId: "toggle-role-error",
        autoClose: 5000,
      });
    }
  };

  const handleToggleAllRoles = async (isActive) => {
    try {
      const response = await fetchWithAuth(`/v1/config/toggle-roles`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error(`Failed to toggle all roles: ${response.statusText}`);
      const data = await response.json();
      if (data.success !== false) {
        toast.success("Role status updated successfully");
        fetchRoles();
      } else {
        throw new Error(data.error || "Failed to toggle all roles");
      }
    } catch (error) {
      toast.error(`Error toggling all roles: ${error.message}`, {
        toastId: "toggle-all-roles-error",
        autoClose: 5000,
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            onClick={() => navigate("/admin/roles/new")}
          >
            Add Role
          </button>
          <button
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            onClick={() => handleToggleAllRoles(false)}
          >
            Disable All Roles
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => handleToggleAllRoles(true)}
          >
            Enable All Roles
          </button>
        </div>
      </div>
      <div className="w-full rounded-lg border bg-white shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Roles</h2>
            <span
              className={`px-2 py-0.5 text-xs rounded ${
                isAllRolesActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {isAllRolesActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <div className="p-6">
          {roles.length === 0 ? (
            <div>No roles available</div>
          ) : (
            <ul>
              {roles.map((role) => (
                <li key={role.id} className="border-b py-2">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <strong>{role.name}</strong>
                        <button
                          className={`px-2 py-1 text-xs rounded ${
                            role.isActive
                              ? "bg-green-500 text-white"
                              : "bg-gray-300 text-gray-800"
                          }`}
                          onClick={() => handleToggleRole(role.id, role.isActive)}
                        >
                          {role.isActive ? "Active" : "Inactive"}
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">ID: {role.id}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => navigate(`/admin/roles/update?id=${role.id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Roles;