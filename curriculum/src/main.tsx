import React from 'react'
import ReactDOM from 'react-dom/client'
import CurriculumPage from './components/CurriculumPage'
import '../../styles.css'
import '../../styles/light-theme.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CurriculumPage />
  </React.StrictMode>,
)
