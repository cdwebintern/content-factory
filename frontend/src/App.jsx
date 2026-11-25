import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import AppShell from "@/components/layout/AppShell"
import DataProvider from "@/context/DataProvider"
import Home from "@/pages/Home"
import MeetingsPage from "@/pages/MeetingsPage"
import ProfilePage from "@/pages/ProfilePage"
import SettingsPage from "@/pages/SettingsPage"
import TasksPage from "@/pages/TasksPage"

export default function App() {
  return (
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
}