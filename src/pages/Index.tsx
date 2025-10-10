import { useEffect, useState } from "react";
import { getUser } from "@/lib/storage";
import Dashboard from "./Dashboard";
import Auth from "./Auth";

const Index = () => {
  const [user, setUser] = useState<ReturnType<typeof getUser> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return user ? <Dashboard /> : <Auth />;
};

export default Index;
