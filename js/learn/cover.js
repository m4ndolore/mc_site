// js/learn/cover.js — Renders first page of a PDF as a book cover thumbnail

import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export async function renderCover(canvasId, pdfUrl) {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return

  try {
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise
    const page = await pdf.getPage(1)
    const vp = page.getViewport({ scale: 1 })

    const dpr = window.devicePixelRatio || 1
    const targetWidth = canvas.parentElement?.clientWidth || 200
    const s = targetWidth / vp.width
    const scaled = page.getViewport({ scale: s })

    canvas.width = Math.floor(scaled.width * dpr)
    canvas.height = Math.floor(scaled.height * dpr)
    canvas.style.width = `${Math.floor(scaled.width)}px`
    canvas.style.height = `${Math.floor(scaled.height)}px`

    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    await page.render({ canvasContext: ctx, viewport: scaled }).promise
  } catch (err) {
    console.error('[cover] Render failed:', err)
    canvas.style.background = 'var(--slate)'
  }
}
