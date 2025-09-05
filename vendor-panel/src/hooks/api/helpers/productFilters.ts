import { HttpTypes } from "@medusajs/types"

// Helper function to check if categoryId matches
export const checkCategoryMatch = (
  categories: HttpTypes.AdminProductCategory[] | null | undefined,
  categoryId: string | string[]
): boolean => {
  if (!categories) return false

  if (Array.isArray(categoryId)) {
    return categories.some((category) => categoryId.includes(category.id))
  }

  return categories.some((category) => category.id === categoryId)
}

// Helper function to check if collectionId matches
export const checkCollectionMatch = (
  collection: { id: string } | null | undefined,
  collectionId: string | string[]
): boolean => {
  if (!collection) return false

  if (Array.isArray(collectionId)) {
    return collectionId.includes(collection.id)
  }

  return collection.id === collectionId
}

// Helper function to check if tagId matches
export const checkTagMatch = (
  tags: { id: string }[] | null | undefined,
  tagId: string | string[]
): boolean => {
  if (!tags?.length) return false

  if (Array.isArray(tagId)) {
    return tags.some((tag) => tagId.includes(tag.id))
  }

  return tags.some((tag) => tag.id === tagId)
}

// Helper function to check if typeId matches
export const checkTypeMatch = (
  typeId: string | null | undefined,
  filterTypeId: string | string[]
): boolean => {
  if (!typeId) return false

  if (Array.isArray(filterTypeId)) {
    return filterTypeId.includes(typeId)
  }

  return typeId === filterTypeId
}

// Helper function to check if status matches
export const checkStatusMatch = (
  status: string | null | undefined,
  filterStatus: string | string[]
): boolean => {
  if (!status) return false

  if (Array.isArray(filterStatus)) {
    return filterStatus.includes(status)
  }

  return status === filterStatus
}
