import React from 'react'
import ReactDOM from 'react-dom/client'
import CurriculumPage from './components/CurriculumPage'
import '../../styles.css'
import '../../styles/light-theme.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Failed to find root element')
  document.body.innerHTML = '<p style="color: red;">Error: Root element not found</p>'
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <CurriculumPage />
      </React.StrictMode>,
    )
  } catch (error) {
    console.error('Failed to mount React app:', error)
  }
}
