"use client"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import Image from "next/image"

export function CategoryCard({
  category,
}: {
  category: { 
    id: number; 
    name: string; 
    handle: string;
    theme?: {
      primary: string;
      secondary: string;
      accent: string;
      icon: string;
      bgClass: string;
      textClass: string;
      description: string;
    };
  }
}) {
  const theme = category.theme || {
    bgClass: 'bg-gray-50',
    textClass: 'text-gray-800',
    icon: '🛍️',
    description: category.name,
    primary: '#000000'
  };

  return (
    <LocalizedClientLink
      href={`/categories/${category.handle}`}
      className={`relative flex flex-col items-center border rounded-lg transition-all hover:shadow-lg hover:scale-105 w-[280px] min-h-[320px] p-6 ${theme.bgClass}`}
      style={{ 
        borderColor: theme.primary + '20',
        '--category-primary': theme.primary 
      } as React.CSSProperties}
    >
      {/* Icon Section */}
      <div className={`flex items-center justify-center w-20 h-20 rounded-full mb-4 ${theme.bgClass}`} 
           style={{ backgroundColor: theme.primary + '15' }}>
        <span className="text-4xl">{theme.icon}</span>
      </div>
      
      {/* Category Image */}
      <div className="flex relative aspect-square overflow-hidden w-[120px] mb-4">
        <Image
          src={`/images/categories/${category.handle}.png`}
          alt={category.name}
          width={120}
          height={120}
          className="object-contain rounded-lg"
          onError={(e) => {
            // Fallback to a default image or hide if not found
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      {/* Category Info */}
      <div className="text-center flex-1 flex flex-col justify-center">
        <h3 className={`font-bold text-xl mb-2 ${theme.textClass}`}>
          {category.name}
        </h3>
        <p className={`text-sm opacity-80 ${theme.textClass}`}>
          {theme.description}
        </p>
      </div>
      
      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-lg opacity-0 transition-opacity hover:opacity-100" />
    </LocalizedClientLink>
  )
}
