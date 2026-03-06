// js/learn/reader.js — PDF page-by-page reader using pdf.js
// Renders one page at a time with keyboard/swipe/click navigation

import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

let pdfDoc = null
let currentPage = 1
let totalPages = 0
let rendering = false
let pendingPage = null
let scale = 1
let fitMode = 'height' // 'height' | 'width' | 'page'

// DOM refs (set in init)
let canvas, ctx, viewport, pageInfo, progressBar, loadingEl

export async function initReader(pdfUrl) {
  canvas = document.getElementById('reader-canvas')
  ctx = canvas.getContext('2d')
  viewport = document.querySelector('.reader__viewport')
  pageInfo = document.querySelector('.reader__page-info')
  progressBar = document.querySelector('.reader__progress-bar')
  loadingEl = document.querySelector('.reader__loading')

  // Restore last position from sessionStorage
  const savedPage = sessionStorage.getItem(`reader:${pdfUrl}:page`)
  if (savedPage) currentPage = parseInt(savedPage, 10)

  // Load PDF
  try {
    pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise
    totalPages = pdfDoc.numPages
    if (currentPage > totalPages) currentPage = 1
    updatePageInfo()
    if (loadingEl) loadingEl.style.display = 'none'
    renderPage(currentPage)
  } catch (err) {
    console.error('[reader] Failed to load PDF:', err)
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div style="color: var(--status-red);">Failed to load document</div>
        <div style="font-size: 11px; color: var(--gray-medium);">${err.message || 'Unknown error'}</div>
      `
    }
  }

  // Bind controls
  bindKeyboard()
  bindSwipe()
  bindNavZones()
  bindToolbar()
  bindResize()
}

async function renderPage(num) {
  if (rendering) { pendingPage = num; return }
  rendering = true

  try {
    const page = await pdfDoc.getPage(num)
    const pdfViewport = page.getViewport({ scale: 1 })

    // Calculate scale to fit viewport
    const vw = viewport.clientWidth - 32 // padding
    const vh = viewport.clientHeight - 32

    if (fitMode === 'width') {
      scale = vw / pdfViewport.width
    } else if (fitMode === 'page') {
      scale = Math.min(vw / pdfViewport.width, vh / pdfViewport.height)
    } else if (fitMode !== 'custom') {
      // height fit (default — kindle-like)
      scale = vh / pdfViewport.height
      // But don't exceed viewport width
      if (pdfViewport.width * scale > vw) {
        scale = vw / pdfViewport.width
      }
    }

    const scaledViewport = page.getViewport({ scale })

    // HiDPI rendering
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(scaledViewport.width * dpr)
    canvas.height = Math.floor(scaledViewport.height * dpr)
    canvas.style.width = `${Math.floor(scaledViewport.width)}px`
    canvas.style.height = `${Math.floor(scaledViewport.height)}px`

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise

    currentPage = num
    updatePageInfo()
    savePosition()
  } catch (err) {
    console.error('[reader] Render error:', err)
  }

  rendering = false
  if (pendingPage !== null) {
    const next = pendingPage
    pendingPage = null
    renderPage(next)
  }
}

function updatePageInfo() {
  if (pageInfo) pageInfo.textContent = `${currentPage} / ${totalPages}`
  if (progressBar) progressBar.style.width = `${(currentPage / totalPages) * 100}%`
}

function savePosition() {
  const url = new URLSearchParams(window.location.search).get('src')
  if (url) sessionStorage.setItem(`reader:${url}:page`, currentPage)
}

// --- Navigation ---

export function goNext() {
  if (currentPage < totalPages) renderPage(currentPage + 1)
}

export function goPrev() {
  if (currentPage > 1) renderPage(currentPage - 1)
}

export function goFirst() { renderPage(1) }
export function goLast() { if (totalPages) renderPage(totalPages) }

// --- Keyboard ---

function bindKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
        e.preventDefault(); goNext(); break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault(); goPrev(); break
      case 'Home': e.preventDefault(); goFirst(); break
      case 'End': e.preventDefault(); goLast(); break
      case 'Escape':
        window.location.href = '/learn'; break
    }
  })
}

// --- Touch/Swipe ---

function bindSwipe() {
  let startX = 0, startY = 0, startTime = 0

  viewport.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    startTime = Date.now()
  }, { passive: true })

  viewport.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX
    const dy = e.changedTouches[0].clientY - startY
    const dt = Date.now() - startTime

    // Must be a quick swipe, primarily horizontal
    if (dt > 500 || Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return

    if (dx < 0) goNext()
    else goPrev()
  }, { passive: true })

  // Tap zones for mobile (left/right thirds)
  viewport.addEventListener('click', (e) => {
    if (e.target.closest('.reader__nav-zone') || e.target.closest('button') || e.target.closest('a')) return
    const rect = viewport.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    if (x < 0.3) goPrev()
    else if (x > 0.7) goNext()
  })
}

// --- Nav zone buttons ---

function bindNavZones() {
  const prev = document.querySelector('.reader__nav-zone--prev')
  const next = document.querySelector('.reader__nav-zone--next')
  if (prev) prev.addEventListener('click', goPrev)
  if (next) next.addEventListener('click', goNext)
}

// --- Toolbar buttons ---

function bindToolbar() {
  const zoomIn = document.getElementById('reader-zoom-in')
  const zoomOut = document.getElementById('reader-zoom-out')
  const fitBtn = document.getElementById('reader-fit')

  if (zoomIn) zoomIn.addEventListener('click', () => {
    fitMode = 'custom'
    scale *= 1.2
    renderPage(currentPage)
  })

  if (zoomOut) zoomOut.addEventListener('click', () => {
    fitMode = 'custom'
    scale /= 1.2
    renderPage(currentPage)
  })

  if (fitBtn) fitBtn.addEventListener('click', () => {
    // Cycle: height → width → page → height
    if (fitMode === 'height') fitMode = 'width'
    else if (fitMode === 'width') fitMode = 'page'
    else fitMode = 'height'
    renderPage(currentPage)
  })
}

// --- Resize ---

function bindResize() {
  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      if (pdfDoc && fitMode !== 'custom') renderPage(currentPage)
    }, 150)
  })
}

// --- Auto-init ---

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search)
  const src = params.get('src')
  if (src) {
    initReader(src)
  } else {
    const el = document.querySelector('.reader__loading')
    if (el) {
      el.innerHTML = '<div style="color: var(--status-red);">No document specified</div>'
    }
  }
})
