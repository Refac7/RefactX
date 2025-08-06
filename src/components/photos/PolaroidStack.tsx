import React from 'react'
import { motion, useInView } from 'framer-motion'
import type { Photo } from '~/types'
import { cn } from '~/lib/utils'
import PolaroidCard from './PolaroidCard'
import PhotoGalleryModal from './PhotoGalleryModal'

interface Props {
  photos: Photo[]
  title: string
  description?: string
  className?: string
}

// 生成随机旋转角度
const generateRotations = (count: number) => Array.from({ length: count }, () => Math.random() * 20 - 10) // -10 to +10 degrees

const PolaroidStack: React.FC<Props> = ({ photos, title, description, className }) => {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.4 })
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = React.useState(0)

  // 为每张照片生成固定的旋转角度
  const photoRotations = React.useMemo(() => generateRotations(photos.length), [photos.length])

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index)
    setIsModalOpen(true)
  }

  return (
    <>
      <motion.div ref={ref} className={cn('relative perspective-1000 ml-4 flex items-center cursor-pointer', className)}>
        {photos.map((photo, index) => (
          <div key={photo.src} onClick={() => handlePhotoClick(index)}>
            <PolaroidCard
              photo={photo}
              index={index}
              totalPhotos={photos.length}
              rotation={photoRotations[index]}
              variant={photo.variant}
              isVisible={isInView}
            />
          </div>
        ))}
      </motion.div>

      <PhotoGalleryModal
        photos={photos}
        title={title}
        description={description}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialIndex={selectedPhotoIndex}
      />
    </>
  )
}

export default PolaroidStack
