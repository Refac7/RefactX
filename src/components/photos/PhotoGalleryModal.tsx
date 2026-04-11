import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import type { Photo } from '~/types'

interface Props {
  photos: Photo[]
  title: string
  description?: string
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

const PhotoGalleryModal: React.FC<Props> = ({ photos, title, description, isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(400)
  const x = useMotionValue(-initialIndex * containerWidth)
  const gap = 16 
  const [canAnimate, setCanAnimate] = useState(false)

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (canAnimate) {
      animate(x, -currentIndex * (containerWidth + gap), { type: 'tween', duration: 0.5, ease: 'easeOut' })
    } else {
      x.set(-currentIndex * (containerWidth + gap))
    }
  }, [currentIndex, containerWidth, x, isOpen, gap, canAnimate])

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      x.set(-initialIndex * (containerWidth + gap))
      setCanAnimate(false)
      setTimeout(() => setCanAnimate(true), 30)
    }
  }, [isOpen, initialIndex, x, containerWidth, gap])

  const handleDragEnd = useCallback(
    (_: any, info: { offset: { x: number } }) => {
      const offset = info.offset.x
      const threshold = (containerWidth + gap) * 0.07
      let newIdx = currentIndex
      if (offset > threshold && currentIndex > 0) {
        newIdx = currentIndex - 1
      } else if (offset < -threshold && currentIndex < photos.length - 1) {
        newIdx = currentIndex + 1
      }
      setCurrentIndex(newIdx)
      animate(x, -newIdx * (containerWidth + gap), { type: 'tween', duration: 0.5, ease: 'easeOut' })
    },
    [containerWidth, gap, photos.length, x, currentIndex]
  )

  const goPrev = () => { if (currentIndex > 0) setCurrentIndex((i) => i - 1) }
  const goNext = () => { if (currentIndex < photos.length - 1) setCurrentIndex((i) => i + 1) }

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, photos.length])

  if (photos.length === 0) return null

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          />

          <motion.div
            className="relative bg-background border border-border/40 shadow-2xl rounded-xl max-w-2xl w-full mx-auto p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
                {description && <p className="text-sm text-muted-foreground mt-1.5">{description}</p>}
              </div>
              <button className="flex items-center justify-center size-8 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0" onClick={onClose}>
                <span className="w-4 h-4 icon-[ph--x-bold]"></span>
              </button>
            </div>

            <div className="relative bg-background rounded-md overflow-hidden" ref={containerRef}>
              <div className="relative overflow-hidden rounded-md" style={{ width: containerWidth }}>
                <motion.div
                  className="flex gap-4"
                  style={{ x, width: photos.length * (containerWidth + gap) - gap }}
                  drag="x"
                  dragConstraints={{ left: -(photos.length - 1) * (containerWidth + gap), right: 0 }}
                  dragElastic={0.1}
                  onDragEnd={handleDragEnd}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  {photos.map((photo) => (
                    <div key={photo.src} className="flex items-center justify-center shrink-0 rounded-md overflow-hidden" style={{ width: containerWidth }}>
                      <img
                        draggable={false}
                        src={photo.src}
                        alt={photo.alt}
                        className="max-w-full max-h-[65vh] object-contain select-none pointer-events-none rounded-md"
                      />
                    </div>
                  ))}
                </motion.div>
              </div>

              {photos.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className={`absolute w-10 h-10 -left-4 top-1/2 -translate-y-1/2 shadow-xs border border-border/40 rounded-full transition-all flex items-center justify-center ${
                      currentIndex === 0
                        ? 'opacity-0 pointer-events-none'
                        : 'bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="w-5 h-5 icon-[ph--caret-left-bold]"></div>
                  </button>
                  <button
                    onClick={goNext}
                    disabled={currentIndex === photos.length - 1}
                    className={`absolute w-10 h-10 -right-4 top-1/2 -translate-y-1/2 shadow-xs border border-border/40 rounded-full transition-all flex items-center justify-center ${
                      currentIndex === photos.length - 1
                        ? 'opacity-0 pointer-events-none'
                        : 'bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="w-5 h-5 icon-[ph--caret-right-bold]"></div>
                  </button>
                </>
              )}
            </div>
            
            {photos.length > 1 && (
                <div className="mt-4 flex justify-center gap-1.5">
                    {photos.map((_, idx) => (
                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-primary' : 'w-1.5 bg-border'}`}></div>
                    ))}
                </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}

export default PhotoGalleryModal