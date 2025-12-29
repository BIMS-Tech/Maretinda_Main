export const storeSellerFields = [
  'id',
  'store_status',
  'name',
  'handle',
  'description',
  'photo',
  'address_line',
  'city',
  'postal_code',
  'country_code',
  'tax_id',
  'created_at',
  'rating',
  'email'
]

export const storeSellerQueryConfig = {
  list: {
    defaults: storeSellerFields,
    allowed: storeSellerFields,
    isList: true
  },
  retrieve: {
    defaults: storeSellerFields,
    allowed: [
      ...storeSellerFields,
      'reviews',
      'reviews.*',
      'reviews.customer',
      'reviews.customer.*',
      'reviews.seller',
      'reviews.seller.*'
    ],
    isList: false
  }
}
