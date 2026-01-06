import React from 'react';
import { useToast } from "../hooks/use-toast";

const NoPermissions = () => {
  const { toast } = useToast();
  
  React.useEffect(() => {
    toast({
      title: "Unauthorized",
      description: "Please check your permissions.",
    });
  }, [toast]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-4 text-lg text-gray-700">
          You do not have permission to view this page.
        </p>
      </div>
    </div>
  );
};

export default NoPermissions;