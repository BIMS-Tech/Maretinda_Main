export const getComponent = (component: string, values: any[]) => {
  switch (component) {
    // case "unit":
    //   return TextInput
    case "select":
        return () => <AttributeSelect values={values} />
    // case "toggle":
    //   return BooleanInput
  }
}
