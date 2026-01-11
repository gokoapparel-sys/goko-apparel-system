import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/common/PrivateRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UploadImage from './pages/UploadImage'
import ItemsList from './pages/items/ItemsList'
import ItemForm from './pages/items/ItemForm'
import ItemDetail from './pages/items/ItemDetail'
import FabricsList from './pages/fabrics/FabricsList'
import FabricForm from './pages/fabrics/FabricForm'
import FabricDetail from './pages/fabrics/FabricDetail'
import PatternsList from './pages/patterns/PatternsList'
import PatternForm from './pages/patterns/PatternForm'
import PatternDetail from './pages/patterns/PatternDetail'
import ExhibitionsList from './pages/exhibitions/ExhibitionsList'
import ExhibitionForm from './pages/exhibitions/ExhibitionForm'
import ExhibitionDetail from './pages/exhibitions/ExhibitionDetail'
import StaffWebCatalog from './pages/exhibitions/StaffWebCatalog'
import CustomerWebCatalog from './pages/exhibitions/CustomerWebCatalog'
import ExhibitionLandingPage from './pages/exhibitions/ExhibitionLandingPage'
import Exhibition2026AWLP from './pages/exhibitions/Exhibition2026AWLP'
import Exhibition2026JanLP from './pages/exhibitions/Exhibition2026JanLP'
import Exhibition2026AWPDFViewer from './pages/exhibitions/Exhibition2026AWPDFViewer'
import PickupsList from './pages/pickups/PickupsList'
import PickupForm from './pages/pickups/PickupForm'
import PickupDetail from './pages/pickups/PickupDetail'
import PickupPublicView from './pages/pickups/PickupPublicView'
import PickupSessionStart from './pages/pickups/PickupSessionStart'
import PickupScanSession from './pages/pickups/PickupScanSession'
import ScanItem from './pages/pickups/ScanItem'
import LoansList from './pages/loans/LoansList'
import LoanForm from './pages/loans/LoanForm'
import LoanDetail from './pages/loans/LoanDetail'
import PickupRankingList from './pages/pickupRankings/PickupRankingList'
import PickupRankingDetail from './pages/pickupRankings/PickupRankingDetail'

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Public routes for pickup */}
          <Route path="/pickup/:id" element={<PickupPublicView />} />
          <Route path="/pickup-session-start" element={<PickupSessionStart />} />
          <Route path="/pickup-scan-session" element={<PickupScanSession />} />
          <Route path="/scan-item/:itemId" element={<ScanItem />} />
          {/* Public customer catalog */}
          <Route path="/exhibitions/:id/customer-catalog" element={<CustomerWebCatalog />} />
          {/* Public exhibition landing page */}
          <Route path="/exhibitions/:id/landing" element={<ExhibitionLandingPage />} />
          {/* 2026 AW Exhibition Landing Page (December) */}
          <Route path="/exhibition-2026-aw" element={<Exhibition2026AWLP />} />
          {/* 2026 AW Exhibition Landing Page (January) */}
          <Route path="/exhibition-2026-jan" element={<Exhibition2026JanLP />} />
          {/* 2026 AW Exhibition PDF */}
          <Route path="/exhibition-2026-aw-pdf" element={<Exhibition2026AWPDFViewer />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/uploads"
            element={
              <PrivateRoute>
                <UploadImage />
              </PrivateRoute>
            }
          />
          <Route
            path="/items"
            element={
              <PrivateRoute>
                <ItemsList />
              </PrivateRoute>
            }
          />
          <Route
            path="/items/new"
            element={
              <PrivateRoute>
                <ItemForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/items/:id"
            element={
              <PrivateRoute>
                <ItemForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/items/:id/detail"
            element={
              <PrivateRoute>
                <ItemDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/fabrics"
            element={
              <PrivateRoute>
                <FabricsList />
              </PrivateRoute>
            }
          />
          <Route
            path="/fabrics/new"
            element={
              <PrivateRoute>
                <FabricForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/fabrics/:id"
            element={
              <PrivateRoute>
                <FabricForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/fabrics/:id/detail"
            element={
              <PrivateRoute>
                <FabricDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/patterns"
            element={
              <PrivateRoute>
                <PatternsList />
              </PrivateRoute>
            }
          />
          <Route
            path="/patterns/new"
            element={
              <PrivateRoute>
                <PatternForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/patterns/:id"
            element={
              <PrivateRoute>
                <PatternForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/patterns/:id/detail"
            element={
              <PrivateRoute>
                <PatternDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/exhibitions"
            element={
              <PrivateRoute>
                <ExhibitionsList />
              </PrivateRoute>
            }
          />
          <Route
            path="/exhibitions/new"
            element={
              <PrivateRoute>
                <ExhibitionForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/exhibitions/:id"
            element={
              <PrivateRoute>
                <ExhibitionForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/exhibitions/:id/detail"
            element={
              <PrivateRoute>
                <ExhibitionDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/exhibitions/:id/staff-catalog"
            element={
              <PrivateRoute>
                <StaffWebCatalog />
              </PrivateRoute>
            }
          />
          <Route
            path="/pickups"
            element={
              <PrivateRoute>
                <PickupsList />
              </PrivateRoute>
            }
          />
          <Route
            path="/pickups/new"
            element={
              <PrivateRoute>
                <PickupForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/pickups/:id"
            element={
              <PrivateRoute>
                <PickupForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/pickups/:id/detail"
            element={
              <PrivateRoute>
                <PickupDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/loans"
            element={
              <PrivateRoute>
                <LoansList />
              </PrivateRoute>
            }
          />
          <Route
            path="/loans/new"
            element={
              <PrivateRoute>
                <LoanForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/loans/:id"
            element={
              <PrivateRoute>
                <LoanForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/loans/:id/detail"
            element={
              <PrivateRoute>
                <LoanDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/pickup-rankings"
            element={
              <PrivateRoute>
                <PickupRankingList />
              </PrivateRoute>
            }
          />
          <Route
            path="/pickup-rankings/:id"
            element={
              <PrivateRoute>
                <PickupRankingDetail />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
