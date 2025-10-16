import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AppProvider } from "@/contexts/AppContext";

// Listen for service worker activation messages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'SW_ACTIVATED' && event.data.forceReload) {
      console.log('[App] New service worker activated, reloading...');
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <AppProvider>
    <App />
  </AppProvider>
);
