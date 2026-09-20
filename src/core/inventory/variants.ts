export interface VariantOptionGroup {
  readonly id: string
  readonly name: string
  readonly values: readonly string[]
}

export interface VariantCombination {
  readonly key: string
  readonly label: string
  readonly options: Readonly<Record<string, string>>
}

export function buildVariantCombinations(
  groups: readonly VariantOptionGroup[],
): readonly VariantCombination[] {
  const validGroups = groups.filter(
    (group) => group.name.trim() && group.values.length,
  )
  if (!validGroups.length) return []
  return validGroups.reduce<VariantCombination[]>((combinations, group) => {
    const values = [
      ...new Set(group.values.map((value) => value.trim()).filter(Boolean)),
    ]
    if (!combinations.length)
      return values.map((value) => ({
        key: `${group.id}:${value}`,
        label: value,
        options: { [group.name.trim()]: value },
      }))
    return combinations.flatMap((combination) =>
      values.map((value) => ({
        key: `${combination.key}|${group.id}:${value}`,
        label: `${combination.label} / ${value}`,
        options: { ...combination.options, [group.name.trim()]: value },
      })),
    )
  }, [])
}
