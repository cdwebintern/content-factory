import { GoogleOAuthProvider } from "@react-oauth/google"
import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import AppShell from "@/components/layout/AppShell"
import DataProvider from "@/context/DataProvider"
import { GOOGLE_CLIENT_ID, SIGN_IN_CONFIGURED } from "@/lib/googleAuth"
import Home from "@/pages/Home"
import MeetingsPage from "@/pages/MeetingsPage"
import ProfilePage from "@/pages/ProfilePage"
import SettingsPage from "@/pages/SettingsPage"
import TasksPage from "@/pages/TasksPage"

export default function App() {
  const app = (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="meetings" element={<MeetingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )

  // The provider needs a client ID, so only mount it once one is configured
  if (!SIGN_IN_CONFIGURED) return app
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{app}</GoogleOAuthProvider>
}