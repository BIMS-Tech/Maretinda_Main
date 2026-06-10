export default (sp: any) => {
  // Handle wrapped object: { shipping_profile: { name, ... } }
  if (sp?.shipping_profile?.name) {
    const name = sp.shipping_profile.name.includes(":")
      ? sp.shipping_profile.name.split(":")[1]
      : sp.shipping_profile.name
    return {
      ...sp,
      shipping_profile: {
        ...sp.shipping_profile,
        name,
      },
    }
  }
  // Handle flat object: { id, name, ... } (list endpoint)
  if (sp?.name) {
    const name = sp.name.includes(":")
      ? sp.name.split(":")[1]
      : sp.name
    return { ...sp, name }
  }
  return sp
}
