import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function ProductCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1))
  }

  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-900 relative">
      <div className="relative aspect-video w-full overflow-hidden">
        {/* Main Image */}
        <div className="absolute inset-0">
          <img
            src={images[currentIndex]}
            alt={`Product view ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-zinc-900/80 text-zinc-800 dark:text-zinc-100 rounded-full p-2 border border-zinc-200 dark:border-zinc-700 transition"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-zinc-900/80 text-zinc-800 dark:text-zinc-100 rounded-full p-2 border border-zinc-200 dark:border-zinc-700 transition"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition ${
                index === currentIndex ? "bg-white w-6" : "bg-white/60 w-2 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail Carousel */}
      {images.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto bg-zinc-100 dark:bg-zinc-900 [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border transition ${
                index === currentIndex
                  ? "border-zinc-900 dark:border-zinc-100"
                  : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-500"
              }`}
            >
              <img src={image} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
