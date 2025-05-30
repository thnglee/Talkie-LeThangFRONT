import React, { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthContextProvider, useAuth } from "../context/authContext";
import { StreamContextProvider } from "../context/streamContext";
import CallHandler from "./(app)/call/callHandler";
import { useHeartbeat } from "../hook/useHeartBeat";

const MainLayout = () => {
  const { isAuthenticated, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useHeartbeat();

  useEffect(() => {
    if (typeof isAuthenticated === "undefined") return;
    const inApp = segments[0] === "(app)";

    const redirect = () => {
      if (isAuthenticated && !inApp) {
        router.replace("/home");
      } else if (!isAuthenticated) {
        router.replace("/signIn");
      }
    };

    const timer = setTimeout(redirect, 1000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthContextProvider>
      <StreamContextProvider>
        <CallHandler />
        <MainLayout />
      </StreamContextProvider>
    </AuthContextProvider>
  );
}
